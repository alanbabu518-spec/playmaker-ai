import {
  ConnectionCard, FullTimeCard, NoAnswerCard, NoticeCard, RateLimitNotice, UnavailableCard,
} from './StateCards'

// Picks the right card for every phase that is not "loading" or "a cited answer".
export default function StateView({ current, canCheckMore, onRetry, onEdit, onCheckMore, onReadEarlier }) {
  const kind = current.phase === 'done' ? 'no-answer' : current.error.kind

  let card
  switch (kind) {
    case 'no-answer': {
      const { latency_ms: ms, cached } = current.result
      card = (
        <NoAnswerCard
          meta={`${cached ? 'Saved answer' : `${(ms / 1000).toFixed(1)} s`} · Gemini`}
          onRephrase={onEdit}
          onCheckMore={canCheckMore ? onCheckMore : undefined}
        />
      )
      break
    }
    case 'limit':
      card = <FullTimeCard onReadEarlier={onReadEarlier} />
      break
    case 'network':
      card = <ConnectionCard onRetry={onRetry} />
      break
    case 'rate_limit':
      card = <RateLimitNotice until={current.retryUntil} onRetry={onRetry} />
      break
    case 'unavailable':
    case 'server':
    case 'timeout':
      card = <UnavailableCard onRetry={onRetry} onEdit={onEdit} />
      break
    default:
      card = <NoticeCard message={current.error.message} />
  }

  return (
    <div>
      <h1 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h1>
      <div className="mt-6">{card}</div>
    </div>
  )
}