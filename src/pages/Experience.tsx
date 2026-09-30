import { forwardRef } from 'react'

// Reuses the .projects layout (grid, title position, mobile rules) from App.css
const Experience = forwardRef<HTMLElement>(function Experience({}, ref) {
  return (
    <section className="projects experience" ref={ref}>
      <div className="left">
        <div className="name" data-tp>
          <h2 className="sr">Experience</h2>
          <svg className="small" viewBox="-4 -115 640 170">
            <text x="0" y={0}>
              <tspan className="cn">Experience</tspan>
            </text>
          </svg>
          
          <div className="role">Things I've done</div>
        </div>
      </div>
      <div className="pright" data-tp>
        <h1>TBA.</h1>
      </div>
    </section>
  )
})

export default Experience