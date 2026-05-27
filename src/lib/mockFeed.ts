import { SYMBOL } from '../constants'

type Listener = ((ev: { data: string }) => void) | null
type OpenListener = ((ev: unknown) => void) | null

/**
 * A WebSocket look-alike that replays BTSE-shaped order book + trade messages,
 * so the app is demoable offline. Enabled with VITE_MOCK=1 (see lib/socket.ts).
 *
 * It honours the real protocol surface the hooks rely on:
 *   { op: 'subscribe' | 'unsubscribe', args: [topic] }
 *   → snapshot/delta packets for `update:*`, trade arrays for `tradeHistoryApi:*`.
 */
export class MockSocket {
  onopen: OpenListener = null
  onmessage: Listener = null
  onclose: OpenListener = null
  onerror: OpenListener = null
  readyState = 0 // CONNECTING

  private bids = new Map<number, number>()
  private asks = new Map<number, number>()
  private mid = 21657.5
  private seq = 1
  private last: number | null = null
  private tradeId = 1
  private bookTimer: ReturnType<typeof setInterval> | null = null
  private tradeTimer: ReturnType<typeof setInterval> | null = null

  constructor(_url: string) {
    setTimeout(() => {
      this.readyState = 1 // OPEN
      this.onopen?.({})
    }, 40)
  }

  send(raw: string): void {
    const msg = JSON.parse(raw) as { op?: string; args?: string[] }
    const topic = msg.args?.[0] ?? ''
    if (msg.op === 'unsubscribe') {
      this.stopBook()
      this.stopTrade()
      return
    }
    if (msg.op !== 'subscribe') return
    if (topic.startsWith('update:')) this.startBook(topic)
    else if (topic.startsWith('tradeHistoryApi')) this.startTrade(topic)
  }

  close(): void {
    this.stopBook()
    this.stopTrade()
    this.readyState = 3 // CLOSED
    this.onclose?.({})
  }

  // --- internals ---

  private rndSize(): number {
    return Math.floor(40 + Math.random() * 4000)
  }

  private levels(m: Map<number, number>): [string, string][] {
    return [...m.entries()].map(([p, s]) => [p.toFixed(1), String(s)])
  }

  private emit(topic: string, data: unknown): void {
    this.onmessage?.({ data: JSON.stringify({ topic, data }) })
  }

  private startBook(topic: string): void {
    this.stopBook()
    this.asks.clear()
    this.bids.clear()
    for (let i = 1; i <= 50; i++) {
      this.asks.set(this.mid + 0.5 * i, this.rndSize())
      this.bids.set(this.mid - 0.5 * i, this.rndSize())
    }
    this.seq += 1
    this.emit(topic, {
      bids: this.levels(this.bids),
      asks: this.levels(this.asks),
      seqNum: this.seq,
      prevSeqNum: this.seq - 1,
      type: 'snapshot',
      symbol: SYMBOL,
      timestamp: Date.now(),
    })
    this.bookTimer = setInterval(() => this.tickBook(topic), 450)
  }

  private tickBook(topic: string): void {
    const dAsks = this.mutate(this.asks, true)
    const dBids = this.mutate(this.bids, false)
    const prev = this.seq
    this.seq += 1
    this.emit(topic, {
      bids: dBids,
      asks: dAsks,
      seqNum: this.seq,
      prevSeqNum: prev,
      type: 'delta',
      symbol: SYMBOL,
      timestamp: Date.now(),
    })
  }

  /** Mutate a few near-spread levels; occasionally delete one (shifts the
   *  visible window → new-quote flash). Replenish the far edge when drained. */
  private mutate(m: Map<number, number>, isAsk: boolean): [string, string][] {
    const deltas: [string, string][] = []
    const near = [...m.keys()].sort((x, y) => (isAsk ? x - y : y - x))
    const count = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const p = near[Math.floor(Math.random() * Math.min(near.length, 12))]
      if (p === undefined) continue
      if (Math.random() < 0.12) {
        m.delete(p)
        deltas.push([p.toFixed(1), '0'])
      } else {
        const size = this.rndSize()
        m.set(p, size)
        deltas.push([p.toFixed(1), String(size)])
      }
    }
    if (m.size < 24) {
      const edge = isAsk ? Math.max(...m.keys()) : Math.min(...m.keys())
      for (let k = 1; k <= 8; k++) {
        const np = isAsk ? edge + 0.5 * k : edge - 0.5 * k
        const size = this.rndSize()
        m.set(np, size)
        deltas.push([np.toFixed(1), String(size)])
      }
    }
    return deltas
  }

  private startTrade(topic: string): void {
    this.stopTrade()
    const emitTrade = () => {
      const step = [-0.5, 0, 0.5][Math.floor(Math.random() * 3)]
      let next = (this.last ?? this.mid) + step
      next = Math.max(this.mid - 50, Math.min(this.mid + 50, next))
      this.last = next
      this.emit(topic, [
        {
          symbol: SYMBOL,
          side: step >= 0 ? 'BUY' : 'SELL',
          size: this.rndSize(),
          price: next.toFixed(1),
          tradeId: this.tradeId++,
          timestamp: Date.now(),
        },
      ])
    }
    emitTrade()
    this.tradeTimer = setInterval(emitTrade, 800)
  }

  private stopBook(): void {
    if (this.bookTimer) clearInterval(this.bookTimer)
    this.bookTimer = null
  }

  private stopTrade(): void {
    if (this.tradeTimer) clearInterval(this.tradeTimer)
    this.tradeTimer = null
  }
}
