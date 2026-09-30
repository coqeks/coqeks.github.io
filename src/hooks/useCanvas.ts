import { useEffect, useRef, type RefObject } from 'react'

/** Runs `callback` every animation frame (always calls the latest closure). */
export function useAnimationFrame(callback: () => void) {
  const ref = useRef(callback)
  ref.current = callback
  useEffect(() => {
    let id = requestAnimationFrame(function loop() {
      ref.current()
      id = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(id)
  }, [])
}

export interface Surface {
  ctx: CanvasRenderingContext2D | null
  w: number
  h: number
  dpr: number
}

/** Keeps a canvas sized to its CSS box (DPR aware). Read `surface.current` inside your draw loop. */
export function useCanvasSurface(canvasRef: RefObject<HTMLCanvasElement | null>, onResize?: (w: number, h: number) => void) {
  const surface = useRef<Surface>({ ctx: null, w: 0, h: 0, dpr: 1 })
  const cb = useRef(onResize)
  cb.current = onResize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const r = canvas.getBoundingClientRect()
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      surface.current = { ctx, w: r.width, h: r.height, dpr }
      cb.current?.(r.width, r.height)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [canvasRef])
  return surface
}

export interface ThemeColors {
  ink: string
  accent: string
  dim: string
}

/** Live copy of the CSS theme colours (updates when <html data-theme> changes). */
export function useThemeColors() {
  const colors = useRef<ThemeColors>({ ink: '#fff', accent: '#fff', dim: '#999' })
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement)
      colors.current = {
        ink: s.getPropertyValue('--ink').trim(),
        accent: s.getPropertyValue('--accent').trim(),
        dim: s.getPropertyValue('--dim').trim(),
      }
    }
    read()
    const obs = new MutationObserver(() => {
      read()
      setTimeout(read, 520) // after the CSS colour transition
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return colors
}