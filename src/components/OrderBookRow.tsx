import { useRef } from 'react'
import { COLORS } from '../constants'
import { useFlash } from '../hooks/useFlash'
import { formatPrice, formatSize } from '../utils/format'
import type { DisplayRow, Side } from '../types'

export interface AnnotatedRow extends DisplayRow {
  /** Price not present in the previous render → new-quote flash. */
  isNew: boolean
  /** Size change direction vs. previous render. */
  sizeDir: 'up' | 'down' | null
}

interface Props {
  side: Side
  row: AnnotatedRow
  /** Monotonic per-tick id; flashes fire only when this advances. */
  token: number
}

export function OrderBookRow({ side, row, token }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)

  // New-quote flash on the whole row: red for sells, green for buys.
  useFlash(rowRef, row.isNew ? token : null, side === 'sell' ? COLORS.flashRed : COLORS.flashGreen)
  // Size-change flash on the size cell: green up, red down.
  useFlash(sizeRef, row.sizeDir ? token : null, row.sizeDir === 'up' ? COLORS.flashGreen : COLORS.flashRed)

  const barColor = side === 'sell' ? COLORS.sellBar : COLORS.buyBar
  const priceColor = side === 'sell' ? COLORS.sellText : COLORS.buyText

  return (
    <div className="ob-row" ref={rowRef}>
      <div className="ob-row__bar" style={{ width: `${row.percent * 100}%`, background: barColor }} />
      <div className="ob-row__price" style={{ color: priceColor }}>{formatPrice(row.price)}</div>
      <div className="ob-row__size" ref={sizeRef}>{formatSize(row.size)}</div>
      <div className="ob-row__total">{formatSize(row.total)}</div>
    </div>
  )
}
