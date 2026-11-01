import { useState } from 'react'
import { toPlainText } from '../lib/answer'

function CiteChip({ n, title }) {
  return (
    <button
      type="button"
      aria-label={`Source ${n}: ${title}`}
      onClick={() => document.getElementById(`source-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
      className="relative mx-0.5 ml-1.5 inline-flex h-6 min-w-6 -translate-y-0.5 items-center justify-center rounded-md border border-gold-edge bg-gold px-1.5 align-middle font-sans text-sm font-bold text-pitch after:absolute after:-inset-2.5 after:content-['']"
    >
      {n}
    </button>
  )
}

const pill =
  'min-h-11 rounded-full border border-line bg-white px-4 text-base font-medium text-pitch shadow-sm hover:border-moss'

export default function AnswerView({ question, result, prepared, canCheckMore, onCheckMore }) {
  const [copied, setCopied] = useState(false)
  const seconds = (result.latency_ms / 1000).toFixed(1)

  async function copy() {
    try {
      await navigator.clipboard.writeText(toPlainText(prepared.parts))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked by the browser: nothing to do.
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold leading-tight tracking-tight">{question}</h1>
      <p aria-live="polite" className="mt-6 font-serif text-xl leading-[1.75]">
        {prepared.parts.map((part, i) =>
          part.type === 'cite' ? (
            <CiteChip key={i} n={part.n} title={prepared.used[part.n - 1].source.title} />
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </p>
      <p className="mt-4 text-sm text-moss">{result.cached ? 'Saved answer' : `${seconds} s`} · Gemini</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className={pill}>
          {copied ? 'Copied' : 'Copy answer'}
        </button>
        {canCheckMore ? (
          <button type="button" onClick={onCheckMore} className={pill}>
            Check 10 sources
          </button>
        ) : null}
      </div>
    </div>
  )
}