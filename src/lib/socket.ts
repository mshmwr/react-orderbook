import { MockSocket } from './mockFeed'

/** Set VITE_MOCK=1 to drive the UI from the offline replay feed. */
export const USE_MOCK = import.meta.env.VITE_MOCK === '1'

/**
 * Create a WebSocket (or the offline mock). The mock implements only the
 * surface the hooks use, so we cast it to WebSocket for a single call site.
 */
export function createSocket(url: string): WebSocket {
  if (USE_MOCK) return new MockSocket(url) as unknown as WebSocket
  return new WebSocket(url)
}
