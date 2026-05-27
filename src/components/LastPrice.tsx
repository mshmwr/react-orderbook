import { COLORS } from '@/constants'
import { formatPrice } from '@/utils/format'
import type { PriceTrend } from '@/types'

interface Props {
  price: number | null
  trend: PriceTrend
}

const STYLE: Record<PriceTrend, { color: string; background: string; arrow: string }> = {
  up: { color: COLORS.lastUpText, background: COLORS.lastUpBg, arrow: '↑' },
  down: { color: COLORS.lastDownText, background: COLORS.lastDownBg, arrow: '↓' },
  same: { color: COLORS.lastSameText, background: COLORS.lastSameBg, arrow: '' },
}

export function LastPrice({ price, trend }: Props) {
  const s = STYLE[trend]
  return (
    <div className="ob-last" style={{ color: s.color, background: s.background }}>
      <span>{price == null ? '—' : formatPrice(price)}</span>
      {s.arrow && <span className="ob-last__arrow">{s.arrow}</span>}
    </div>
  )
}
