import { useEffect, useMemo, useRef, useState } from "react";
import Composer from "../components/Composer";
import HistoryPanel from "../components/HistoryPanel";
import { CloseIcon, YellowCardIcon } from "../components/Icons";
import { InlineSlot, Overlay } from "../components/Panels";
import PitchLines from "../components/PitchLines";
import SkipLink from "../components/SkipLink";
import SourcesPanel from "../components/SourcesPanel";
import Thread from "../components/Thread";
import TopBar from "../components/TopBar";
import { iconButton } from "../components/ui";
import { useCountdown } from "../hooks/useCountdown";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { prepareAnswer } from "../lib/answer";
import { usePrefs } from "../lib/prefs";

const EXAMPLES = [
  { label: "How does offside work?", question: "How does offside work?" },
  { label: "Messi’s clubs", question: "Which clubs has Messi played for?" },
  { label: "Who won in 2014?", question: "Who won the 2014 World Cup?" },
];

export default function AppScreen({ chat, route }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [prefs, setPref] = usePrefs();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panel, setPanel] = useState({
    open: false,
    turnId: null,
    focusN: null,
    tick: 0,
  });
  const mainInput = useRef(null);

  const turns = chat.activeChat?.turns ?? [];
  const live = chat.live && chat.live.chatId === route.id ? chat.live : null;
  const loading = live?.phase === "loading";
  const limited = live?.phase === "error" && live.error.kind === "limit";
  const waiting = useCountdown(live?.retryUntil) > 0;
  const hasContent = turns.length > 0 || live !== null;

  // The sources panel follows the newest answer. On a phone it stays closed until you ask for it.
  const lastId = turns.filter((t) => t.result.answered).at(-1)?.id ?? null;
  useEffect(() => {
    setPanel((p) => ({
      ...p,
      open: isDesktop && prefs.sourcesAuto && lastId !== null,
      turnId: lastId,
      focusN: null,
    }));
    // Only a new answer, another chat or a resize resets the panel, not a change of preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, isDesktop]);

  const panelTurn = turns.find((t) => t.id === panel.turnId) ?? null;
  const prepared = useMemo(
    () => (panelTurn ? prepareAnswer(panelTurn.result) : null),
    [panelTurn],
  );
  const panelOpen = panel.open && prepared !== null;

  function openSources(turnId, n = null) {
    setPanel((p) => ({ open: true, turnId, focusN: n, tick: p.tick + 1 }));
    if (isDesktop) setPref("sourcesAuto", true);
  }
  function closeSources() {
    setPanel((p) => ({ ...p, open: false }));
    if (isDesktop) setPref("sourcesAuto", false);
  }
  const openHistory = () =>
    isDesktop ? setPref("historyOpen", true) : setDrawerOpen(true);

  useEffect(() => {
    if (!chat.focusTick) return;
    mainInput.current?.focus();
    mainInput.current?.select();
  }, [chat.focusTick]);

  useEffect(() => {
    document.documentElement.classList.add("app-shell");
    return () => document.documentElement.classList.remove("app-shell");
  }, []);

  const composerProps = {
    value: chat.draft,
    onChange: chat.setDraft,
    onSubmit: chat.ask,
    busy: loading || waiting,
    disabled: limited,
    topK: chat.topK,
    onTopK: chat.setTopK,
    inputRef: mainInput,
  };

  const history = (
    <HistoryPanel
      chats={chat.chats}
      activeId={route.id}
      onNew={() => {
        chat.newChat();
        setDrawerOpen(false);
      }}
      onNavigate={() => setDrawerOpen(false)}
      onDelete={chat.deleteChat}
      onClose={() =>
        isDesktop ? setPref("historyOpen", false) : setDrawerOpen(false)
      }
      closeLabel={isDesktop ? "Close chat history" : "Close menu"}
      closeIcon={isDesktop ? "panel" : "close"}
    />
  );

  const sourcesContent = prepared ? (
    <SourcesPanel
      question={panelTurn.question}
      used={prepared.used}
      checked={prepared.checked}
      focus={{ n: panel.focusN, tick: panel.tick }}
      onClose={closeSources}
    />
  ) : null;

  return (
    <div className="flex h-dvh overflow-hidden bg-chalk text-pitch">
      <SkipLink />

      {isDesktop ? (
        <InlineSlot open={prefs.historyOpen} width={272}>
          {history}
        </InlineSlot>
      ) : (
        <Overlay
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          side="left"
          label="Chat history"
        >
          {history}
        </Overlay>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          isDesktop={isDesktop}
          historyOpen={prefs.historyOpen}
          onOpenHistory={openHistory}
          onNewChat={chat.newChat}
          sources={
            prepared
              ? {
                  count: prepared.used.length || prepared.checked.length,
                  open: panelOpen,
                  onToggle: panelOpen
                    ? closeSources
                    : () => openSources(panel.turnId),
                }
              : null
          }
        />

        <main
          id="content"
          tabIndex={-1}
          className="relative flex min-h-0 flex-1 flex-col outline-none"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:pl-[max(2.5rem,env(safe-area-inset-left,0px))] md:pr-[max(2.5rem,env(safe-area-inset-right,0px))]">
            <div
              className={`mx-auto flex w-full max-w-[720px] flex-col py-8 ${hasContent ? "" : "min-h-full justify-center"}`}
            >
              {chat.notice ? (
                <div
                  role="status"
                  className="mb-6 flex items-center gap-3 rounded-xl border border-gold-edge bg-notice py-2 pl-4 pr-2 text-base font-medium text-notice-ink"
                >
                  <YellowCardIcon className="shrink-0" />
                  <span className="flex-1">{chat.notice}</span>
                  <button
                    type="button"
                    onClick={chat.dismissNotice}
                    aria-label="Dismiss"
                    className={iconButton}
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>
              ) : null}

              {!hasContent ? (
                <div className="relative">
                  <PitchLines />
                  <h1 className="relative text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
                    Ask anything about football.
                  </h1>
                  <p className="relative mt-4 text-lg text-moss md:text-xl">
                    Every answer comes with the sources it was built from.
                  </p>
                  <div className="relative mt-8">
                    <Composer
                      id="ask-main"
                      variant="hero"
                      placeholder="Who won the 2014 World Cup?"
                      {...composerProps}
                    />
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
                <Thread
                  turns={turns}
                  live={live}
                  reduceMotion={reduceMotion}
                  onCite={openSources}
                  onOpenSources={openSources}
                  onCheckMore={chat.checkMore}
                  onEdit={chat.editQuestion}
                  onRetry={chat.retry}
                  onReadEarlier={openHistory}
                />
              )}
            </div>
          </div>

          {hasContent ? (
            <div className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-2 md:pl-[max(2.5rem,env(safe-area-inset-left,0px))] md:pr-[max(2.5rem,env(safe-area-inset-right,0px))]">
              <div className="mx-auto w-full max-w-[720px]">
                <Composer
                  id="ask-main"
                  placeholder={
                    limited
                      ? "Come back tomorrow to ask more"
                      : "Ask another question"
                  }
                  {...composerProps}
                />
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {isDesktop ? (
        <InlineSlot open={panelOpen} width={340}>
          {sourcesContent}
        </InlineSlot>
      ) : (
        <Overlay
          open={panelOpen}
          onClose={closeSources}
          side="bottom"
          label="Sources"
        >
          {sourcesContent}
        </Overlay>
      )}
    </div>
  );
}
