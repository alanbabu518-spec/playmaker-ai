import { cleanSnippet } from '../lib/answer'

export default function SourceCard({ n, source }) {
  return (
    <article
      id={n ? `source-${n}` : undefined}
      className="scroll-mt-4 rounded-2xl border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {n ? (
          <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-gold-edge bg-gold px-1.5 text-sm font-bold">
            {n}
          </span>
        ) : null}
        <h3 className="text-lg font-semibold leading-tight">{source.title}</h3>
      </div>
      {source.section ? <p className="mt-1 text-sm text-moss">{source.section}</p> : null}
      <p className="mt-2 line-clamp-5 font-serif text-base leading-relaxed">{cleanSnippet(source.snippet)}</p>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-semibold underline underline-offset-2 hover:text-pitch-soft"
      >
        Open on Wikipedia
      </a>
    </article>
  )
}