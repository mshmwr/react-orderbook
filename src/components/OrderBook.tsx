import { LastPrice } from '@/components/LastPrice'
import { OrderBookSide } from '@/components/OrderBookSide'
import type { ConnStatus, DisplayRow, PriceTrend } from '@/types'

interface Props {
  asks: DisplayRow[]
  bids: DisplayRow[]
  lastPrice: number | null
  trend: PriceTrend
  status: ConnStatus
  throttled: boolean
  onToggleThrottle: () => void
}

export function OrderBook({ asks, bids, lastPrice, trend, status, throttled, onToggleThrottle }: Props) {
  return (
    <section className="ob">
      <header className="ob__title">
        <h1>Order Book</h1>
        <div className="ob__controls">
          <button
            className="ob__throttle-btn"
            data-active={throttled}
            onClick={onToggleThrottle}
            title={throttled ? 'Throttle ON — click to turn off' : 'Throttle OFF — click to turn on'}
          >
            {throttled ? '🐢 300ms' : '⚡ live'}
          </button>
          <span className="ob__status" data-status={status}>{status}</span>
        </div>
      </header>
      <div className="ob__head">
        <span>Price (USD)</span>
        <span>Size</span>
        <span>Total</span>
      </div>
      <OrderBookSide side="sell" rows={asks} />
      <LastPrice price={lastPrice} trend={trend} />
      <OrderBookSide side="buy" rows={bids} />
    </section>
  )
}
