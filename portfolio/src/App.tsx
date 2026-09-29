import { useEffect, useRef, useState } from 'react'
import './App.css'

const NUM_STRINGS = 6

// Audio chord voicings (Hz)
const CHORD_VOICINGS = [
  [87.31, 130.81, 174.61, 261.63, 329.63, 392.00],  // Fmaj9  (F2, C3, F3, C4, E4, G4)
  [82.41, 123.47, 164.81, 207.65, 311.13, 392.00],  // E7#9   (E2, B2, E3, G#3, D#4, G4)
  [130.81, 196.00, 261.63, 329.63, 466.16, 523.25], // C7     (C3, G3, C4, E4, Bb4, C5)
  [110.00, 164.81, 220.00, 261.63, 329.63, 440.00], // Am7    (A2, E3, A3, C4, E4, A4)
]

const NAVIGATION_ITEMS = ['Home', 'Projects', 'Experience', 'Resume', 'Contact']

const PROJECTS = [
  {
    title: 'Trackify',
    description: 'A web application designed for musicians, featuring automatic source separation. Useful for making backing tracks.',
    techStack: 'React · Node',
    knobLabels: ['Level', 'Tone', 'Gain'],
  },
  {
    title: 'Project Two',
    description: 'A short description of what it does, why you built it, and what problem it solves.',
    techStack: 'Python · ML',
    knobLabels: ['Drive', 'Mix', 'Vol'],
  },
  {
    title: 'Project Three',
    description: 'A short description of what it does, why you built it, and what problem it solves.',
    techStack: 'C++ · Embedded',
    knobLabels: ['Time', 'Fdbk', 'Level'],
  },
  {
    title: 'Project Four',
    description: 'A short description of what it does, why you built it, and what problem it solves.',
    techStack: 'TypeScript',
    knobLabels: ['Rate', 'Depth', 'Level'],
  },
]

// Pedal Board Dimensions & Positioning
const PEDAL_WIDTH = 280
const PEDAL_HEIGHT = 380
const BOARD_ROW_GAP = 50

const calculateBoardHeight = (containerWidth) =>
  containerWidth < 2 * PEDAL_WIDTH + 20
    ? 4 * (PEDAL_HEIGHT + 24)
    : 2 * PEDAL_HEIGHT + BOARD_ROW_GAP

const getInitialPedalPositions = (containerWidth) =>
  containerWidth < 2 * PEDAL_WIDTH + 20
    ? PROJECTS.map((_, index) => ({
        x: Math.max(0, (containerWidth - PEDAL_WIDTH) / 2),
        y: index * (PEDAL_HEIGHT + 24),
      }))
    : [
        { x: 0, y: 0 },
        { x: containerWidth - PEDAL_WIDTH, y: 0 },
        { x: 0, y: PEDAL_HEIGHT + BOARD_ROW_GAP },
        { x: containerWidth - PEDAL_WIDTH, y: PEDAL_HEIGHT + BOARD_ROW_GAP },
      ]

// Scroll & Transition Physics Constants
const RIPPLE_DURATION_MS = 500
const SWAP_PROGRESS_THRESHOLD = 0.18 // Fraction of ripple wash at which page swaps
const FULL_SCROLL_DISTANCE_PX = 1000
const FLICK_VELOCITY_THRESHOLD = 5 // px/ms threshold to trigger page turn
const VELOCITY_MEASURE_WINDOW_MS = 180

const easeOutCubic = (progress) => 1 - (1 - progress) ** 3
const easeInCubic = (progress) => progress * progress * progress
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function HandwrittenText({ lines, viewBox, className }) {
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true">
      {lines.map(([word, yPosition], lineIndex) => (
        <text key={word} x="0" y={yPosition}>
          {[...word].map((char, charIndex) => {
            const delayMultiplier = charIndex + lineIndex * 5
            return (
              <tspan
                key={charIndex}
                className="ch"
                style={{
                  animationDelay: `${delayMultiplier * 0.1}s, ${delayMultiplier * 0.16}s`,
                }}
              >
                {char}
              </tspan>
            )
          })}
        </text>
      ))}
    </svg>
  )
}

function Pedal({ project, pedalIndex, position, isDragging, pointerHandlers }) {
  const [isEngaged, setIsEngaged] = useState(false)

  return (
    <article
      className={`pedal${isEngaged ? ' engaged' : ''}${isDragging ? ' drag' : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      {...pointerHandlers}
    >
      <span className="jack l" />
      <span className="jack r" />
      <div className="knobs">
        {project.knobLabels.map((label, knobIndex) => (
          <div className="k" key={label}>
            <i
              style={{
                '--a': `${-100 + ((pedalIndex * 3 + knobIndex * 5) % 7) * 32}deg`,
              }}
            />
            {label}
          </div>
        ))}
      </div>
      <div className="plate">
        <b>{project.title}</b>
        <p>{project.description}</p>
        <small>{project.techStack}</small>
      </div>
      <div className="led" />
      <button
        className="foot"
        aria-pressed={isEngaged}
        aria-label={`Engage ${project.title}`}
        onClick={() => setIsEngaged((active) => !active)}
      />
    </article>
  )
}

export default function Home() {

  const stringsCanvasRef = useRef(null)
  const waveCanvasRef = useRef(null)
  const scrollerRef = useRef(null)
  const heroSectionRef = useRef(null)
  const projectsSectionRef = useRef(null)
  const experienceSectionRef = useRef(null)
  const waveHandleRef = useRef(null)
  const pedalBoardRef = useRef(null)

  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  )
  const [volume, setVolume] = useState(0.6)
  const [showStrumHint, setShowStrumHint] = useState(true)
  const volumeRef = useRef(volume)
  const audioMasterGainRef = useRef(null)
  const knobDragStartYRef = useRef(null)

  const dragStartYRef = useRef(null)
  const [activePage, setActivePage] = useState('home')
  const [heroAnimationKey, setHeroAnimationKey] = useState(0)
  const [projectsAnimationKey, setProjectsAnimationKey] = useState(0)

  const pedalBoardDragRef = useRef(null)
  const [boardWidth, setBoardWidth] = useState(0)
  const [pedalPositions, setPedalPositions] = useState(null)
  const [draggedPedalIndex, setDraggedPedalIndex] = useState(-1)
  const calculatedBoardHeight = calculateBoardHeight(boardWidth || 1000)

  // Audio / Strum rotation tracking
  const currentVoicingIndexRef = useRef(0)
  const pluckedStringsSetRef = useRef(new Set())

  // Navigation State
  const isTransitioningRef = useRef(false)
  const pageIndexRef = useRef(0)
  const rippleStartTimeRef = useRef(0)
  const waveformMixTargetRef = useRef(0) // 0 = sine, 1 = overdriven
  const audioKickEnergyRef = useRef(0)
  const wavePhaseRef = useRef(0)
  const gestureStateRef = useRef({ accumulatedScroll: 0, events: [] })
  const executeTravelRef = useRef(null)

  // Returns expected transition direction (+1 = top-to-bottom, -1 = bottom-to-top)
  const getLeavingDirection = () => (pageIndexRef.current === 0 ? 1 : -1)

  const setTransitionProgressCss = (progress) =>
    scrollerRef.current.style.setProperty('--tp', progress)

  // Resize listener for pedalboard
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setBoardWidth(entry.contentRect.width))
    if (pedalBoardRef.current) observer.observe(pedalBoardRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!boardWidth) return
    const height = calculateBoardHeight(boardWidth)
    setPedalPositions((positions) =>
      positions
        ? positions.map((pos) => ({
            x: clamp(pos.x, 0, Math.max(0, boardWidth - PEDAL_WIDTH)),
            y: clamp(pos.y, 0, height - PEDAL_HEIGHT),
          }))
        : getInitialPedalPositions(boardWidth)
    )
  }, [boardWidth])

  const getPedalPointerHandlers = (index) => ({
    onPointerDown: (event) => {
      if (event.target.closest('.foot')) return
      const boardBounds = pedalBoardRef.current.getBoundingClientRect()
      pedalBoardDragRef.current = {
        index,
        offsetX: event.clientX - boardBounds.left - pedalPositions[index].x,
        offsetY: event.clientY - boardBounds.top - pedalPositions[index].y,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      setDraggedPedalIndex(index)
    },
    onPointerMove: (event) => {
      const dragData = pedalBoardDragRef.current
      if (!dragData) return
      const boardBounds = pedalBoardRef.current.getBoundingClientRect()
      const x = clamp(
        event.clientX - boardBounds.left - dragData.offsetX,
        0,
        Math.max(0, boardWidth - PEDAL_WIDTH)
      )
      const y = clamp(
        event.clientY - boardBounds.top - dragData.offsetY,
        0,
        calculatedBoardHeight - PEDAL_HEIGHT
      )
      setPedalPositions((positions) =>
        positions.map((pos, k) => (k === dragData.index ? { x, y } : pos))
      )
    },
    onPointerUp: () => {
      pedalBoardDragRef.current = null
      setDraggedPedalIndex(-1)
    },
  })

  // Progressive scroll input handler with elastic bounce dampening
  const processGesturePush = (deltaY) => {
    if (isTransitioningRef.current) return
    const gesture = gestureStateRef.current
    const now = performance.now()
    gesture.events.push({ time: now, deltaY })
    gesture.events = gesture.events.filter((ev) => now - ev.time < VELOCITY_MEASURE_WINDOW_MS * 3)

    const direction = getLeavingDirection()
    let effectiveDeltaY = deltaY

    // Apply resistance when pulling past bounds
    if (
      (direction > 0 && gesture.accumulatedScroll + deltaY < 0) ||
      (direction < 0 && gesture.accumulatedScroll + deltaY > 0)
    ) {
      effectiveDeltaY = deltaY * 0.35
    }

    gesture.accumulatedScroll = clamp(
      gesture.accumulatedScroll + effectiveDeltaY,
      -FULL_SCROLL_DISTANCE_PX,
      FULL_SCROLL_DISTANCE_PX
    )
    const progress = (gesture.accumulatedScroll * direction) / FULL_SCROLL_DISTANCE_PX
    setTransitionProgressCss(progress)
    wavePhaseRef.current = gesture.accumulatedScroll
    audioKickEnergyRef.current += Math.abs(deltaY) * 0.003
  }

  const revertScrollAnimation = () => {
    const scroller = scrollerRef.current
    gestureStateRef.current = { accumulatedScroll: 0, events: [] }
    wavePhaseRef.current = 0
    scroller.classList.add('settle')
    setTransitionProgressCss(0)
    setTimeout(() => scroller.classList.remove('settle'), 500)
  }

  const processGestureRelease = (isIdleAware) => {
    if (isTransitioningRef.current) return false
    const gesture = gestureStateRef.current
    const now = performance.now()
    const lastEventTime = gesture.events.length
      ? gesture.events[gesture.events.length - 1].time
      : now
    const velocitySum = gesture.events
      .filter((ev) => lastEventTime - ev.time <= VELOCITY_MEASURE_WINDOW_MS)
      .reduce((sum, ev) => sum + ev.deltaY, 0)

    let velocity = (velocitySum * getLeavingDirection()) / VELOCITY_MEASURE_WINDOW_MS
    if (isIdleAware && now - lastEventTime > VELOCITY_MEASURE_WINDOW_MS) velocity = 0

    const displacementProgress = (gesture.accumulatedScroll * getLeavingDirection()) / FULL_SCROLL_DISTANCE_PX

    if (velocity >= FLICK_VELOCITY_THRESHOLD || displacementProgress >= 0.5) {
      executeTravelRef.current(1 - pageIndexRef.current)
      return true
    }
    revertScrollAnimation()
    return false
  }

  const navigateToPage = (targetPageIndex) => {
    const scroller = scrollerRef.current
    if (isTransitioningRef.current) return
    if (targetPageIndex === pageIndexRef.current) return revertScrollAnimation()

    isTransitioningRef.current = true
    scroller.classList.add('settle')
    setTransitionProgressCss(1)

    setTimeout(() => {
      scroller.scrollTo({
        top: targetPageIndex ? projectsSectionRef.current.offsetTop : 0,
        behavior: 'instant',
      })
      pageIndexRef.current = targetPageIndex
      waveformMixTargetRef.current = targetPageIndex
      gestureStateRef.current = { accumulatedScroll: 0, events: [] }
      wavePhaseRef.current = 0
      scroller.classList.remove('settle')
      setTransitionProgressCss(1)
      void scroller.offsetWidth

      setTimeout(() => {
        scroller.classList.add('settle')
        setTransitionProgressCss(0)
      }, 60)

      setTimeout(() => scroller.classList.remove('settle'), 700)
      setActivePage(targetPageIndex ? 'projects' : 'home')
      targetPageIndex
        ? setProjectsAnimationKey((key) => key + 1)
        : setHeroAnimationKey((key) => key + 1)
    }, RIPPLE_DURATION_MS * SWAP_PROGRESS_THRESHOLD)

    setTimeout(() => (isTransitioningRef.current = false), RIPPLE_DURATION_MS + 100)
  }

  executeTravelRef.current = navigateToPage
  const goToNavigation = (name) => navigateToPage(name === 'Projects' ? 1 : 0)

  useEffect(() => {
    const scroller = scrollerRef.current
    let lastWheelTime = 0
    let isQuietWindow = false
    let resetTimer
    let previousDeltaMagnitude = 0
    let decelerationCount = 0

    const onWheel = (event) => {
      if (event.target.closest('.knob')) return
      const now = performance.now()
      if (now - lastWheelTime > 90) {
        isQuietWindow = false
        previousDeltaMagnitude = 0
        decelerationCount = 0
      }
      lastWheelTime = now
      if (isTransitioningRef.current || isQuietWindow) return

      const deltaY =
        event.deltaY * (event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? innerHeight : 1)
      processGesturePush(deltaY)

      const currentMagnitude = Math.abs(deltaY)
      decelerationCount = currentMagnitude < previousDeltaMagnitude ? decelerationCount + 1 : 0
      previousDeltaMagnitude = currentMagnitude

      clearTimeout(resetTimer)
      if (decelerationCount >= 4) {
        processGestureRelease(false)
        isQuietWindow = true
        decelerationCount = 0
        return
      }
      resetTimer = setTimeout(() => {
        if (processGestureRelease(false)) isQuietWindow = true
      }, 70)
    }

    let previousTouchY = 0
    let shouldSkipTouch = false

    const onTouchStart = (event) => {
      shouldSkipTouch = !!event.target.closest('.pedal,.handle,.knob,.sw')
      previousTouchY = event.touches[0].clientY
      gestureStateRef.current = { accumulatedScroll: 0, events: [] }
    }

    const onTouchMove = (event) => {
      if (shouldSkipTouch) return
      const touchY = event.touches[0].clientY
      processGesturePush(previousTouchY - touchY)
      previousTouchY = touchY
    }

    const onTouchEnd = () => !shouldSkipTouch && processGestureRelease(true)

    const onKeyDown = (event) => {
      if (event.target.closest('.knob') || (event.key === ' ' && event.target.tagName === 'BUTTON'))
        return
      const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key)
        ? 1
        : ['ArrowUp', 'PageUp'].includes(event.key)
        ? -1
        : 0
      if (direction) {
        if (direction === getLeavingDirection()) executeTravelRef.current(1 - pageIndexRef.current)
        else processGesturePush(direction * 120)
      }
    }

    const onResize = () =>
      scroller.scrollTo({
        top: pageIndexRef.current ? projectsSectionRef.current.offsetTop : 0,
        behavior: 'instant',
      })

    scroller.addEventListener('wheel', onWheel, { passive: true })
    scroller.addEventListener('touchstart', onTouchStart, { passive: true })
    scroller.addEventListener('touchmove', onTouchMove, { passive: true })
    scroller.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(resetTimer)
      scroller.removeEventListener('wheel', onWheel)
      scroller.removeEventListener('touchstart', onTouchStart)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Wave drag handles
  const onWavePointerDown = (event) => {
    dragStartYRef.current = event.clientY
    gestureStateRef.current = { accumulatedScroll: 0, events: [] }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onWavePointerMove = (event) => {
    if (dragStartYRef.current === null) return
    processGesturePush((dragStartYRef.current - event.clientY) * 1.5)
    dragStartYRef.current = event.clientY
  }

  const onWavePointerUp = () => {
    if (dragStartYRef.current === null) return
    dragStartYRef.current = null
    processGestureRelease(true)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    volumeRef.current = volume
    if (audioMasterGainRef.current) audioMasterGainRef.current.gain.value = volume * volume
  }, [volume])

  const clampVolumeValue = (val) => Math.max(0, Math.min(1, val))

  // Main Canvas & Audio Synthesis Effect
  useEffect(() => {
    const stringsCanvas = stringsCanvasRef.current
    const waveCanvas = waveCanvasRef.current
    const stringsContext = stringsCanvas.getContext('2d')
    const waveContext = waveCanvas.getContext('2d')
    const scroller = scrollerRef.current

    let waveformMix = 0
    const stringStates = Array.from({ length: NUM_STRINGS }, () => ({
      amplitude: 0,
      phase: 0,
    }))

    let audioCtx = null
    const audioBuffers = [] // [chordIndex][stringIndex]
    let stringEnergy = 0
    let animationTime = 0
    let canvasWidth, canvasHeight, waveWidth, waveHeight, devicePixelRatio
    let themeColors = {}
    let lastPointerPos = null
    let hasDismissedHint = false
    let animationFrameId

    const readThemeColors = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      themeColors = {
        ink: computedStyle.getPropertyValue('--ink').trim(),
        accent: computedStyle.getPropertyValue('--accent').trim(),
        dim: computedStyle.getPropertyValue('--dim').trim(),
      }
    }
    readThemeColors()

    const themeObserver = new MutationObserver(() => {
      readThemeColors()
      setTimeout(readThemeColors, 520)
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    // Synthesizer Audio Context Setup
    const initAudioContext = () => {
      if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        return
      }
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const masterGain = audioCtx.createGain()
      masterGain.gain.value = volumeRef.current ** 2
      audioMasterGainRef.current = masterGain

      const lowpassFilter = audioCtx.createBiquadFilter()
      lowpassFilter.frequency.value = 5000
      masterGain.connect(lowpassFilter).connect(audioCtx.destination)

      CHORD_VOICINGS.forEach((chordFrequencies) => {
        const chordBuffers = []
        chordFrequencies.forEach((frequency) => {
          const sampleRate = audioCtx.sampleRate
          const bufferLength = (sampleRate * 2.5) | 0
          const buffer = audioCtx.createBuffer(1, bufferLength, sampleRate)
          const channelData = buffer.getChannelData(0)
          const period = Math.round(sampleRate / frequency)

          for (let i = 0; i < period; i++) channelData[i] = Math.random() * 2 - 1
          for (let i = period; i < bufferLength; i++) {
            channelData[i] = 0.4985 * (channelData[i - period] + channelData[i - period + 1])
          }
          chordBuffers.push(buffer)
        })
        audioBuffers.push(chordBuffers)
      })
    }

    const playStringNote = (stringIndex, velocity) => {
      if (!audioCtx || audioCtx.state !== 'running') return
      const source = audioCtx.createBufferSource()
      const noteGain = audioCtx.createGain()
      const activeVoicingIndex = currentVoicingIndexRef.current

      source.buffer = audioBuffers[activeVoicingIndex][stringIndex]
      noteGain.gain.value = Math.min(1, 0.35 + velocity * 0.6)
      source.connect(noteGain).connect(audioMasterGainRef.current)
      source.start()
    }

    const pluckString = (stringIndex, velocity) => {
      initAudioContext()
      stringStates[stringIndex].amplitude = 3 + velocity * 2
      playStringNote(stringIndex, velocity)
      stringEnergy = Math.min(stringEnergy + 0.35 + velocity * 0.4, 3)

      pluckedStringsSetRef.current.add(stringIndex)
      if (pluckedStringsSetRef.current.size >= NUM_STRINGS) {
        pluckedStringsSetRef.current.clear()
        currentVoicingIndexRef.current = (currentVoicingIndexRef.current + 1) % CHORD_VOICINGS.length
      }

      if (!hasDismissedHint) {
        hasDismissedHint = true
        setShowStrumHint(false)
      }
    }

    const updateCanvasDimensions = (canvas) => {
      devicePixelRatio = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      return [rect.width, rect.height]
    }

    const getWaveCenterX = () =>
      Math.min(waveWidth * (waveWidth > 900 ? 0.087 : 0.17), 190) + 10

    const handleResize = () => {
      ;[canvasWidth, canvasHeight] = updateCanvasDimensions(stringsCanvas)
      ;[waveWidth, waveHeight] = updateCanvasDimensions(waveCanvas)
      if (waveHandleRef.current) {
        waveHandleRef.current.style.left = `${getWaveCenterX() - 36}px`
      }
    }

    const onPointerMove = (event) => {
      const rect = stringsCanvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      if (lastPointerPos && y >= -20 && y <= rect.height + 20) {
        const previousX = lastPointerPos.x
        const velocityX = x - previousX
        if (velocityX) {
          for (let i = 0; i < NUM_STRINGS; i++) {
            const stringX = ((i + 0.5) / NUM_STRINGS) * rect.width
            if ((previousX < stringX && x >= stringX) || (previousX > stringX && x <= stringX)) {
              pluckString(i, Math.min(1, Math.abs(velocityX) / 40))
            }
          }
        }
      }
      lastPointerPos = { x, y }
    }

    const renderStrings = () => {
      stringsContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      stringsContext.clearRect(0, 0, canvasWidth, canvasHeight)

      stringStates.forEach((string, index) => {
        const xPosition = ((index + 0.5) / NUM_STRINGS) * canvasWidth
        string.phase += 0.75 + index * 0.06
        string.amplitude *= 0.982
        if (string.amplitude < 0.05) string.amplitude = 0

        stringsContext.beginPath()
        for (let y = 0; y <= canvasHeight; y += 6) {
          const deltaX =
            string.amplitude * Math.sin((Math.PI * y) / canvasHeight) * Math.sin(string.phase)
          y ? stringsContext.lineTo(xPosition + deltaX, y) : stringsContext.moveTo(xPosition + deltaX, y)
        }
        stringsContext.strokeStyle =
          string.amplitude > 0.5 ? themeColors.accent : themeColors.ink
        stringsContext.globalAlpha = string.amplitude > 0.5 ? 1 : 0.7
        stringsContext.lineWidth = 0.8 + (NUM_STRINGS - index) * 0.22
        stringsContext.stroke()
      })
      stringsContext.globalAlpha = 1
    }

    let sinePhase = 0
    const renderWaveform = () => {
      waveContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      waveContext.clearRect(0, 0, waveWidth, waveHeight)

      stringEnergy = Math.min(stringEnergy + audioKickEnergyRef.current, 3)
      audioKickEnergyRef.current = 0
      waveformMix += (waveformMixTargetRef.current - waveformMix) * 0.05
      sinePhase += (wavePhaseRef.current - sinePhase) * 0.15

      const rippleProgress = (performance.now() - rippleStartTimeRef.current) / RIPPLE_DURATION_MS
      const isRippleActive = rippleStartTimeRef.current && rippleProgress < 1
      const centerX = getWaveCenterX()
      const drive = 2.6 + stringEnergy * 1.2
      const norm = Math.tanh(drive)
      const waveFrequency = 0.012
      const scrollYOffset = scroller.scrollTop + sinePhase * 0.6
      const waveAmplitude =
        24 + stringEnergy * 8 + (isRippleActive ? 30 * Math.sin(Math.PI * Math.min(rippleProgress / 0.4, 1)) : 0)

      const applyWaveShaper = (sample) =>
        sample + (Math.tanh(drive * sample) / norm - sample) * waveformMix

      const drawWaveLine = (alpha, lineWidth, color, applyShaper, phaseOffset) => {
        waveContext.beginPath()
        for (let y = -4; y <= waveHeight + 4; y += 3) {
          const sample = Math.sin((y + scrollYOffset) * waveFrequency - animationTime + phaseOffset)
          const x = centerX + waveAmplitude * (applyShaper ? applyWaveShaper(sample) : sample)
          y < 0 ? waveContext.moveTo(x, y) : waveContext.lineTo(x, y)
        }
        waveContext.strokeStyle = color
        waveContext.globalAlpha = alpha
        waveContext.lineWidth = lineWidth
        waveContext.stroke()
      }

      drawWaveLine(0.9, 1.4, themeColors.ink, true, 0)
      drawWaveLine(0.22, 1, themeColors.dim, true, 0.7)
      drawWaveLine(0.3, 1, themeColors.dim, false, 0)

      if (isRippleActive) {
        const maxRadius = Math.max(centerX, waveWidth - centerX) + waveAmplitude * 2 + 80
        const outerRadius = maxRadius * easeOutCubic(Math.min(rippleProgress / 0.34, 1))
        const innerRadius =
          rippleProgress > 0.46 ? maxRadius * easeInCubic(Math.min((rippleProgress - 0.46) / 0.54, 1)) : 0

        const calculateWobble = (y, radius) =>
          waveAmplitude *
          0.7 *
          applyWaveShaper(
            Math.sin((y + scrollYOffset) * waveFrequency * 1.4 - animationTime * 2 + radius * 0.012)
          )

        waveContext.fillStyle = themeColors.ink
        waveContext.globalAlpha = 0.97
        for (const sideSign of [1, -1]) {
          waveContext.beginPath()
          for (let y = -4; y <= waveHeight + 4; y += 4) {
            const x = centerX + sideSign * (outerRadius + calculateWobble(y, outerRadius))
            y < 0 ? waveContext.moveTo(x, y) : waveContext.lineTo(x, y)
          }
          for (let y = waveHeight + 4; y >= -4; y -= 4) {
            waveContext.lineTo(
              centerX + sideSign * (innerRadius + (innerRadius ? calculateWobble(y, innerRadius) : 0)),
              y
            )
          }
          waveContext.closePath()
          waveContext.fill()
        }
      }
      waveContext.globalAlpha = 1
    }

    const animationLoop = () => {
      stringEnergy *= 0.988
      animationTime += 0.012 + stringEnergy * 0.07
      renderStrings()
      renderWaveform()
      animationFrameId = requestAnimationFrame(animationLoop)
    }

    handleResize()
    animationLoop()

    window.addEventListener('resize', handleResize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', initAudioContext)

    return () => {
      cancelAnimationFrame(animationFrameId)
      themeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', initAudioContext)
      audioCtx && audioCtx.close()
      audioMasterGainRef.current = null
    }
  }, [])

  const stringPoles = Array.from({ length: NUM_STRINGS }, (_, index) => (
    <i key={index} style={{ left: `${((index + 0.5) / NUM_STRINGS) * 100}%` }} />
  ))

  const navigationMenu = (
    <nav className="menu">
      {NAVIGATION_ITEMS.map((item) => {
        const isLocalPage = item === 'Home' || item === 'Projects'
        const isActive =
          (item === 'Home' && activePage === 'home') ||
          (item === 'Projects' && activePage === 'projects')
          {item === 'Experience' && activePage === 'experience'}
        return (
          <a
            key={item}
            href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
            className={isActive ? 'on' : ''}
            onClick={
              isLocalPage
                ? (event) => {
                    event.preventDefault()
                    goToNavigation(item)
                  }
                : undefined
            }
          >
            {item}
          </a>
        )
      })}
    </nav>
  )

  return (
    <div className="home" ref={scrollerRef}>
      <div className="social ">
        <a href="https://linkedin.com/in/" aria-label="LinkedIn">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="3" y="9" width="3.5" height="11" />
            <circle cx="4.8" cy="5" r="1.6" />
            <path d="M10 20V9h3.4v1.6C14.2 9.4 15.5 9 16.8 9 19 9 20.5 10.4 20.5 13v7H17v-6c0-1.3-.6-2-1.7-2s-1.8.8-1.8 2v6z" />
          </svg>
        </a>
        <a href="https://github.com/coqeks" aria-label="GitHub">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M9 19c-4 1-4-2-6-2m12 4v-3.2a2.8 2.8 0 0 0-.8-2.2c2.6-.3 5.3-1.3 5.3-5.7A4.4 4.4 0 0 0 18.3 6.7 4.1 4.1 0 0 0 18.2 3.5S17.2 3.2 15 4.7a11 11 0 0 0-6 0C6.8 3.2 5.8 3.5 5.8 3.5A4.1 4.1 0 0 0 5.7 6.7 4.4 4.4 0 0 0 4.5 9.8c0 4.4 2.7 5.4 5.3 5.7A2.8 2.8 0 0 0 9 17.7V21" />
          </svg>
        </a>
      </div>

      {navigationMenu}

      <canvas ref={waveCanvasRef} id="wave" />
      <div
        className="handle"
        ref={waveHandleRef}
        onPointerDown={onWavePointerDown}
        onPointerMove={onWavePointerMove}
        onPointerUp={onWavePointerUp}
        onPointerCancel={onWavePointerUp}
      />

      <div className="ctl">
        <button
          className="sw"
          aria-label="Toggle theme"
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        >
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
          style={{ '--r': `${volume * 270 - 135}deg` }}
          onPointerDown={(event) => {
            knobDragStartYRef.current = event.clientY
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (knobDragStartYRef.current === null) return
            const deltaY = knobDragStartYRef.current - event.clientY
            knobDragStartYRef.current = event.clientY
            setVolume((v) => clampVolumeValue(v + deltaY / 150))
          }}
          onPointerUp={() => (knobDragStartYRef.current = null)}
          onWheel={(event) => setVolume((v) => clampVolumeValue(v - event.deltaY / 800))}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowRight') setVolume((v) => clampVolumeValue(v + 0.05))
            if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') setVolume((v) => clampVolumeValue(v - 0.05))
          }}
        />
      </div>

      <section className="hero" ref={heroSectionRef}>
        <div className="left">
          <div className="name" data-tp>
            <h1 className="sr">Jason Lee</h1>
            <HandwrittenText key={heroAnimationKey} viewBox="-4 -120 620 300" lines={[["Jason", 0], ["Lee", 155]]} />
            <div className="role">Aspiring Computer Engineer</div>
          </div>
        </div>

        <div className="right">
          <div className="rig" data-tp>
            <canvas ref={stringsCanvasRef} id="strings" />
            <div className="stack">
              <div className="pickup">{stringPoles}</div>
              <div className="panel">
                <h2>About Me</h2>
                <div className="rule" />
                <p>
                  Hello, I'm Jason. I am currently studying Computer Engineering at the{' '}
                  <a href="https://uwaterloo.ca">University of Waterloo</a>. I am interested in building end-to-end
                  products that make real difference, as well as applications of AI/ML on various fields.
                </p>
                <p>Besides my technology side, I love to play electric guitar, go rock climbing, watching films and travelling.</p>
              </div>
              <div className="pickup">{stringPoles}</div>
            </div>
            <div className="hint" style={{ opacity: showStrumHint ? 1 : 0 }}>Strum the strings</div>
          </div>
        </div>
      </section>

      <section className="projects" ref={projectsSectionRef}>
        <div className="left">
          <div className="name" data-tp>
            <h2 className="sr">Projects</h2>
            <HandwrittenText key={projectsAnimationKey} className="small" viewBox="-4 -115 640 170" lines={[['Project', 0]]} />
            <div className="role">Things I've built</div>
          </div>
        </div>
        <div className="pright">
          <div className="board" data-tp ref={pedalBoardRef} style={{ height: calculatedBoardHeight }}>
            {pedalPositions && (
              <>
                <svg className="cables" aria-hidden="true">
                  {pedalPositions.slice(0, -1).map((startPos, index) => {
                    const endPos = pedalPositions[index + 1]
                    const originX = startPos.x + PEDAL_WIDTH + 5
                    const originY = startPos.y + PEDAL_HEIGHT / 2
                    const targetX = endPos.x - 5
                    const targetY = endPos.y + PEDAL_HEIGHT / 2
                    const curveOffset = 70 + Math.abs(targetX - originX) * 0.15

                    return (
                      <g key={index}>
                        <path d={`M${originX} ${originY} C${originX + curveOffset} ${originY + 40} ${targetX - curveOffset} ${targetY + 40} ${targetX} ${targetY}`} />
                        <circle cx={originX} cy={originY} r="3" />
                        <circle cx={targetX} cy={targetY} r="3" />
                      </g>
                    )
                  })}
                </svg>
                {PROJECTS.map((project, index) => (
                  <Pedal
                    key={project.title}
                    project={project}
                    pedalIndex={index}
                    position={pedalPositions[index]}
                    isDragging={draggedPedalIndex === index}
                    pointerHandlers={getPedalPointerHandlers(index)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </section>
      <section className="experience" ref={experienceSectionRef}>
        <div className="left">
          <div className="name" data-tp>
            <h2 className="sr">Experiences</h2>
            <HandwrittenText key={projectsAnimationKey} className="small" viewBox="-4 -115 640 170" lines={[['Project', 0]]} />
            <div className="role">Things I've done</div>
          </div>
        </div>
        <div className="pright">
          <h1>TBA.</h1>
        </div>
      </section>
    </div>
  )
}