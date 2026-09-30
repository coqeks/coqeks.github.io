import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { clamp } from '../utils/math'

interface Props {
  volume: number
  onVolumeChange: (update: (v: number) => number) => void
  onToggleTheme: () => void
}

/** Theme switch (pickup-selector style) + volume knob (drag, wheel or arrow keys). */
export default function Controls({ volume, onVolumeChange, onToggleTheme }: Props) {
  const startY = useRef<number | null>(null)
  const adjust = (delta: number) => onVolumeChange((v) => clamp(v + delta, 0, 1))

  return (
    <div className="ctl">
      <button className="sw" aria-label="Toggle theme" onClick={onToggleTheme}>
        <b />
      </button>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M4 9v6h4l5 4V5L8 9z" />
        <path d="M16 9c1.5 1.5 1.5 4.5 0 6M18.5 6.5c3 3 3 8 0 11" />
      </svg>
      <div
        className="knob"
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
        tabIndex={0}
        style={{ '--r': `${volume * 270 - 135}deg` } as CSSProperties}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          startY.current = e.clientY
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e: PointerEvent<HTMLDivElement>) => {
          if (startY.current === null) return
          adjust((startY.current - e.clientY) / 150)
          startY.current = e.clientY
        }}
        onPointerUp={() => (startY.current = null)}
        onWheel={(e: WheelEvent<HTMLDivElement>) => adjust(-e.deltaY / 800)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') adjust(0.05)
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') adjust(-0.05)
        }}
      />
    </div>
  )
}