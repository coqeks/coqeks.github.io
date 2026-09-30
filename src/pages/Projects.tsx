import { forwardRef } from 'react'
import HandwrittenText from '../components/HandwrittenText'
import PedalBoard from '../components/PedalBoard'

const Projects = forwardRef<HTMLElement, { animKey: number }>(function Projects({ animKey }, ref) {
  return (
    <section className="projects" ref={ref}>
      <div className="left">
        <div className="name" data-tp>
          
          <svg className="small" viewBox="-4 -115 640 170">
            <text x="0" y={0}>
              <tspan className="cn">Projects</tspan>
            </text>
          </svg>
          
          {/* <HandwrittenText key={animKey} className="small" viewBox="-4 -115 640 170" lines={[['Project', 0]]} /> */}
          <div className="role">Things I've built</div>
        </div>
      </div>
      <div className="pright">
        <PedalBoard />
      </div>
    </section>
  )
})

export default Projects