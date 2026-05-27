import { useEffect, useRef, useState } from 'react'
import { TRADE_TOPIC, TRADE_WS } from '@/constants'
import { createSocket } from '@/lib/socket'
import type { PriceTrend } from '@/types'

interface TradeFill {
  price: string | number
}

/**
 * Last traded price + trend vs. the previous value. Per the spec, the last
 * price is the first entry of each trade-history array.
 */
export function useLastPrice(): { price: number | null; trend: PriceTrend } {
  const [price, setPrice] = useState<number | null>(null)
  const [trend, setTrend] = useState<PriceTrend>('same')
  const prev = useRef<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let closedByUs = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      const ws = createSocket(TRADE_WS)
      wsRef.current = ws
      ws.onopen = () =>
        ws.send(JSON.stringify({ op: 'subscribe', args: [TRADE_TOPIC] }))

      ws.onmessage = (ev) => {
        let msg: { topic?: string; data?: TradeFill[] }
        try {
          msg = JSON.parse(ev.data as string)
        } catch {
          return
        }
        if (!msg.topic?.startsWith('tradeHistoryApi') || !Array.isArray(msg.data)) return
        const first = msg.data[0]
        if (!first) return
        const next = Number(first.price)
        const last = prev.current
        setTrend(last === null || next === last ? 'same' : next > last ? 'up' : 'down')
        prev.current = next
        setPrice(next)
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

  return { price, trend }
}
