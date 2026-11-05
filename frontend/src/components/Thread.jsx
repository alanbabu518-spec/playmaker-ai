import { useEffect, useRef } from 'react'
import ErrorView from './ErrorView'
import { AnswerTurn, AssistantRow, LoadingBody, UserBubble } from './Turn'

export default function Thread({ turns, live, reduceMotion, onCite, onOpenSources, onCheckMore, onEdit, onRetry, onReadEarlier }) {
  const targetRef = useRef(null)
  // The newest thing is where the page scrolls to: the question being answered, or the last answer.
  const targetId = live ? (live.replaceTurnId ?? 'live') : (turns.at(-1)?.id ?? null)

  useEffect(() => {
    targetRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [targetId, live?.phase, reduceMotion])

  const status = () =>
    live.phase === 'loading' ? (
      <LoadingBody />
    ) : (
      <ErrorView live={live} onRetry={onRetry} onEdit={onEdit} onReadEarlier={onReadEarlier} />
    )

  return (
    <div className="flex flex-col gap-8">
      {turns.map((turn) => (
        <div key={turn.id} ref={targetId === turn.id ? targetRef : null} className="flex scroll-mt-4 flex-col gap-4">
          <UserBubble>{turn.question}</UserBubble>
          <AssistantRow>
            {live?.replaceTurnId === turn.id ? (
              status()
            ) : (
              <AnswerTurn turn={turn} onCite={onCite} onOpenSources={onOpenSources} onCheckMore={onCheckMore} onEdit={onEdit} />
            )}
          </AssistantRow>
        </div>
      ))}
      {live && !live.replaceTurnId ? (
        <div ref={targetId === 'live' ? targetRef : null} className="flex scroll-mt-4 flex-col gap-4">
          <UserBubble>{live.question}</UserBubble>
          <AssistantRow>{status()}</AssistantRow>
        </div>
      ) : null}
    </div>
  )
}