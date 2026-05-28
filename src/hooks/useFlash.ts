import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Flash an element's background once whenever `token` changes to a new
 * non-null value. `token` is the per-tick update id passed only when a flash
 * should fire (otherwise null), so unchanged rows never animate.
 *
 * Uses the Web Animations API so repeat triggers replay cleanly without
 * remounting the row.
 */
export function useFlash(
  ref: RefObject<HTMLElement | null>,
  token: number | null,
  color: string,
): void {
  const lastToken = useRef<number | null>(null)
  const animRef = useRef<Animation | null>(null)
  useEffect(() => {
    if (token === null || token === lastToken.current) return
    lastToken.current = token
    const el = ref.current
    if (!el || typeof el.animate !== 'function') return
    animRef.current?.cancel()
    animRef.current = el.animate(
      [{ backgroundColor: color }, { backgroundColor: 'transparent' }],
      { duration: 400, easing: 'ease-out' },
    )
  }, [token, color, ref])
}
