import { useEffect, useState } from 'react'
import { CloseIcon } from './Icons'
import SourceCard from './SourceCard'
import { iconButton } from './ui'

export default function SourcesPanel({ question, used, checked, focus, onClose }) {
  const [flash, setFlash] = useState(null)

  // Clicking a citation scrolls its card into view and highlights it for a moment.
  useEffect(() => {
    if (!focus?.n) return undefined
    const show = setTimeout(() => {
      document.getElementById(`source-${focus.n}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      setFlash(focus.n)
    }, 150) // lets the sheet finish sliding in first
    const hide = setTimeout(() => setFlash(null), 1800)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.tick])

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-sage">
      <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div className="min-w-0 pt-1">
          <h2 className="text-lg font-semibold">Sources</h2>
          <p className="truncate text-sm text-moss">For: {question}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close sources" className={`${iconButton} -mr-2`}>
          <CloseIcon />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {used.length > 0 ? (
          <>
            <h3 className="mb-3 text-base font-semibold">Used in this answer</h3>
            <div className="space-y-3">
              {used.map(({ n, source }) => (
                <SourceCard key={source.id} n={n} source={source} flash={flash === n} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-base text-moss">This answer did not cite a source. Everything below was only checked.</p>
        )}

        {checked.length > 0 ? (
          <details className="mt-5" open={used.length === 0}>
            <summary className="cursor-pointer text-base font-semibold">Also checked ({checked.length})</summary>
            <div className="mt-3 space-y-3">
              {checked.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  )
}