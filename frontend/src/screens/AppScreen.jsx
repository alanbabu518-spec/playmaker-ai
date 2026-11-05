import { useEffect, useMemo, useRef, useState } from 'react'
import Composer from '../components/Composer'
import HistoryPanel from '../components/HistoryPanel'
import { CloseIcon, YellowCardIcon } from '../components/Icons'
import { InlineSlot, Overlay } from '../components/Panels'
import PassLine from '../components/PassLine'
import PitchLines from '../components/PitchLines'
import SkipLink from '../components/SkipLink'
import SourcesPanel from '../components/SourcesPanel'
import TopBar from '../components/TopBar'
import { iconButton } from '../components/ui'
import { useCountdown } from '../hooks/useCountdown'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { prepareAnswer } from '../lib/answer'
import { usePrefs } from '../lib/prefs'
import { navigate } from '../lib/router'

const EXAMPLES = [
  { label: 'How does offside work?', question: 'How does offside work?' },
  { label: 'Messi’s clubs', question: 'Which clubs has Messi played for?' },
  { label: 'Who won in 2014?', question: 'Who won the 2014 World Cup?' },
]

export default function AppScreen({ chat, route }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [prefs, setPref] = usePrefs()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [panel, setPanel] = useState({ open: false, turnId: null })
  const mainInput = useRef(null)
  const scrollRef = useRef(null)

  const turns = chat.activeChat?.turns ?? []
  const live = chat.live && chat.live.chatId === route.id ? chat.live : null
  const loading = live?.phase === 'loading'
  const limited = live?.phase === 'error' && live.error.kind === 'limit'
  const waiting = useCountdown(live?.retryUntil) > 0
  const hasContent = turns.length > 0 || live !== null

  // The sources panel follows the newest answer. On a phone it stays closed until you ask for it.
  const lastId = turns.filter((t) => t.result.answered).at(-1)?.id ?? null
  useEffect(() => {
    setPanel({ open: isDesktop && prefs.sourcesAuto && lastId !== null, turnId: lastId })
    // Only a new answer, another chat or a resize resets the panel, not a change of preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, isDesktop])

  const panelTurn = turns.find((t) => t.id === panel.turnId) ?? null
  const prepared = useMemo(() => (panelTurn ? prepareAnswer(panelTurn.result) : null), [panelTurn])
  const panelOpen = panel.open && prepared !== null

  function openSources(turnId) {
    setPanel({ open: true, turnId })
    if (isDesktop) setPref('sourcesAuto', true)
  }
  function closeSources() {
    setPanel((p) => ({ ...p, open: false }))
    if (isDesktop) setPref('sourcesAuto', false)
  }

  useEffect(() => {
    if (!chat.focusTick) return
    mainInput.current?.focus()
    mainInput.current?.select()
  }, [chat.focusTick])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [turns.length, live?.phase, reduceMotion])

  const composerProps = {
    value: chat.draft,
    onChange: chat.setDraft,
    onSubmit: chat.ask,
    busy: loading || waiting,
    disabled: limited,
    topK: chat.topK,
    onTopK: chat.setTopK,
    inputRef: mainInput,
  }

  const history = (
    <HistoryPanel
      chats={chat.chats}
      activeId={route.id}
      onNew={() => {
        chat.newChat()
        setDrawerOpen(false)
      }}
      onNavigate={() => setDrawerOpen(false)}
      onDelete={chat.deleteChat}
      onClose={() => (isDesktop ? setPref('historyOpen', false) : setDrawerOpen(false))}
      closeLabel={isDesktop ? 'Close chat history' : 'Close menu'}
      closeIcon={isDesktop ? 'panel' : 'close'}
    />
  )

  return (
    <div className="flex h-dvh overflow-hidden bg-chalk text-pitch">
      <SkipLink />

      {isDesktop ? (
        <InlineSlot open={prefs.historyOpen} width={272}>
          {history}
        </InlineSlot>
      ) : (
        <Overlay open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left" label="Chat history">
          {history}
        </Overlay>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          isDesktop={isDesktop}
          historyOpen={prefs.historyOpen}
          onOpenHistory={() => (isDesktop ? setPref('historyOpen', true) : setDrawerOpen(true))}
          onNewChat={chat.newChat}
          sources={
            prepared
              ? {
                  count: prepared.used.length || prepared.checked.length,
                  open: panelOpen,
                  onToggle: panelOpen ? closeSources : () => openSources(panel.turnId),
                }
              : null
          }
        />

        <main id="content" tabIndex={-1} className="relative flex min-h-0 flex-1 flex-col outline-none">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 md:px-10">
            <div className={`mx-auto flex w-full max-w-[720px] flex-col py-8 ${hasContent ? '' : 'min-h-full justify-center'}`}>
              {chat.notice ? (
                <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-gold-edge bg-notice py-2 pl-4 pr-2 text-base font-medium text-notice-ink">
                  <YellowCardIcon className="shrink-0" />
                  <span className="flex-1">{chat.notice}</span>
                  <button type="button" onClick={chat.dismissNotice} aria-label="Dismiss" className={iconButton}>
                    <CloseIcon size={18} />
                  </button>
                </div>
              ) : null}

              {!hasContent ? (
                <div className="relative">
                  <PitchLines />
                  <h1 className="relative text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">Ask anything about football.</h1>
                  <p className="relative mt-4 text-lg text-moss md:text-xl">Every answer comes with the sources it was built from.</p>
                  <div className="relative mt-8">
                    <Composer id="ask-main" variant="hero" placeholder="Who won the 2014 World Cup?" {...composerProps} />
                  </div>
                  <div className="relative mt-6 flex flex-wrap gap-3">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => chat.ask(ex.question)}
                        className="h-[44px] rounded-full border border-line bg-white px-4 text-base font-semibold text-pitch shadow-sm transition duration-150 ease-out hover:border-moss active:scale-[0.97]"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Placeholder thread: step 3 replaces this with the real answer cards.
                <div className="space-y-8">
                  {turns.map((t) => (
                    <section key={t.id}>
                      <h2 className="text-2xl font-bold">{t.question}</h2>
                      <p className="mt-3 font-serif text-lg leading-relaxed">{t.result.answer}</p>
                      {t.result.answered ? (
                        <button type="button" onClick={() => openSources(t.id)} className="mt-3 text-base font-semibold underline">
                          Sources ({t.result.sources.length})
                        </button>
                      ) : null}
                    </section>
                  ))}
                  {loading ? (
                    <section>
                      <h2 className="text-2xl font-bold">{live.question}</h2>
                      <PassLine className="mt-6 w-[300px] max-w-full" />
                      <p role="status" className="mt-3 text-lg font-medium text-pitch-soft">Searching football sources…</p>
                    </section>
                  ) : null}
                  {live?.phase === 'error' ? (
                    <section>
                      <h2 className="text-2xl font-bold">{live.question}</h2>
                      <p className="mt-3 text-lg">{live.error.message}</p>
                      <button type="button" onClick={chat.retry} className="mt-3 text-base font-semibold underline">Try again</button>
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {hasContent ? (
            <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:px-10">
              <div className="mx-auto w-full max-w-[720px]">
                <Composer
                  id="ask-main"
                  placeholder={limited ? 'Come back tomorrow to ask more' : 'Ask another question'}
                  {...composerProps}
                />
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {(() => {
        const content = prepared ? (
          <SourcesPanel question={panelTurn.question} used={prepared.used} checked={prepared.checked} onClose={closeSources} />
        ) : null
        return isDesktop ? (
          <InlineSlot open={panelOpen} width={340}>
            {content}
          </InlineSlot>
        ) : (
          <Overlay open={panelOpen} onClose={closeSources} side="bottom" label="Sources">
            {content}
          </Overlay>
        )
      })()}
    </div>
  )
}

export { navigate }