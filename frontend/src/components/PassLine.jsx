import { useState } from 'react'

const NODES = [
  [14, 52],
  [143, 14],
  [272, 52],
]
const ROUTE = 'M14 52 L143 14 L272 52 L143 14 L14 52' // there and back

export default function PassLine({ tone = 'light', className = '' }) {
  // Read once: users who prefer reduced motion get a still picture.
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const dark = tone === 'dark'

  return (
    <svg className={className} viewBox="0 0 286 66" fill="none" aria-hidden="true">
      <path
        d="M14 52 L143 14 L272 52"
        stroke={dark ? '#8fb09d' : '#9fb3a6'}
        strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round"
      />
      {NODES.map(([x, y]) => (
        <circle
          key={x} cx={x} cy={y} r="8" strokeWidth="3.5"
          fill={dark ? '#ffffff' : '#f8faf7'} stroke={dark ? '#ffffff' : '#0b3a29'}
        />
      ))}
      <circle r="7" cx={reduce ? 78 : 0} cy={reduce ? 33 : 0} fill="#ffd43b" stroke="#0b3a29" strokeWidth="3">
        {!reduce && <animateMotion dur="3s" repeatCount="indefinite" path={ROUTE} />}
      </circle>
    </svg>
  )
}