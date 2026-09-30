import { useEffect, useRef, type RefObject } from 'react'
import { NUM_STRINGS } from '../config'
import { useAnimationFrame, useCanvasSurface, useThemeColors } from './useCanvas'

/** Draws the six vibrating strings and detects mouse/touch swipes across them. */
export function useStrings(canvasRef: RefObject<HTMLCanvasElement | null>, onPluck: (stringIndex: number, velocity: number) => void) {
  const colors = useThemeColors()
  const surface = useCanvasSurface(canvasRef)
  const strings = useRef(Array.from({ length: NUM_STRINGS }, () => ({ amplitude: 0, phase: 0 })))
  const pluckRef = useRef(onPluck)
  pluckRef.current = onPluck

  useEffect(() => {
    let last: { x: number } | null = null
    const onMove = (e: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (last && y >= -20 && y <= r.height + 20) {
        const dx = x - last.x
        if (dx) {
          for (let i = 0; i < NUM_STRINGS; i++) {
            const sx = ((i + 0.5) / NUM_STRINGS) * r.width
            if ((last.x < sx && x >= sx) || (last.x > sx && x <= sx)) {
              const velocity = Math.min(1, Math.abs(dx) / 40)
              strings.current[i].amplitude = 3 + velocity * 2
              pluckRef.current(i, velocity)
            }
          }
        }
      }
      last = { x }
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [canvasRef])

  useAnimationFrame(() => {
    const { ctx, w, h, dpr } = surface.current
    if (!ctx) return
    const c = colors.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    strings.current.forEach((s, i) => {
      const x = ((i + 0.5) / NUM_STRINGS) * w
      s.phase += 0.75 + i * 0.06
      s.amplitude *= 0.982
      if (s.amplitude < 0.05) s.amplitude = 0
      ctx.beginPath()
      for (let y = 0; y <= h; y += 6) {
        const dx = s.amplitude * Math.sin((Math.PI * y) / h) * Math.sin(s.phase)
        y ? ctx.lineTo(x + dx, y) : ctx.moveTo(x + dx, y)
      }
      ctx.strokeStyle = s.amplitude > 0.5 ? c.accent : c.ink
      ctx.globalAlpha = s.amplitude > 0.5 ? 1 : 0.7
      ctx.lineWidth = 0.8 + (NUM_STRINGS - i) * 0.22
      ctx.stroke()
    })
    ctx.globalAlpha = 1
  })
}