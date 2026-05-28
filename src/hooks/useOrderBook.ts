import { useEffect, useRef, useState } from 'react'
import { ORDERBOOK_TOPIC, ORDERBOOK_WS } from '@/constants'
import { applyLevels, applySnapshot, isContinuous, isCrossed, selectRows } from '@/lib/orderBook'
import type { Book, DisplayRow, OrderBookData } from '@/types'

interface OrderBookState {
  asks: DisplayRow[]
  bids: DisplayRow[]
}

/**
 * Live order book: connects to the OSS futures stream, applies the initial
 * snapshot, merges incremental deltas, and re-subscribes on a seqNum gap or
 * a crossed orderbook (best bid >= best ask).
 * Renders are batched per animation frame to absorb bursty deltas.
 */
export function useOrderBook(throttleMs = 0): OrderBookState {
  const [asks, setAsks] = useState<DisplayRow[]>([])
  const [bids, setBids] = useState<DisplayRow[]>([])

  const asksBook     = useRef<Book>(new Map())
  const bidsBook     = useRef<Book>(new Map())
  const lastSeq      = useRef<number | null>(null)
  const wsRef        = useRef<WebSocket | null>(null)
  const flushQueued  = useRef(false)
  const lastFlushAt  = useRef(0)
  const resyncPending = useRef(false)
  // ref so the flush closure always reads the latest value without re-running the effect
  const throttleMsRef = useRef(throttleMs)
  throttleMsRef.current = throttleMs

  useEffect(() => {
    let closedByUs = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    const doFlush = () => {
      flushQueued.current = false
      lastFlushAt.current = Date.now()
      setAsks(selectRows(asksBook.current, 'sell'))
      setBids(selectRows(bidsBook.current, 'buy'))
    }

    const flush = () => {
      if (flushQueued.current) return
      flushQueued.current = true
      const elapsed = Date.now() - lastFlushAt.current
      const wait = Math.max(0, throttleMsRef.current - elapsed)
      if (wait === 0) {
        requestAnimationFrame(doFlush)
      } else {
        setTimeout(() => requestAnimationFrame(doFlush), wait)
      }
    }

    const subscribe = (ws: WebSocket) =>
      ws.send(JSON.stringify({ op: 'subscribe', args: [ORDERBOOK_TOPIC] }))
    const unsubscribe = (ws: WebSocket) =>
      ws.send(JSON.stringify({ op: 'unsubscribe', args: [ORDERBOOK_TOPIC] }))

    // seqNum gap → drop local state and ask for a fresh snapshot.
    // Guard prevents cascading resync: deltas arriving before the new snapshot
    // would each re-trigger resync without the flag.
    const resync = () => {
      if (resyncPending.current) return
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      resyncPending.current = true
      lastSeq.current = null
      unsubscribe(ws)
      subscribe(ws)
    }

    const connect = () => {
      const ws = new WebSocket(ORDERBOOK_WS)
      wsRef.current = ws

      ws.onopen = () => {
        subscribe(ws)
      }

      ws.onmessage = (ev) => {
        let msg: { topic?: string; data?: OrderBookData }
        try {
          msg = JSON.parse(ev.data as string)
        } catch (err) {
          console.error('[useOrderBook] Failed to parse WebSocket message:', err)
          return
        }
        if (!msg.data || !msg.topic?.startsWith('update:')) return
        const data = msg.data

        if (data.type === 'snapshot') {
          resyncPending.current = false
          const built = applySnapshot(data)
          asksBook.current = built.asks
          bidsBook.current = built.bids
          lastSeq.current = data.seqNum
          flush()
          return
        }
        if (data.type === 'delta') {
          if (!isContinuous(data.prevSeqNum, lastSeq.current)) {
            resync()
            return
          }
          applyLevels(asksBook.current, data.asks)
          applyLevels(bidsBook.current, data.bids)
          lastSeq.current = data.seqNum
          // Crossed orderbook (best bid >= best ask) is invalid per BTSE spec.
          if (isCrossed(bidsBook.current, asksBook.current)) {
            resync()
            return
          }
          flush()
        }
      }

      ws.onclose = () => {
        if (!closedByUs) reconnectTimer = setTimeout(connect, 1500)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      closedByUs = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])

  return { asks, bids }
}
