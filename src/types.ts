export type Side = 'buy' | 'sell'

/** Raw [price, size] tuple as delivered by the BTSE WebSocket (both strings). */
export type PriceLevel = [price: string, size: string]

/** Working order book state: price -> size. */
export type Book = Map<number, number>

export interface OrderBookData {
  bids: PriceLevel[]
  asks: PriceLevel[]
  seqNum: number
  prevSeqNum: number
  type: 'snapshot' | 'delta'
  symbol: string
  timestamp: number
}

/** A single quote row prepared for display. */
export interface DisplayRow {
  price: number
  size: number
  /** Cumulative (accumulative) total size from the best price outward. */
  total: number
  /** Depth bar fill, 0..1, = total / largest displayed total on this side. */
  percent: number
}

export type PriceTrend = 'up' | 'down' | 'same'
