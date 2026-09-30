import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { BOARD_ROW_GAP, PEDAL_HEIGHT, PEDAL_WIDTH, PROJECTS } from '../config'
import type { Vec2 } from '../types'
import { clamp } from '../utils/math'

const isNarrow = (w: number) => w < 2 * PEDAL_WIDTH + 20
const boardHeight = (w: number) => (isNarrow(w) ? 4 * (PEDAL_HEIGHT + 24) : 2 * PEDAL_HEIGHT + BOARD_ROW_GAP)
const initialPositions = (w: number): Vec2[] =>
  isNarrow(w)
    ? PROJECTS.map((_, i) => ({ x: Math.max(0, (w - PEDAL_WIDTH) / 2), y: i * (PEDAL_HEIGHT + 24) }))
    : [
        { x: 0, y: 0 },
        { x: w - PEDAL_WIDTH, y: 0 },
        { x: 0, y: PEDAL_HEIGHT + BOARD_ROW_GAP },
        { x: w - PEDAL_WIDTH, y: PEDAL_HEIGHT + BOARD_ROW_GAP },
      ]

/** Pedal positions + drag handlers, constrained to the board. */
export function usePedalBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ index: number; offsetX: number; offsetY: number } | null>(null)
  const [width, setWidth] = useState(0)
  const [positions, setPositions] = useState<Vec2[] | null>(null)
  const [draggedIndex, setDraggedIndex] = useState(-1)
  const height = boardHeight(width || 1000)

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!width) return
    const h = boardHeight(width)
    setPositions((prev) =>
      prev
        ? prev.map((p) => ({ x: clamp(p.x, 0, Math.max(0, width - PEDAL_WIDTH)), y: clamp(p.y, 0, h - PEDAL_HEIGHT) }))
        : initialPositions(width)
    )
  }, [width])

  const getHandlers = (index: number) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if ((e.target as Element).closest('.foot') || !boardRef.current || !positions) return
      const b = boardRef.current.getBoundingClientRect()
      drag.current = { index, offsetX: e.clientX - b.left - positions[index].x, offsetY: e.clientY - b.top - positions[index].y }
      e.currentTarget.setPointerCapture(e.pointerId)
      setDraggedIndex(index)
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d || !boardRef.current) return
      const b = boardRef.current.getBoundingClientRect()
      const x = clamp(e.clientX - b.left - d.offsetX, 0, Math.max(0, width - PEDAL_WIDTH))
      const y = clamp(e.clientY - b.top - d.offsetY, 0, height - PEDAL_HEIGHT)
      setPositions((prev) => prev && prev.map((p, k) => (k === d.index ? { x, y } : p)))
    },
    onPointerUp: () => {
      drag.current = null
      setDraggedIndex(-1)
    },
  })

  return { boardRef, height, positions, draggedIndex, getHandlers }
}