import { useLayoutEffect, useRef, useState } from 'react'
import { isSubmitKey } from '../lib/keys'
import { MAX_LEN, questionLength, validateQuestion } from '../lib/validate'
import { SendIcon, SpinnerIcon, YellowCardIcon } from './Icons'

const MAX_HEIGHT = 168 // about six lines, then the field scrolls

export default function Composer({
  id, value, onChange, onSubmit, placeholder,
  disabled = false, busy = false, variant = 'follow', inputRef, topK, onTopK,
}) {
  const [touched, setTouched] = useState(false)
  const [shaking, setShaking] = useState(false)
  const localRef = useRef(null)
  const fieldRef = inputRef ?? localRef

  const hero = variant === 'hero' || variant === 'landing'
  const length = questionLength(value)
  const problem = validateQuestion(value)
  const showProblem = Boolean(problem) && (touched || problem.kind === 'long')
  const ready = !problem && !busy && !disabled
  const showCounter = variant === 'hero' || showProblem || length >= 400
  const count = `${length} / ${MAX_LEN}`

  // The field grows with what you type.
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value, fieldRef])

  function submit(event) {
    event?.preventDefault()
    if (busy || disabled) return
    if (problem) {
      setTouched(true)
      setShaking(true)
      return
    }
    setTouched(false)
    onSubmit(value)
  }

  const frame = [
    'rounded-3xl border bg-white transition duration-200 ease-out motion-reduce:transition-none',
    hero ? 'p-2.5 shadow-lg shadow-pitch/10' : 'p-2 shadow-md shadow-pitch/10',
    'hover:-translate-y-px hover:border-moss hover:shadow-xl hover:shadow-pitch/15 motion-reduce:hover:translate-y-0',
    'focus-within:border-pitch focus-within:shadow-xl focus-within:ring-4 focus-within:ring-gold/40',
    showProblem ? 'border-gold-edge' : 'border-line',
    shaking ? 'motion-safe:animate-shake' : '',
  ].join(' ')

  const sendState = busy
    ? 'cursor-progress border-transparent bg-gold/70 text-pitch'
    : disabled
      ? 'cursor-not-allowed border-transparent bg-sage text-moss'
      : ready
        ? 'border-gold-edge bg-gold text-pitch hover:shadow-md hover:brightness-95 active:scale-95'
        : 'border-transparent bg-sage text-moss'

  return (
    <div>
      <form onSubmit={submit} className={frame} onAnimationEnd={() => setShaking(false)}>
        <div className="flex items-end gap-2">
          <label htmlFor={id} className="sr-only">
            Your question
          </label>
          <textarea
            id={id}
            ref={fieldRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (isSubmitKey(e.nativeEvent)) submit(e)
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            enterKeyHint="send"
            aria-invalid={showProblem || undefined}
            aria-describedby={showProblem ? `${id}-problem` : undefined}
            className={`composer-field block max-h-[168px] w-full resize-none bg-transparent px-3 py-[10px] text-pitch placeholder:text-moss/70 disabled:cursor-not-allowed disabled:text-moss ${
              hero ? 'min-h-[48px] text-lg leading-7' : 'min-h-[44px] text-base leading-6'
            }`}
          />
          <button
            type="submit"
            disabled={busy || disabled}
            aria-busy={busy || undefined}
            className={`group/send inline-flex shrink-0 touch-manipulation select-none items-center justify-center gap-1.5 rounded-2xl border font-semibold transition duration-150 ease-out motion-reduce:transition-none ${
              hero ? 'h-12 px-5 text-lg' : 'h-11 px-4 text-base'
            } ${sendState}`}
          >
            Ask
            {busy ? (
              <SpinnerIcon size={18} />
            ) : (
              <SendIcon
                size={18}
                className={ready ? 'transition-transform duration-150 ease-out group-hover/send:-translate-y-0.5 group-hover/send:translate-x-0.5 motion-reduce:transform-none' : ''}
              />
            )}
          </button>
        </div>

        {showCounter ? (
          <div className="flex items-center justify-between gap-3 px-3 pb-1 pt-1.5 text-base text-moss">
            {variant === 'hero' ? (
              <label className="flex items-center gap-1">
                Sources to check:
                <select
                  value={topK}
                  onChange={(e) => onTopK(Number(e.target.value))}
                  className="cursor-pointer rounded-md bg-transparent py-1 pl-1 pr-0.5 font-semibold text-pitch transition-colors duration-150 hover:bg-sage"
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span />
            )}
            <span className={`tabular-nums ${showProblem ? 'font-medium text-notice-ink' : ''}`}>{count}</span>
          </div>
        ) : null}
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
    </div>
  )
}