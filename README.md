# react-orderbook

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
```

Connects to the live BTSE WebSocket endpoints on startup. No additional setup required.

## Usage

The orderbook renders live by default, flushing one React state update per animation frame (≈ 60 fps).

Click the **⚡ live** button in the top-right corner to switch to **🐢 300 ms throttle** mode — updates are coalesced into a fixed 300 ms interval instead of every frame. Click again to return to live mode.

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc --noEmit` + Vite production bundle |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest unit tests (single run) |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | Type-check only, no emit |

---

## Architecture

Three strict layers — lib has no React imports, hooks have no component imports.

```
src/
├── lib/
│   └── orderBook.ts      # Pure functions: applyLevels · applySnapshot · isContinuous · isCrossed · selectRows
├── hooks/
│   ├── useOrderBook.ts   # WS lifecycle · snapshot/delta merge · rAF-batched state flush
│   ├── useLastPrice.ts   # Trade stream → last price + trend
│   └── useFlash.ts       # Web Animations API wrapper, token-triggered
├── components/
│   ├── OrderBook.tsx     # Layout shell, throttle toggle
│   ├── OrderBookSide.tsx # Per-render diff → isNew + sizeDir annotations
│   ├── OrderBookRow.tsx  # Flash wiring, depth bar
│   └── LastPrice.tsx     # Last price display
├── utils/
│   └── format.ts         # formatPrice · formatSize (thousands separator)
├── types.ts              # Book · DisplayRow · PriceTrend · …
└── constants.ts          # SYMBOL · ROWS · WS endpoints · COLORS
```

### Design decisions worth noting

**`Book = Map<number, number>` (price → size)**  
O(1) set/delete per level. Arrays would require O(n) `findIndex` on every delta tick.

**Refs hold book state; React state holds display rows**  
`asksBook` / `bidsBook` are `useRef<Book>`. Merging deltas never triggers a render — only `flush()` does, once per animation frame.

**`resyncPending` guard in `useOrderBook`**  
Without this flag, each orphaned delta arriving before the fresh snapshot re-triggers `unsubscribe + subscribe`, causing a cascade of re-subscribe requests to the server.

**Flash diff in `OrderBookSide`, not `OrderBookRow`**  
The parent computes `isNew` / `sizeDir` and passes them as props. The previous-frame map is committed in `useEffect` (after all child flash effects run), so children always diff against the *prior* frame's snapshot — not the current one.

---

## Requirements → Code

| Requirement | File(s) | Key symbol(s) |
|-------------|---------|---------------|
| Max 8 quotes per side | `constants.ts` | `ROWS = 8` |
| Snapshot + delta merge | `lib/orderBook.ts` | `applySnapshot`, `applyLevels` |
| seqNum gap → re-subscribe for new snapshot | `lib/orderBook.ts` · `hooks/useOrderBook.ts` | `isContinuous`, `resync()` |
| Minimize unnecessary reconnections | `hooks/useOrderBook.ts` | `resyncPending` ref guard |
| Crossed-orderbook detection | `lib/orderBook.ts` · `hooks/useOrderBook.ts` | `isCrossed`, checked after every delta |
| Sell total: accumulate lowest → highest | `lib/orderBook.ts` | `selectRows` — sort ascending, reverse for display |
| Buy total: accumulate highest → lowest | `lib/orderBook.ts` | `selectRows` — sort descending |
| Depth percentage bar | `lib/orderBook.ts` · `components/OrderBookRow.tsx` | `DisplayRow.percent` → `<div class="bar">` |
| New-quote row flash (red/green) | `components/OrderBookSide.tsx` · `OrderBookRow.tsx` · `hooks/useFlash.ts` | `isNew` → `useFlash(rowRef, …)` |
| Size-change cell flash (green up / red down) | `components/OrderBookSide.tsx` · `OrderBookRow.tsx` · `hooks/useFlash.ts` | `sizeDir` → `useFlash(sizeRef, …)` |
| Flash colors | `constants.ts` | `COLORS.flashRed` · `COLORS.flashGreen` |
| Last price + trend direction | `hooks/useLastPrice.ts` · `components/LastPrice.tsx` | `PriceTrend`, first entry of trade array |
| Number formatting (thousands separator) | `utils/format.ts` | `formatPrice`, `formatSize` |
| Row hover color | `index.scss` | `.row:hover` |
| Auto-reconnect on WS close | `hooks/useOrderBook.ts` · `hooks/useLastPrice.ts` | `ws.onclose → setTimeout(connect, 1500)` |
| rAF render batching | `hooks/useOrderBook.ts` | `flush()` + `requestAnimationFrame(doFlush)` |
| Optional 300 ms throttle | `hooks/useOrderBook.ts` · `components/OrderBook.tsx` | `throttleMs` param, toggle button |
| All spec color tokens | `constants.ts` | `COLORS` object (single source of truth) |
| Unit tests (pure functions only) | `tests/` | `lib/orderBook.ts` + `utils/format.ts` |
