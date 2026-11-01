import { useState } from 'react'
import { YellowCardIcon } from './Icons'
import { MAX_LEN, questionLength, validateQuestion } from '../lib/validate'

export default function Composer({
  id, value, onChange, onSubmit, placeholder,
  disabled = false, busy = false, variant = 'follow', inputRef, topK, onTopK,
}) {
  const [touched, setTouched] = useState(false)
  const problem = validateQuestion(value)
  const showProblem = Boolean(problem) && (touched || problem.kind === 'long')
  const hero = variant === 'hero'
  const blocked = disabled || busy
  const count = `${questionLength(value)} / ${MAX_LEN}`

  function submit(e) {
    e.preventDefault()
    if (blocked) return
    if (problem) {
      setTouched(true)
      return
    }
    setTouched(false)
    onSubmit(value)
  }

  return (
    <div>
      <form
        onSubmit={submit}
        className={`flex items-center gap-2 rounded-2xl border bg-white p-2 ${
          hero ? 'shadow-lg shadow-pitch/10' : 'shadow-md shadow-pitch/10'
        } ${showProblem ? 'border-gold-edge' : 'border-line'}`}
      >
        <label htmlFor={id} className="sr-only">
          Your question
        </label>
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-invalid={showProblem || undefined}
          aria-describedby={showProblem ? `${id}-problem` : undefined}
          className={`min-w-0 flex-1 bg-transparent px-3 text-pitch outline-none placeholder:text-moss/70 ${
            hero ? 'h-12 text-lg' : 'h-11 text-base'
          }`}
        />
        {showProblem ? <span className="shrink-0 pr-1 text-base tabular-nums text-notice-ink">{count}</span> : null}
        <button
          type="submit"
          disabled={blocked}
          className={`shrink-0 rounded-xl border font-semibold ${hero ? 'h-12 px-6 text-lg' : 'h-11 px-5 text-base'} ${
            blocked
              ? 'cursor-not-allowed border-transparent bg-sage text-moss'
              : 'border-gold-edge bg-gold text-pitch hover:brightness-95'
          }`}
        >
          Ask
        </button>
      </form>

      {showProblem ? (
        <div
          id={`${id}-problem`}
          role="alert"
          className="mt-3 flex items-center gap-3 rounded-xl border border-gold-edge bg-notice px-4 py-2.5 text-base font-medium text-notice-ink"
        >
          <YellowCardIcon className="shrink-0" />
          {problem.message}
        </div>
      ) : null}

      {hero ? (
        <div className="mt-4 flex items-center justify-between text-base text-moss">
          <label className="flex items-center gap-1">
            Sources to check:
            <select
              value={topK}
              onChange={(e) => onTopK(Number(e.target.value))}
              className="rounded-md bg-transparent py-1 font-semibold text-moss"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <span className="tabular-nums">{count}</span>
        </div>
      ) : null}
    </div>
  )
}