import { ConnectionCard, FullTimeCard, NoticeCard, RateLimitNotice, UnavailableCard } from './StateCards'

export default function ErrorView({ live, onRetry, onEdit, onReadEarlier }) {
  const { error } = live
  switch (error.kind) {
    case 'limit':
      return <FullTimeCard onReadEarlier={onReadEarlier} />
    case 'network':
      return <ConnectionCard onRetry={onRetry} />
    case 'rate_limit':
      return <RateLimitNotice until={live.retryUntil} onRetry={onRetry} />
    case 'unavailable':
    case 'server':
    case 'timeout':
      return <UnavailableCard onRetry={onRetry} onEdit={() => onEdit(live.question)} />
    default:
      return <NoticeCard message={error.message} />
  }
}