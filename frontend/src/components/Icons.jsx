export function FlagIcon({ className = '' }) {
  return (
    <svg className={className} width="28" height="40" viewBox="0 0 28 40" fill="none" aria-hidden="true">
      <path d="M5 4v32" stroke="#0b3a29" strokeWidth="3" strokeLinecap="round" />
      <path d="M5 5h17l-5 6 5 6H5z" fill="#ffd43b" stroke="#0b3a29" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  )
}

export function RedCardIcon({ className = '' }) {
  return (
    <svg className={className} width="32" height="40" viewBox="0 0 32 40" aria-hidden="true">
      <rect x="7" y="5" width="18" height="28" rx="3.5" fill="#c8402f" transform="rotate(8 16 19)" />
    </svg>
  )
}

export function YellowCardIcon({ className = '' }) {
  return (
    <svg className={className} width="20" height="26" viewBox="0 0 20 26" aria-hidden="true">
      <rect x="4" y="3" width="11" height="18" rx="2.5" fill="#ffd43b" stroke="#e2b922" strokeWidth="1.5" transform="rotate(-8 10 13)" />
    </svg>
  )
}

export function ConnectionIcon({ className = '' }) {
  return (
    <svg className={className} width="60" height="34" viewBox="0 0 60 34" fill="none" aria-hidden="true">
      <path d="M12 24 L30 10 L48 24" stroke="#9fb3a6" strokeWidth="2.2" strokeDasharray="1 5" strokeLinecap="round" />
      <circle cx="8" cy="26" r="6" fill="#fff" stroke="#0b3a29" strokeWidth="3" />
      <circle cx="52" cy="26" r="6" fill="#fff" stroke="#0b3a29" strokeWidth="3" />
      <circle cx="30" cy="8" r="5.5" fill="#ffd43b" stroke="#0b3a29" strokeWidth="2.6" />
    </svg>
  )
}