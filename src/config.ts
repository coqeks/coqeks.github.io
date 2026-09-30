import type { Project } from './types'

// ---- Strings & audio ----
export const NUM_STRINGS = 6

// Chord voicings (Hz), rotated every time all six strings have been strummed
export const CHORD_VOICINGS: number[][] = [
  [87.31, 130.81, 174.61, 261.63, 329.63, 392.0], // Fmaj9  (F2, C3, F3, C4, E4, G4)
  [82.41, 123.47, 164.81, 207.65, 311.13, 392.0], // E7#9   (E2, B2, E3, G#3, D#4, G4)
  [130.81, 196.0, 261.63, 329.63, 466.16, 523.25], // C7     (C3, G3, C4, E4, Bb4, C5)
  [110.0, 164.81, 220.0, 261.63, 329.63, 440.0], // Am7    (A2, E3, A3, C4, E4, A4)
]

// ---- Pages ----
// Order = vertical order of the sections in App.tsx. `wave` is the waveform mix for that page
// (0 = sine, 1 = overdriven) — add more wave types by extending useWaveCanvas.
export const PAGES = [
  { id: 'home', label: 'Home', wave: 0 },
  { id: 'projects', label: 'Projects', wave: 1 },
  { id: 'experience', label: 'Experience', wave: 0 },
] as const

export const NAVIGATION_ITEMS = ['Home', 'Projects', 'Experience', 'Resume', 'Contact']

// ---- Projects ----
export const PROJECTS: Project[] = [
  {
    title: 'Trackify',
    description: 'A web application designed for musicians, featuring automatic source separation with asynchronous pipeline, file-transfer offloading via S3, and JWT-based authentication. Useful for making backing tracks.',
    techStack: '2026 Feb ~ Sept',
    knobLabels: ['React', 'FastAPI', 'Postgres'],
  },
  {
    title: 'IoT Home Sensor',
    description: 'Information displaying system that gathers various sensor information to the main circuit and displays through a remote website,',
    techStack: '2026 May ~ Sept',
    knobLabels: ['C++', 'ESP32', 'I2C'],
  },
  {
    title: 'Mobile Controlled Drone',
    description: 'TBA',
    techStack: '2026 Sept ~ Present',
    knobLabels: ['C++', 'Embedded', ''],
  }
]

// ---- Pedal board ----
export const PEDAL_WIDTH = 280
export const PEDAL_HEIGHT = 380
export const BOARD_ROW_GAP = 50

// ---- Scroll & transition physics ----
export const RIPPLE_DURATION_MS = 500
export const SWAP_PROGRESS_THRESHOLD = 0.18 // fraction of the wash at which the page swaps
export const FULL_SCROLL_DISTANCE_PX = 1000 // scroll distance for a full slide/fade
export const FLICK_VELOCITY_THRESHOLD = 5 // px/ms that commits a page change
export const VELOCITY_MEASURE_WINDOW_MS = 180
export const EDGE_RESISTANCE = 0.35 // dampening when pulling past the first/last page