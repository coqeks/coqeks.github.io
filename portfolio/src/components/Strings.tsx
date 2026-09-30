import { useRef } from 'react'
import { useStrings } from '../hooks/useStrings.ts'

export default function Strings({ onPluck }: { onPluck: (stringIndex: number, velocity: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useStrings(ref, onPluck)
  return <canvas ref={ref} id="strings" />
}