import { describe, expect, it } from 'vitest'
import {
  applyLevels,
  applySnapshot,
  isContinuous,
  selectRows,
} from '../src/lib/orderBook'
import type { Book, OrderBookData } from '../src/types'

describe('applyLevels', () => {
  it('upserts levels and removes on size 0', () => {
    const book: Book = new Map()
    applyLevels(book, [['100', '5'], ['101', '7']])
    expect(book.get(100)).toBe(5)
    expect(book.get(101)).toBe(7)

    applyLevels(book, [['100', '9'], ['101', '0']])
    expect(book.get(100)).toBe(9) // updated
    expect(book.has(101)).toBe(false) // removed
  })
})

describe('applySnapshot', () => {
  it('builds fresh bid/ask books', () => {
    const data = {
      bids: [['99', '3']],
      asks: [['101', '4']],
      seqNum: 10,
      prevSeqNum: 9,
      type: 'snapshot',
      symbol: 'BTCPFC',
      timestamp: 0,
    } as OrderBookData
    const { bids, asks } = applySnapshot(data)
    expect(bids.get(99)).toBe(3)
    expect(asks.get(101)).toBe(4)
  })
})

describe('isContinuous', () => {
  it('is false until the first packet seeds lastSeqNum', () => {
    expect(isContinuous(9, null)).toBe(false)
  })
  it('requires prevSeqNum to equal the last applied seqNum', () => {
    expect(isContinuous(10, 10)).toBe(true)
    expect(isContinuous(11, 10)).toBe(false) // gap → resync
  })
})

describe('selectRows — sell (asks)', () => {
  const asks: Book = new Map([
    [100, 10],
    [101, 20],
    [102, 30],
    [103, 40],
  ])
  const rows = selectRows(asks, 'sell')

  it('accumulates from the lowest price outward', () => {
    // displayed highest→lowest; totals largest on top, smallest (best ask) at bottom
    expect(rows.map((r) => r.price)).toEqual([103, 102, 101, 100])
    expect(rows.map((r) => r.total)).toEqual([100, 60, 30, 10])
  })

  it('normalises depth percent against the largest total', () => {
    expect(rows[0].percent).toBeCloseTo(1) // 100 / 100
    expect(rows[3].percent).toBeCloseTo(0.1) // 10 / 100
  })
})

describe('selectRows — buy (bids)', () => {
  const bids: Book = new Map([
    [100, 10],
    [101, 20],
    [102, 30],
    [103, 40],
  ])
  const rows = selectRows(bids, 'buy')

  it('accumulates from the highest price downward', () => {
    expect(rows.map((r) => r.price)).toEqual([103, 102, 101, 100])
    expect(rows.map((r) => r.total)).toEqual([40, 70, 90, 100])
  })

  it('puts full depth on the furthest row', () => {
    expect(rows[0].percent).toBeCloseTo(0.4) // best bid
    expect(rows[3].percent).toBeCloseTo(1)
  })
})

describe('selectRows — caps at the requested row count', () => {
  it('keeps only the levels nearest the spread', () => {
    const asks: Book = new Map()
    for (let i = 0; i < 50; i++) asks.set(100 + i, 1)
    const rows = selectRows(asks, 'sell', 8)
    expect(rows).toHaveLength(8)
    // nearest the spread = prices 100..107, displayed 107→100
    expect(rows[0].price).toBe(107)
    expect(rows[7].price).toBe(100)
  })
})
