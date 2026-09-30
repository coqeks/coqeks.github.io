import { useRef, useState } from 'react'
import './App.css'
import Controls from './components/Controls.tsx'
import Menu from './components/Menu.tsx'
import Social from './components/Social.tsx'
import WaveCanvas from './components/Wavecanvas.tsx'
import { useGuitarAudio } from './hooks/useGuitarAudio.ts'
import { usePageTransition } from './hooks/usePageTransition.ts'
import { useTheme } from './hooks/useTheme.ts'
import Experience from './pages/Experience.tsx'
import Hero from './pages/Hero.tsx'
import Projects from './pages/Projects.tsx'
import type { WaveBus } from './types.ts'

export default function App() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const projectsRef = useRef<HTMLElement>(null)
  const experienceRef = useRef<HTMLElement>(null)
  const bus = useRef<WaveBus>({ energyKick: 0, phase: 0, mixTarget: 0, rippleStart: 0 })

  const [, toggleTheme] = useTheme()
  const [volume, setVolume] = useState(0.6)
  const { unlock, play } = useGuitarAudio(volume)

  // section order must match PAGES in config.ts
  const { activeIndex, animKeys, goToPage, waveHandleProps } = usePageTransition(scrollerRef, [heroRef, projectsRef, experienceRef], bus)

  const handlePluck = (stringIndex: number, velocity: number) => {
    unlock()
    play(stringIndex, velocity)
    bus.current.energyKick += 0.35 + velocity * 0.4 // strums make the wave swell
  }

  return (
    <div className="home" ref={scrollerRef}>
      <Social />
      <Menu activeIndex={activeIndex} onNavigate={goToPage} />
      <WaveCanvas scrollerRef={scrollerRef} bus={bus} handleProps={waveHandleProps} />
      <Controls volume={volume} onVolumeChange={setVolume} onToggleTheme={toggleTheme} />

      <Hero ref={heroRef} animKey={animKeys[0]} onPluck={handlePluck} />
      <Projects ref={projectsRef} animKey={animKeys[1]} />
      <Experience ref={experienceRef} animKey={animKeys[2]} />
    </div>
  )
}