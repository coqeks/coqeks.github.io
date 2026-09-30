import { useRef, type ComponentProps, type RefObject } from 'react'
import { useWaveCanvas } from '../hooks/useWaveCanvas.ts'
import type { WaveBus } from '../types'

interface Props {
  scrollerRef: RefObject<HTMLDivElement | null>
  bus: RefObject<WaveBus>
  handleProps: ComponentProps<'div'> // pointer handlers from usePageTransition
}

/** Fixed wave canvas + the invisible drag handle sitting on top of it. */
export default function WaveCanvas({ scrollerRef, bus, handleProps }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  useWaveCanvas(canvasRef, handleRef, scrollerRef, bus)
  return (
    <>
      <canvas ref={canvasRef} id="wave" />
      <div className="handle" ref={handleRef} {...handleProps} />
    </>
  )
}