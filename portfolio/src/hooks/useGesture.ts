import { useEffect, useRef, type RefObject } from 'react'

export interface GestureHandlers {
  /** Called with every scroll/drag delta (px, positive = down). */
  push: (deltaY: number) => void
  /** Called when the user lets go. `idleAware` = the input can pause before release (touch/drag), so stale velocity is ignored. */
  release: (idleAware: boolean) => boolean
  /** Called when a new touch starts. */
  start?: () => void
  /** Arrow / PageUp / PageDown / Space (+1 = down, -1 = up). */
  key?: (direction: 1 | -1) => void
  /** Ignore input while a transition is running. */
  isBlocked?: () => boolean
}

const TOUCH_IGNORE = '.pedal,.handle,.knob,.sw' // draggable / interactive UI keeps its own input
const WHEEL_IGNORE = '.knob'

/**
 * Turns wheel / touch / keyboard input on `ref` into push()/release() calls.
 * Wheel "release" = the stream stops, or the deltas shrink (trackpad momentum) — so the page reacts as soon as fingers lift.
 */
export function useGesture(ref: RefObject<HTMLElement | null>, handlers: GestureHandlers) {
  const h = useRef(handlers)
  h.current = handlers

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // ---- wheel ----
    let lastWheel = 0
    let quiet = false // ignore the momentum tail after a commit
    let timer: ReturnType<typeof setTimeout> | undefined
    let prevMag = 0
    let decel = 0
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest(WHEEL_IGNORE)) return
      const now = performance.now()
      if (now - lastWheel > 90) {
        quiet = false
        prevMag = 0
        decel = 0
      }
      lastWheel = now
      if (h.current.isBlocked?.() || quiet) return

      const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1)
      h.current.push(dy)

      const mag = Math.abs(dy)
      decel = mag < prevMag ? decel + 1 : 0
      prevMag = mag

      clearTimeout(timer)
      if (decel >= 4) {
        h.current.release(false)
        quiet = true
        decel = 0
        return
      }
      timer = setTimeout(() => {
        if (h.current.release(false)) quiet = true
      }, 70)
    }

    // ---- touch ----
    let prevY = 0
    let skip = false
    const onTouchStart = (e: TouchEvent) => {
      skip = !!(e.target as Element).closest(TOUCH_IGNORE)
      prevY = e.touches[0].clientY
      if (!skip) h.current.start?.()
    }
    const onTouchMove = (e: TouchEvent) => {
      if (skip) return
      const y = e.touches[0].clientY
      h.current.push(prevY - y)
      prevY = y
    }
    const onTouchEnd = () => {
      if (!skip) h.current.release(true)
    }

    // ---- keyboard ----
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as Element
      if (t.closest?.('.knob') || (e.key === ' ' && t.tagName === 'BUTTON')) return
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) h.current.key?.(1)
      else if (['ArrowUp', 'PageUp'].includes(e.key)) h.current.key?.(-1)
    }

    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [ref])
}