import { useState } from 'react'
import { OrderBook } from '@/components/OrderBook'
import { useLastPrice } from '@/hooks/useLastPrice'
import { useOrderBook } from '@/hooks/useOrderBook'

const THROTTLE_MS = 300

export default function App() {
  const [throttled, setThrottled] = useState(false)
  const { asks, bids, status } = useOrderBook(throttled ? THROTTLE_MS : 0)
  const { price, trend } = useLastPrice()

  return (
    <div className="app">
      <OrderBook
        asks={asks}
        bids={bids}
        lastPrice={price}
        trend={trend}
        status={status}
        throttled={throttled}
        onToggleThrottle={() => setThrottled((v) => !v)}
      />
    </div>
  )
}
