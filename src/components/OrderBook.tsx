import { LastPrice } from '@/components/LastPrice'
import { OrderBookSide } from '@/components/OrderBookSide'
import type { DisplayRow, PriceTrend } from '@/types'

interface Props {
  asks: DisplayRow[]
  bids: DisplayRow[]
  lastPrice: number | null
  trend: PriceTrend
  throttled: boolean
  onToggleThrottle: () => void
}

export function OrderBook({ asks, bids, lastPrice, trend, throttled, onToggleThrottle }: Props) {
  return (
    <section className="ob">
      <header className="title">
        <h1>Order Book</h1>
        <div className="controls">
          <button
            className="throttle-btn"
            data-active={throttled}
            onClick={onToggleThrottle}
            title={throttled ? 'Throttle ON — click to turn off' : 'Throttle OFF — click to turn on'}
          >
            {throttled ? '🐢 300ms' : '⚡ live'}
          </button>
        </div>
      </header>
      <div className="head">
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
