import { useRef, type RefObject } from 'react'
import { RIPPLE_DURATION_MS } from '../config'
import { type WaveBus } from '../types'
import { useAnimationFrame, useCanvasSurface, useThemeColors } from './useCanvas'

const waveCenterX = (w: number) => Math.min(w * (w > 900 ? 0.087 : 0.17), 190) + 10
const FREQ = 0.012

/**
 * The fixed left-hand wave: sine <-> overdrive morph (bus.mixTarget), reacts to strums / gestures
 * (bus.energyKick, bus.phase) and paints the shoreline wash while a page transition runs (bus.rippleStart).
 */
export function useWaveCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  handleRef: RefObject<HTMLDivElement | null>,
  scrollerRef: RefObject<HTMLDivElement | null>,
  bus: RefObject<WaveBus>
) {
  const colors = useThemeColors()
  const surface = useCanvasSurface(canvasRef, (w) => {
    if (handleRef.current) handleRef.current.style.left = `${waveCenterX(w) - 36}px` // keep drag handle on the wave
  })
  const st = useRef({ energy: 0, time: 0, mix: 0, phase: 0 })

  useAnimationFrame(() => {
    const { ctx, w, h, dpr } = surface.current
    if (!ctx) return
    const s = st.current
    const b = bus.current
    const c = colors.current

    s.energy *= 0.988
    s.time += 0.012 + s.energy * 0.07
    s.energy = Math.min(s.energy + b.energyKick, 3)
    b.energyKick = 0
    s.mix += (b.mixTarget - s.mix) * 0.05
    s.phase += (b.phase - s.phase) * 0.15

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const rp = (performance.now() - b.rippleStart) / RIPPLE_DURATION_MS
    const rippleActive = b.rippleStart !== 0 && rp < 1
    const cx = waveCenterX(w)
    const drive = 2.6 + s.energy * 1.2
    const norm = Math.tanh(drive)
    const scrollY = (scrollerRef.current?.scrollTop ?? 0) + s.phase * 0.6
    const amp = 24 + s.energy * 8 + (rippleActive ? 30 * Math.sin(Math.PI * Math.min(rp / 0.4, 1)) : 0)
    const shape = (v: number) => v + (Math.tanh(drive * v) / norm - v) * s.mix // sine -> overdrive

    const line = (alpha: number, width: number, color: string, shaped: boolean, offset: number) => {
      ctx.beginPath()
      for (let y = -4; y <= h + 4; y += 3) {
        const v = Math.sin((y + scrollY) * FREQ - s.time + offset)
        const x = cx + amp * (shaped ? shape(v) : v)
        y < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth = width
      ctx.stroke()
    }
    line(0.9, 1.4, c.ink, true, 0)
    line(0.22, 1, c.dim, true, 0.7)
    line(0.3, 1, c.dim, false, 0)

    // if (rippleActive) {
    //   // shoreline wash: a band grows out from the wave until it covers the screen, then its inner edge clears it
    //   const maxR = Math.max(cx, w - cx) + amp * 2 + 80
    //   const outer = maxR * easeOutCubic(Math.min(rp / 0.34, 1))
    //   const inner = rp > 0.46 ? maxR * easeInCubic(Math.min((rp - 0.46) / 0.54, 1)) : 0
    //   const wobble = (y: number, r: number) => amp * 0.7 * shape(Math.sin((y + scrollY) * FREQ * 1.4 - s.time * 2 + r * 0.012))
    //   ctx.fillStyle = c.ink
    //   ctx.globalAlpha = 0.97
    //   for (const side of [1, -1]) {
    //     ctx.beginPath()
    //     for (let y = -4; y <= h + 4; y += 4) {
    //       const x = cx + side * (outer + wobble(y, outer))
    //       y < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    //     }
    //     for (let y = h + 4; y >= -4; y -= 4) ctx.lineTo(cx + side * (inner + (inner ? wobble(y, inner) : 0)), y)
    //     ctx.closePath()
    //     ctx.fill()
    //   }
    // }
    ctx.globalAlpha = 1
  })
}