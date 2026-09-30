export interface Project {
    title: string
    description: string
    techStack: string
    knobLabels: [string, string, string]
  }
  
  export interface Vec2 {
    x: number
    y: number
  }
  
  /** Mutable state shared between the input hooks and the wave canvas (kept in a ref, not React state). */
  export interface WaveBus {
    energyKick: number // energy added by strums / scroll gestures, consumed by the wave each frame
    phase: number // scroll-gesture displacement (px) that shifts the wave phase
    mixTarget: number // 0 = sine, 1 = overdriven (see PAGES[].wave)
    rippleStart: number // performance.now() when the shoreline wash started (0 = never)
  }
  
  export interface GestureEvent {
    time: number
    deltaY: number
  }