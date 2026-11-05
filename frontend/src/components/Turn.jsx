import { useEffect, useMemo, useState } from 'react'
import { prepareAnswer, toPlainText } from '../lib/answer'
import AnswerBody from './AnswerBody'
import { CheckIcon, CopyIcon, LayersIcon, SourcesIcon } from './Icons'
import Logo from './Logo'
import PassLine from './PassLine'
import { NoAnswerCard } from './StateCards'

const action =
  'inline-flex h-[44px] items-center gap-1.5 rounded-lg px-3 text-base font-medium text-moss transition duration-150 ease-out hover:bg-pitch/[0.07] hover:text-pitch active:scale-95 md:h-9'

export function UserBubble({ children }) {
  return (
    <div className="max-w-[85%] self-end break-words rounded-2xl rounded-br-md bg-pitch px-4 py-2.5 text-lg leading-snug text-white shadow-sm">
      {children}
    </div>
  )
}

export function AssistantRow({ children }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pitch text-white sm:flex">
        <Logo size={18} />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function LoadingBody() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(id)
  }, [])
  return (
    <div role="status" className="py-1">
      <PassLine className="w-[260px] max-w-full" />
      <p className="mt-3 text-lg font-medium text-pitch-soft">Searching football sources…</p>
      {slow ? <p className="mt-1 text-base text-moss">Still working. The free server can take up to a minute to wake up.</p> : null}
    </div>
  )
}

function SourcePills({ used, onCite, onMore }) {
  const shown = used.slice(0, 3)
  const extra = used.length - shown.length
  return (
    <ul aria-label="Sources used" className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
      {shown.map(({ n, source }) => (
        <li key={n} className="min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => onCite(n)}
            className="flex h-[44px] max-w-full items-center gap-2 rounded-full border border-line bg-chalk pl-1.5 pr-3.5 text-sm font-medium transition duration-150 ease-out hover:border-moss hover:bg-white active:scale-95 md:h-9"
          >
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-pitch">{n}</span>
            <span className="truncate">{source.title}</span>
          </button>
        </li>
      ))}
      {extra > 0 ? (
        <li>
          <button type="button" onClick={onMore} className="h-[44px] rounded-full px-3 text-sm font-medium text-moss transition hover:text-pitch md:h-9">
            +{extra} more
          </button>
        </li>
      ) : null}
    </ul>
  )
}

export function AnswerTurn({ turn, onCite, onOpenSources, onCheckMore, onEdit }) {
  const { result } = turn
  const prepared = useMemo(() => prepareAnswer(result), [result])
  const [copied, setCopied] = useState(false)
  const [fresh] = useState(() => Date.now() - turn.createdAt < 3000) // only a just-arrived answer animates
  const meta = `${result.cached ? 'Saved answer' : `${(result.latency_ms / 1000).toFixed(1)} s`} · Gemini`
  const canCheckMore = turn.topK < 10
  const animation = fresh ? 'animate-answer-in' : ''

  if (!result.answered) {
    return (
      <div className={animation}>
        <NoAnswerCard
          meta={meta}
          onRephrase={() => onEdit(turn.question)}
          onCheckMore={canCheckMore ? () => onCheckMore(turn.id) : undefined}
        />
      </div>
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(toPlainText(prepared.text))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked by the browser: nothing to do.
    }
  }

  const count = prepared.used.length || prepared.checked.length
  return (
    <div className={animation}>
      <div className="rounded-2xl border border-line bg-white px-5 py-4 shadow-sm md:px-6 md:py-5">
        <AnswerBody text={prepared.text} used={prepared.used} onCite={(n) => onCite(turn.id, n)} />
        {prepared.used.length > 0 ? (
          <SourcePills used={prepared.used} onCite={(n) => onCite(turn.id, n)} onMore={() => onOpenSources(turn.id)} />
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center px-1">
        <p className="mr-auto pr-3 text-sm text-moss">{meta}</p>
        <button type="button" onClick={copy} className={action}>
          {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" onClick={() => onOpenSources(turn.id)} className={action}>
          <SourcesIcon size={18} /> Sources ({count})
        </button>
        {canCheckMore ? (
          <button type="button" onClick={() => onCheckMore(turn.id)} className={action}>
            <LayersIcon size={18} /> Check 10 sources
          </button>
        ) : null}
      </div>
    </div>
  )
}