import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import {
  EDGE_RESISTANCE,
  FLICK_VELOCITY_THRESHOLD,
  FULL_SCROLL_DISTANCE_PX,
  PAGES,
  RIPPLE_DURATION_MS,
  SWAP_PROGRESS_THRESHOLD,
  VELOCITY_MEASURE_WINDOW_MS,
} from '../config'
import type { GestureEvent, WaveBus } from '../types'
import { clamp } from '../utils/math'
import { useGesture } from './useGesture'

/**
 * Page state machine.
 *  - scrolling / dragging the wave only *previews* the change (CSS var --tp slides + fades [data-tp] elements)
 *  - on release: commit if flicked fast enough or dragged far enough, otherwise revert
 *  - commit = finish the slide, shoreline wash (via bus.rippleStart), swap pages while covered, new page slides in
 */
export function usePageTransition(
  scrollerRef: RefObject<HTMLDivElement | null>,
  sectionRefs: RefObject<HTMLElement | null>[],
  bus: RefObject<WaveBus>
) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [animKeys, setAnimKeys] = useState<number[]>(() => PAGES.map(() => 0)) // bumps -> replays each page's title animation
  const indexRef = useRef(0)
  const busy = useRef(false)
  const gesture = useRef<{ acc: number; events: GestureEvent[] }>({ acc: 0, events: [] })
  const dragY = useRef<number | null>(null)

  const canGo = (dir: number) => {
    const next = indexRef.current + dir
    return dir !== 0 && next >= 0 && next < PAGES.length
  }
  const setProgress = (p: number) => scrollerRef.current?.style.setProperty('--tp', String(p))
  const resetGesture = () => {
    gesture.current = { acc: 0, events: [] }
    bus.current.phase = 0
  }

  const revert = () => {
    const el = scrollerRef.current
    if (!el) return
    resetGesture()
    el.classList.add('settle')
    setProgress(0)
    setTimeout(() => el.classList.remove('settle'), 500)
  }

  const push = (dy: number) => {
    if (busy.current) return
    const g = gesture.current
    const now = performance.now()
    g.events.push({ time: now, deltaY: dy })
    g.events = g.events.filter((e) => now - e.time < VELOCITY_MEASURE_WINDOW_MS * 3)

    // elastic resistance when pulling past the first / last page
    const next = g.acc + dy
    const delta = next !== 0 && !canGo(Math.sign(next)) ? dy * EDGE_RESISTANCE : dy
    g.acc = clamp(g.acc + delta, -FULL_SCROLL_DISTANCE_PX, FULL_SCROLL_DISTANCE_PX)

    const sign = Math.sign(g.acc)
    setProgress(((canGo(sign) ? 1 : -1) * Math.abs(g.acc)) / FULL_SCROLL_DISTANCE_PX)
    bus.current.phase = g.acc
    bus.current.energyKick += Math.abs(dy) * 0.003
  }

  const travel = (target: number) => {
    const el = scrollerRef.current
    if (!el || busy.current) return
    if (target === indexRef.current || target < 0 || target >= PAGES.length) return revert()

    busy.current = true
    bus.current.rippleStart = performance.now()
    el.classList.add('settle')
    setProgress(1)

    setTimeout(() => {
      el.scrollTo({ top: sectionRefs[target].current?.offsetTop ?? 0, behavior: 'instant' })
      indexRef.current = target
      bus.current.mixTarget = PAGES[target].wave
      resetGesture()
      el.classList.remove('settle')
      setProgress(1) // new page starts off to the right and transparent...
      void el.offsetWidth
      setTimeout(() => {
        el.classList.add('settle') // ...then slides in as the wash clears
        setProgress(0)
      }, 60)
      setTimeout(() => el.classList.remove('settle'), 700)
      setActiveIndex(target)
      setAnimKeys((keys) => keys.map((k, i) => (i === target ? k + 1 : k)))
    }, RIPPLE_DURATION_MS * SWAP_PROGRESS_THRESHOLD)

    setTimeout(() => {
      busy.current = false
    }, RIPPLE_DURATION_MS + 100)
  }

  // commit if fast enough in some direction, or dragged far enough; otherwise revert
  const release = (idleAware: boolean) => {
    if (busy.current) return false
    const g = gesture.current
    const now = performance.now()
    const last = g.events.length ? g.events[g.events.length - 1].time : now
    const sum = g.events.filter((e) => last - e.time <= VELOCITY_MEASURE_WINDOW_MS).reduce((s, e) => s + e.deltaY, 0)
    let velocity = sum / VELOCITY_MEASURE_WINDOW_MS
    if (idleAware && now - last > VELOCITY_MEASURE_WINDOW_MS) velocity = 0 // finger rested before letting go

    const byFlick = Math.abs(velocity) >= FLICK_VELOCITY_THRESHOLD ? Math.sign(velocity) : 0
    const byDrag = Math.abs(g.acc) / FULL_SCROLL_DISTANCE_PX >= 0.5 ? Math.sign(g.acc) : 0
    const dir = byFlick || byDrag
    if (dir && canGo(dir)) {
      travel(indexRef.current + dir)
      return true
    }
    revert()
    return false
  }

  useGesture(scrollerRef, {
    push,
    release,
    start: resetGesture,
    isBlocked: () => busy.current,
    key: (dir) => canGo(dir) && travel(indexRef.current + dir),
  })

  // keep the current page aligned on resize
  useEffect(() => {
    const onResize = () => scrollerRef.current?.scrollTo({ top: sectionRefs[indexRef.current].current?.offsetTop ?? 0, behavior: 'instant' })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // drag the wave vertically = same gesture as scrolling (drag up = next page)
  const waveHandleProps = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      dragY.current = e.clientY
      resetGesture()
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (dragY.current === null) return
      push((dragY.current - e.clientY) * 1.5)
      dragY.current = e.clientY
    },
    onPointerUp: () => {
      if (dragY.current === null) return
      dragY.current = null
      release(true)
    },
    onPointerCancel: () => {
      if (dragY.current === null) return
      dragY.current = null
      release(true)
    },
  }

  return { activeIndex, animKeys, goToPage: travel, waveHandleProps }
}