import type { CSSProperties } from 'react'

interface Props {
  /** [word, baselineY] per line */
  lines: [string, number][]
  viewBox: string
  className?: string
  style?: CSSProperties
}

/** SVG text whose letters trace themselves in, then fill (see .ch in App.css). Remount (change `key`) to replay. */
export default function HandwrittenText({ lines, viewBox, className, style }: Props) {
  return (
    <svg className={className} style={style} viewBox={viewBox} aria-hidden="true">
      {lines.map(([word, y], lineIndex) => (
        <text key={word} x="0" y={y}>
          {[...word].map((char, charIndex) => {
            const n = charIndex + lineIndex * 5
            return (
              <tspan key={charIndex} className="ch" style={{ animationDelay: `${n * 0.1}s, ${n * 0.16}s` }}>
                {char}
              </tspan>
            )
          })}
        </text>
      ))}
    </svg>
  )
}