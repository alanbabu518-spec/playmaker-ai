import { useCountdown } from '../hooks/useCountdown'
import { ConnectionIcon, FlagIcon, RedCardIcon, YellowCardIcon } from './Icons'

const outline =
  'min-h-11 rounded-full border border-line bg-white px-4 text-base font-medium text-pitch shadow-sm hover:border-moss'
const solid =
  'min-h-11 rounded-xl border border-gold-edge bg-gold px-5 text-base font-semibold text-pitch shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sage disabled:text-moss'

function Card({ icon, title, text, actions, alert = false }) {
  return (
    <section
      role={alert ? 'alert' : undefined}
      className="rounded-3xl border border-line bg-white p-7 shadow-lg shadow-pitch/5"
    >
      {icon ? <div className="mb-4 flex min-h-10 items-end">{icon}</div> : null}
      <h2 className="text-2xl font-bold leading-tight">{title}</h2>
      <p className="mt-2 font-serif text-lg leading-relaxed text-moss">{text}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  )
}

export function NoAnswerCard({ meta, onRephrase, onCheckMore }) {
  return (
    <div aria-live="polite">
      <Card
        icon={<FlagIcon />}
        title="The sources don’t cover this."
        text="Playmaker AI only answers from what it can cite, and predictions aren’t in the football sources. Try a question about past results, rules, players or clubs."
        actions={
          <>
            <button type="button" onClick={onRephrase} className={outline}>
              Rephrase question
            </button>
            {onCheckMore ? (
              <button type="button" onClick={onCheckMore} className={outline}>
                Check 10 sources
              </button>
            ) : null}
          </>
        }
      />
      <p className="mt-4 text-sm text-moss">{meta}</p>
    </div>
  )
}

export function FullTimeCard({ onReadEarlier }) {
  return (
    <Card
      icon={<span className="inline-flex h-9 items-center rounded-lg bg-pitch px-3 text-lg font-bold text-gold">FT</span>}
      title="Full time for today."
      text="You’ve used all of today’s questions. The limit resets tomorrow, so come back then and carry on."
      actions={
        onReadEarlier ? (
          <button type="button" onClick={onReadEarlier} className={outline}>
            Read earlier answers
          </button>
        ) : null
      }
    />
  )
}

export function UnavailableCard({ onRetry, onEdit }) {
  return (
    <div className="max-w-[500px]">
      <Card
        alert
        icon={<RedCardIcon />}
        title="The AI is temporarily unavailable."
        text="Something went wrong on our side. Your question is saved, so nothing is lost. Try again in a moment."
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className={solid}>
          Try again
        </button>
        <button type="button" onClick={onEdit} className={outline}>
          Edit question
        </button>
      </div>
    </div>
  )
}

export function ConnectionCard({ onRetry }) {
  return (
    <div className="max-w-[500px]">
      <Card
        alert
        icon={<ConnectionIcon />}
        title="Connection lost."
        text="We couldn’t reach Playmaker AI. Check your internet connection and try again. Your question is still here."
      />
      <div className="mt-4">
        <button type="button" onClick={onRetry} className={solid}>
          Try again
        </button>
      </div>
    </div>
  )
}

// Not in the design: it reuses the yellow notice style from the input validation states.
export function RateLimitNotice({ until, onRetry }) {
  const seconds = useCountdown(until)
  return (
    <div
      role="alert"
      className="flex max-w-[500px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-edge bg-notice px-5 py-4 text-notice-ink"
    >
      {/* Announced once. The ticking number below is hidden from screen readers so it doesn't chatter. */}
      <span className="sr-only">Too many questions. Please wait a moment.</span>
      <span aria-hidden="true" className="flex items-center gap-3 text-base font-medium">
        <YellowCardIcon className="shrink-0" />
        {seconds > 0 ? `Too many questions. Try again in ${seconds} s.` : 'You can ask again now.'}
      </span>
      <button type="button" onClick={onRetry} disabled={seconds > 0} className={solid}>
        Try again
      </button>
    </div>
  )
}

export function NoticeCard({ message }) {
  return (
    <div
      role="alert"
      className="flex max-w-[500px] items-center gap-3 rounded-2xl border border-gold-edge bg-notice px-5 py-4 text-base font-medium text-notice-ink"
    >
      <YellowCardIcon className="shrink-0" />
      {message}
    </div>
  )
}