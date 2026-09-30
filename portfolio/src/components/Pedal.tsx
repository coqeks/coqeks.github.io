import { useState, type HTMLAttributes } from 'react'
import type { Project, Vec2 } from '../types'

interface Props {
  project: Project
  index: number
  position: Vec2
  isDragging: boolean
  pointerHandlers: HTMLAttributes<HTMLElement>
}

export default function Pedal({ project, index, position, isDragging, pointerHandlers }: Props) {
  const [engaged, setEngaged] = useState(false)
  return (
    <article
      className={`pedal${engaged ? ' engaged' : ''}${isDragging ? ' drag' : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      {...pointerHandlers}
    >
      <span className="jack l" />
      <span className="jack r" />
      <div className="knobs">
        {project.knobLabels.map((label, k) => (
          <div className="k" key={label}>
            <i style={{ ['--a' as string]: `${-100 + ((index * 3 + k * 5) % 7) * 32}deg` }} />
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
      <button className="foot" aria-pressed={engaged} aria-label={`Engage ${project.title}`} onClick={() => setEngaged((v) => !v)} />
    </article>
  )
}