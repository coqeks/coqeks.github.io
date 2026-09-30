import { PEDAL_HEIGHT, PEDAL_WIDTH, PROJECTS } from '../config'
import { usePedalBoard } from '../hooks/usePedalBoard'
import Pedal from './Pedal'

/** Draggable pedals chained by patch cables (output jack -> next pedal's input jack). */
export default function PedalBoard() {
  const { boardRef, height, positions, draggedIndex, getHandlers } = usePedalBoard()
  return (
    <div className="board" data-tp ref={boardRef} style={{ height }}>
      {positions && (
        <>
          <svg className="cables" aria-hidden="true">
            {positions.slice(0, -1).map((from, i) => {
              const to = positions[i + 1]
              const ox = from.x + PEDAL_WIDTH + 5
              const oy = from.y + PEDAL_HEIGHT / 2
              const tx = to.x - 5
              const ty = to.y + PEDAL_HEIGHT / 2
              const curve = 70 + Math.abs(tx - ox) * 0.15
              return (
                <g key={i}>
                  <path d={`M${ox} ${oy} C${ox + curve} ${oy + 40} ${tx - curve} ${ty + 40} ${tx} ${ty}`} />
                  <circle cx={ox} cy={oy} r="3" />
                  <circle cx={tx} cy={ty} r="3" />
                </g>
              )
            })}
          </svg>
          {PROJECTS.map((project, i) => (
            <Pedal key={project.title} project={project} index={i} position={positions[i]} isDragging={draggedIndex === i} pointerHandlers={getHandlers(i)} />
          ))}
        </>
      )}
    </div>
  )
}