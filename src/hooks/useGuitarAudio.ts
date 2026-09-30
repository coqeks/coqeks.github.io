import { useCallback, useEffect, useRef } from 'react'
import { CHORD_VOICINGS, NUM_STRINGS } from '../config'

/** Karplus-Strong plucked-string synth. `play` also rotates the chord voicing after a full strum. */
export function useGuitarAudio(volume: number) {
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const buffersRef = useRef<AudioBuffer[][]>([]) // [voicing][string]
  const voicingRef = useRef(0)
  const pluckedRef = useRef(new Set<number>())
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume * volume
  }, [volume])

  /** Create (or resume) the AudioContext — must run inside a user gesture. */
  const unlock = useCallback(() => {
    const existing = ctxRef.current
    if (existing) {
      if (existing.state === 'suspended') void existing.resume()
      return
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = volumeRef.current ** 2
    const lowpass = ctx.createBiquadFilter()
    lowpass.frequency.value = 5000
    master.connect(lowpass).connect(ctx.destination)

    buffersRef.current = CHORD_VOICINGS.map((freqs) =>
      freqs.map((f) => {
        const sr = ctx.sampleRate
        const len = (sr * 2.5) | 0
        const buffer = ctx.createBuffer(1, len, sr)
        const d = buffer.getChannelData(0)
        const period = Math.round(sr / f)
        for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1
        for (let i = period; i < len; i++) d[i] = 0.4985 * (d[i - period] + d[i - period + 1])
        return buffer
      })
    )
    ctxRef.current = ctx
    gainRef.current = master
  }, [])

  const play = useCallback((stringIndex: number, velocity: number) => {
    const ctx = ctxRef.current
    const master = gainRef.current
    if (!ctx || !master || ctx.state !== 'running') return
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffersRef.current[voicingRef.current][stringIndex]
    gain.gain.value = Math.min(1, 0.35 + velocity * 0.6)
    source.connect(gain).connect(master)
    source.start()

    pluckedRef.current.add(stringIndex)
    if (pluckedRef.current.size >= NUM_STRINGS) {
      pluckedRef.current.clear()
      voicingRef.current = (voicingRef.current + 1) % CHORD_VOICINGS.length
    }
  }, [])

  // browsers only allow audio after a gesture
  useEffect(() => {
    window.addEventListener('pointerdown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      void ctxRef.current?.close()
      ctxRef.current = null
      gainRef.current = null
    }
  }, [unlock])

  return { unlock, play }
}