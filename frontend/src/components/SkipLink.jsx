export default function SkipLink() {
  return (
    <button
      type="button"
      onClick={() => document.getElementById('content')?.focus()}
      className="sr-only z-50 rounded-lg bg-gold px-4 py-2 font-semibold text-pitch focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      Skip to main content
    </button>
  )
}