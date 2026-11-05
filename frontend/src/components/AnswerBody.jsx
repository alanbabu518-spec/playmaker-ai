import { Fragment } from 'react'
import { parseBlocks } from '../lib/markup'

function Cite({ n, title, onCite }) {
  return (
    <button
      type="button"
      onClick={() => onCite(n)}
      title={title}
      aria-label={`Source ${n}: ${title}`}
      className="relative mx-0.5 ml-1 inline-flex h-[22px] min-w-[22px] -translate-y-px items-center justify-center rounded-md border border-gold-edge bg-gold px-1.5 align-middle font-sans text-[0.8rem] font-bold leading-none text-pitch transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-90 after:absolute after:-inset-2.5 after:content-['']"
    >
      {n}
    </button>
  )
}

function Inline({ tokens, used, onCite }) {
  return tokens.map((t, i) => {
    if (t.type === 'text') return <Fragment key={i}>{t.text}</Fragment>
    if (t.type === 'bold') {
      return (
        <strong key={i} className="font-semibold">
          <Inline tokens={t.children} used={used} onCite={onCite} />
        </strong>
      )
    }
    const source = used[t.n - 1]?.source
    return source ? <Cite key={i} n={t.n} title={source.title} onCite={onCite} /> : null
  })
}

export default function AnswerBody({ text, used, onCite }) {
  return (
    <div className="space-y-3 font-serif text-xl leading-[1.7]">
      {parseBlocks(text).map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i}>
              <Inline tokens={block.inline} used={used} onCite={onCite} />
            </p>
          )
        }
        const List = block.type === 'ul' ? 'ul' : 'ol'
        return (
          <List key={i} className={`space-y-1.5 pl-6 marker:text-moss ${block.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {block.items.map((tokens, j) => (
              <li key={j}>
                <Inline tokens={tokens} used={used} onCite={onCite} />
              </li>
            ))}
          </List>
        )
      })}
    </div>
  )
}