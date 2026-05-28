# Order Book — Assignment Spec

> Source: BTSE take-home (Notion). Last Update: 2023/7/28. Market symbol updated `BTC-PERP` → `BTCPFC`.
> This file is the markdown transcription of the original Notion / PDF brief.

## Tasks

- **Framework:** React, Vue.js — implemented fully in TypeScript.
- Show **max 8 quotes** for both buy and sell. Quote row should vertical align center.
- **Format number with commas** as thousands separators.
- Add **hover background color** on the whole row when the mouse hovers a quote.

### Last price color style

| Condition | Text color | Background color |
|-----------|-----------|------------------|
| current last price > previous | `#00b15d` | `rgba(16, 186, 104, 0.12)` |
| current last price < previous | `#FF5B5A` | `rgba(255, 90, 90, 0.12)` |
| price is the same | `#F0F4F8` | `rgba(134, 152, 170, 0.12)` |

### Quote total formula

- **Sell quotes:** sum up quote size from the lowest price quote to the highest.
- **Buy quotes:** sum up quote size from the highest price quote to the lowest.

### Accumulative total size percentage bar

- `current quote accumulative total size / total quote size of buy or sell`.

### Quote highlight animation

- **New quote** (price hasn't shown on the order book before): flash the whole quote row. Red background for sell quote, green background for buy quote.
- **Size change:** flash the size cell. Green background if size increases, red background if size decreases.

## OrderBook WebSocket API

- **Endpoint:** `wss://ws.btse.com/ws/oss/futures`
- **Topic:** `update:BTCPFC`
- **API doc:** https://btsecom.github.io/docs/futures/en/#orderbook-incremental-updates
- The first response is a **snapshot** of the current order book (`type` = `snapshot`); 50 levels are returned. Incremental updates are sent in subsequent packets with `type` = `delta`.
- **Re-subscribe** the topic to get a new snapshot if `prevSeqNum` of new data doesn't match the last data's `seqNum`.

## Last price WebSocket API

- Use the **first price in the array** as the last price.
- **Endpoint:** `wss://ws.btse.com/ws/futures`
- **Topic:** `tradeHistoryApi:BTCPFC`
- **API doc:** https://btsecom.github.io/docs/futures/en/#public-trade-fills

## Non-functional Requirements

> Source: LinkedIn message supplement (2026-05-28).

- **Orderbook correctness and data consistency are the highest priority** in this assignment.
- The local orderbook state should always remain **synchronized with the exchange incremental update stream**.
- Candidates are expected to correctly handle **websocket sequencing and recovery scenarios**.
- UI completeness and visual effects are **secondary** to maintaining an accurate orderbook state.
- The implementation should **minimize unnecessary websocket reconnections** during normal recovery flows.

## Styles

| Token | Value |
|-------|-------|
| Background color | `#131B29` |
| Default text color | `#F0F4F8` |
| Quote table head text color | `#8698aa` |
| Buy quote price text color | `#00b15d` |
| Sell quote price text color | `#FF5B5A` |
| Quote row hover background color | `#1E3059` |
| Buy quote accumulative total size bar color | `rgba(16, 186, 104, 0.12)` |
| Sell quote accumulative total size bar color | `rgba(255, 90, 90, 0.12)` |
| Animation flash green background color | `rgba(0, 177, 93, 0.5)` |
| Animation flash red background color | `rgba(255, 91, 90, 0.5)` |
