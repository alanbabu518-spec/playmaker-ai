import { useEffect, useMemo, useRef } from 'react'
import AnswerView from '../components/AnswerView'
import Composer from '../components/Composer'
import Logo from '../components/Logo'
import PassLine from '../components/PassLine'
import PitchLines from '../components/PitchLines'
import Sidebar from '../components/Sidebar'
import SourcesPanel from '../components/SourcesPanel'
import StateView from '../components/StateView'
import { useCountdown } from '../hooks/useCountdown'
import { prepareAnswer } from '../lib/answer'

const EXAMPLES = [
  { label: 'How does offside work?', question: 'How does offside work?' },
  { label: 'Messi’s clubs', question: 'Which clubs has Messi played for?' },
  { label: 'Who won in 2014?', question: 'Who won the 2014 World Cup?' },
]

export default function AppScreen({ chat }) {
  const { current, history, draft, setDraft, topK, setTopK, focusTick } = chat
  const mainInput = useRef(null)
  const sheetInput = useRef(null)

  const loading = current?.phase === 'loading'
  const answered = current?.phase === 'done' && current.result.answered
  const limited = current?.phase === 'error' && current.error.kind === 'limit'
  const waiting = useCountdown(current?.retryUntil) > 0
  const prepared = useMemo(() => (answered ? prepareAnswer(current.result) : null), [answered, current])
  const hasPanel = loading || answered
  const earlier = history.find((e) => e.result.answered) ?? history[0]

  // "Edit question" focuses whichever input is visible (the sheet one on phones).
  useEffect(() => {
    if (!focusTick) return
    const el = [mainInput, sheetInput].map((r) => r.current).find((node) => node && node.offsetParent !== null)
    el?.focus()
    el?.select()
  }, [focusTick])

  const composerProps = {
    value: draft,
    onChange: setDraft,
    onSubmit: chat.ask,
    busy: loading || waiting,
    topK,
    onTopK: setTopK,
  }
  const followPlaceholder = limited
    ? 'Come back tomorrow to ask more'
    : loading || answered
      ? 'Ask a follow-up'
      : 'Ask another question'

  let body
  if (!current) {
    body = (
      <div className="mx-auto w-full max-w-[620px] md:my-auto">
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">Ask anything about football.</h1>
        <p className="mt-4 text-lg text-moss md:text-xl">Every answer comes with the sources it was built from.</p>
        <div className="mt-8">
          <Composer id="ask-main" variant="hero" placeholder="Who won the 2014 World Cup?" inputRef={mainInput} {...composerProps} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => chat.ask(ex.question)}
              className="min-h-11 rounded-full border border-line bg-white px-4 text-base font-semibold text-pitch shadow-sm hover:border-moss"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    )
  } else if (loading) {
    body = (
      <div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h1>
        <PassLine className="mt-8 w-[300px] max-w-full" />
        <p role="status" className="mt-3 text-lg font-medium text-pitch-soft">
          Searching football sources…
        </p>
      </div>
    )
  } else if (answered) {
    body = (
      <AnswerView
        question={current.question}
        result={current.result}
        prepared={prepared}
        canCheckMore={current.topK < 10}
        onCheckMore={chat.checkMore}
      />
    )
  } else {
    body = (
      <StateView
        current={current}
        canCheckMore={current.topK < 10}
        onRetry={chat.retry}
        onEdit={chat.editQuestion}
        onCheckMore={chat.checkMore}
        onReadEarlier={earlier ? () => chat.selectEntry(earlier.id) : undefined}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <header className="flex items-center gap-3 bg-pitch px-5 py-4 text-white md:hidden">
        <Logo size={32} />
        <a href="#/" className="text-2xl font-semibold">Playmaker AI</a>
      </header>
      <Sidebar history={history} activeId={current?.entryId} onNew={chat.newQuestion} onSelect={chat.selectEntry} />

      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-5 pt-8 md:px-12 md:pt-12">
          {!current ? <PitchLines /> : null}
          <div className={`relative flex w-full flex-1 flex-col ${current ? 'max-w-[640px]' : ''}`}>
            {body}
            {current ? (
              <div className={`sticky bottom-0 mt-auto bg-chalk pb-6 pt-8 ${hasPanel ? 'hidden md:block' : ''}`}>
                <Composer
                  id="ask-main"
                  placeholder={followPlaceholder}
                  inputRef={mainInput}
                  {...composerProps}
                  disabled={limited}
                />
              </div>
            ) : null}
          </div>
        </section>

        {hasPanel ? (
          <SourcesPanel loading={loading} used={prepared?.used} checked={prepared?.checked}>
            <Composer id="ask-sheet" placeholder="Ask a follow-up" inputRef={sheetInput} {...composerProps} />
          </SourcesPanel>
        ) : null}
      </main>
    </div>
  )
}