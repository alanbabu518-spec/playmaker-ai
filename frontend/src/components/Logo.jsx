export default function Logo({ size = 32, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle
        cx="15" cy="17" r="11"
        stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"
        strokeDasharray="52 17.1" transform="rotate(-20 15 17)"
      />
      <circle cx="15" cy="17" r="2.6" fill="currentColor" />
      <rect x="19" y="3" width="9" height="9" rx="2.4" fill="#ffd43b" />
    </svg>
  )
}