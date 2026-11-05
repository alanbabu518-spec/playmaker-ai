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

function Svg({ size = 20, className = '', children }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const PanelLeftIcon = (p) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></Svg>
export const PlusIcon = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const CloseIcon = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const MenuIcon = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
export const TrashIcon = (p) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Svg>
export const SourcesIcon = (p) => <Svg {...p}><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M8 8h6M8 12h6" /></Svg>
export const CopyIcon = (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Svg>
export const CheckIcon = (p) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const LayersIcon = (p) => <Svg {...p}><path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5" /></Svg>