import { ROWS } from '@/constants'
import type { Book, DisplayRow, OrderBookData, PriceLevel, Side } from '@/types'

/** Apply a list of [price, size] levels to a book. size 0 removes the level. */
export function applyLevels(book: Book, levels: PriceLevel[]): void {
  for (const [priceStr, sizeStr] of levels) {
    const price = Number(priceStr)
    const size = Number(sizeStr)
    if (!isFinite(price) || !isFinite(size)) continue
    if (size === 0) book.delete(price)
    else book.set(price, size)
  }
}

/** Build fresh bid/ask books from a snapshot packet. */
export function applySnapshot(data: OrderBookData): { bids: Book; asks: Book } {
  const bids: Book = new Map()
  const asks: Book = new Map()
  applyLevels(bids, data.bids)
  applyLevels(asks, data.asks)
  return { bids, asks }
}

/**
 * seqNum continuity check. A delta's prevSeqNum must equal the seqNum of the
 * last packet we applied; otherwise we dropped a packet and must re-subscribe
 * to fetch a fresh snapshot.
 */
export function isContinuous(prevSeqNum: number, lastSeqNum: number | null): boolean {
  if (lastSeqNum === null) return false
  return prevSeqNum === lastSeqNum
}

/**
 * Crossed orderbook guard. Returns true when the best bid (highest price in
 * the bid book) is >= the best ask (lowest price in the ask book).
 * Per BTSE API spec, this is an invalid state — caller should resync.
 * Returns false when either book is empty (no spread to evaluate).
 */
export function isCrossed(bids: Book, asks: Book): boolean {
  if (bids.size === 0 || asks.size === 0) return false
  let bestBid = -Infinity
  for (const p of bids.keys()) if (p > bestBid) bestBid = p
  let bestAsk = Infinity
  for (const p of asks.keys()) if (p < bestAsk) bestAsk = p
  return bestBid >= bestAsk
}

/**
 * Select the `rows` levels nearest the spread, annotated with cumulative total
 * and depth percentage, ordered for display.
 *
 * Quote total formula (spec):
 *   - sell (asks): sum size from the lowest price quote to the highest
 *   - buy  (bids): sum size from the highest price quote to the lowest
 * i.e. the cumulative always grows as you move away from the spread.
 *
 * Depth percent = this row's cumulative total / largest displayed total.
 *
 * Display order matches the BTSE UI: sells render highest→lowest (best ask at
 * the bottom, next to the last price); buys render highest→lowest (best bid at
 * the top, next to the last price).
 */
export function selectRows(book: Book, side: Side, rows: number = ROWS): DisplayRow[] {
  const entries = [...book.entries()]
  const sorted =
    side === 'sell'
      ? entries.sort((a, b) => a[0] - b[0]) // ascending: best ask (lowest) first
      : entries.sort((a, b) => b[0] - a[0]) // descending: best bid (highest) first
  const top = sorted.slice(0, rows)

  let cumulative = 0
  const withTotals = top.map(([price, size]) => {
    cumulative += size
    return { price, size, total: cumulative }
  })
  const maxTotal = cumulative || 1
  const display: DisplayRow[] = withTotals.map((r) => ({
    ...r,
    percent: r.total / maxTotal,
  }))

  // Sells were accumulated best→worst (lowest→highest); reverse so the highest
  // price (largest total) sits on top. Buys already read highest→lowest.
  return side === 'sell' ? display.reverse() : display
}
