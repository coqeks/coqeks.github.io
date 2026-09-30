import { forwardRef, useState } from 'react'
import { NUM_STRINGS } from '../config'
import HandwrittenText from '../components/Handwrittentext'
import Strings from '../components/Strings'

interface Props {
  animKey: number
  onPluck: (stringIndex: number, velocity: number) => void
}

const Poles = () => (
  <>
    {Array.from({ length: NUM_STRINGS }, (_, i) => (
      <i key={i} style={{ left: `${((i + 0.5) / NUM_STRINGS) * 100}%` }} />
    ))}
  </>
)

const Hero = forwardRef<HTMLElement, Props>(function Hero({ animKey, onPluck }, ref) {
  const [showHint, setShowHint] = useState(true)
  return (
    <section className="hero" ref={ref}>
      <div className="left">
        <div className="name" data-tp>
          <h1 className="sr">Jason Lee</h1>
          <HandwrittenText key={animKey} viewBox="-4 -120 620 300" lines={[['Jason', 0], ['Lee', 155]]} />
          <div className="role">Aspiring Computer Engineer</div>
        </div>
      </div>

      <div className="right">
        <div className="rig" data-tp>
          <Strings
            onPluck={(i, v) => {
              setShowHint(false)
              onPluck(i, v)
            }}
          />
          <div className="stack">
            <div className="pickup"><Poles /></div>
            <div className="panel">
              <h2>About Me</h2>
              <div className="rule" />
              <p>
                Hello, I'm Jason. I am currently studying Computer Engineering at the{' '}
                <a href="https://uwaterloo.ca">University of Waterloo</a>. I am interested in building end-to-end products that make real
                difference, as well as applications of AI/ML on various fields.
              </p>
              <p>Besides my technology side, I love to play electric guitar, go rock climbing, watching films and travelling.</p>
            </div>
            <div className="pickup"><Poles /></div>
          </div>
          <div className="hint" style={{ opacity: showHint ? 1 : 0 }}>Strum the strings</div>
        </div>
      </div>
    </section>
  )
})

export default Hero