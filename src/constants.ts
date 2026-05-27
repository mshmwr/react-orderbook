export const SYMBOL = 'BTCPFC'
export const ROWS = 8

// --- WebSocket endpoints + topics (from the spec) ---
export const ORDERBOOK_WS = 'wss://ws.btse.com/ws/oss/futures'
export const ORDERBOOK_TOPIC = `update:${SYMBOL}`
export const TRADE_WS = 'wss://ws.btse.com/ws/futures'
export const TRADE_TOPIC = `tradeHistoryApi:${SYMBOL}`

// --- Colors (from the spec's Styles section) ---
export const COLORS = {
  bg: '#131B29',
  text: '#F0F4F8',
  head: '#8698aa',
  buyText: '#00b15d',
  sellText: '#FF5B5A',
  rowHover: '#1E3059',
  buyBar: 'rgba(16, 186, 104, 0.12)',
  sellBar: 'rgba(255, 90, 90, 0.12)',
  flashGreen: 'rgba(0, 177, 93, 0.5)',
  flashRed: 'rgba(255, 91, 90, 0.5)',
  lastUpText: '#00b15d',
  lastUpBg: 'rgba(16, 186, 104, 0.12)',
  lastDownText: '#FF5B5A',
  lastDownBg: 'rgba(255, 90, 90, 0.12)',
  lastSameText: '#F0F4F8',
  lastSameBg: 'rgba(134, 152, 170, 0.12)',
} as const
