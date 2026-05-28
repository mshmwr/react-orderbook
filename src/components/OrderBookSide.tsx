import { useEffect, useMemo, useRef } from 'react'
import { OrderBookRow } from '@/components/OrderBookRow'
import type { AnnotatedRow } from '@/components/OrderBookRow'
import type { DisplayRow, Side } from '@/types'

interface Props {
  side: Side
  rows: DisplayRow[]
}

/**
 * Renders one side of the book and decides per-row flash animations by diffing
 * each render's prices/sizes against the previously committed snapshot.
 *
 * The previous map is committed in an effect (after child flash effects run, so
 * rows still see the correct diff). The first hydration is suppressed so the
 * initial snapshot doesn't flash all eight rows.
 */
export function OrderBookSide({ side, rows }: Props) {
  const prevSizes = useRef<Map<number, number>>(new Map())
  const tokenRef = useRef(0)
  const prevRowsRef = useRef<DisplayRow[] | null>(null)
  if (prevRowsRef.current !== rows) {
    tokenRef.current += 1
    prevRowsRef.current = rows
  }
  const token = tokenRef.current

  const hydrated = prevSizes.current.size > 0
  const annotated = useMemo<AnnotatedRow[]>(() => rows.map((r) => {
    const prev = prevSizes.current.get(r.price)
    const isNew = hydrated && prev === undefined
    let sizeDir: AnnotatedRow['sizeDir'] = null
    if (prev !== undefined) {
      if (r.size > prev) sizeDir = 'up'
      else if (r.size < prev) sizeDir = 'down'
    }
    return { ...r, isNew, sizeDir }
  }), [rows, hydrated])

  useEffect(() => {
    const next = new Map<number, number>()
    for (const r of rows) next.set(r.price, r.size)
    prevSizes.current = next
  })

  return (
    <div className="side" data-side={side}>
      {annotated.map((row) => (
        <OrderBookRow key={row.price} side={side} row={row} token={token} />
      ))}
    </div>
  )
}
