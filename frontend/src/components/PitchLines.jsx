export default function PitchLines() {
  return (
    <svg
      className="pointer-events-none absolute bottom-0 right-0 hidden h-[72%] md:block"
      viewBox="0 0 760 500"
      fill="none"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
    >
      <g stroke="#e3e9e2" strokeWidth="6">
        <rect x="3" y="3" width="754" height="494" />
        <path d="M380 3v494" />
        <circle cx="380" cy="250" r="82" />
        <rect x="3" y="140" width="130" height="220" />
        <rect x="627" y="140" width="130" height="220" />
        <rect x="3" y="3" width="754" height="494" strokeOpacity="0" />
      </g>
    </svg>
  )
}