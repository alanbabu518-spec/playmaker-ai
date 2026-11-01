import Logo from './Logo'
import { isToday } from '../lib/history'

function Group({ label, items, activeId, onSelect }) {
  if (!items.length) return null
  return (
    <div className="mb-5">
      <h2 className="px-3 pb-2 text-base text-white/65">{label}</h2>
      <ul>
        {items.map((entry) => {
          const active = entry.id === activeId
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry.id)}
                aria-current={active ? 'true' : undefined}
                className={`w-full rounded-lg px-3 py-2 text-left text-base leading-snug ${
                  active ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                {entry.question}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Sidebar({ history, activeId, onNew, onSelect }) {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col overflow-y-auto bg-pitch px-4 py-5 text-white md:flex">
      <a href="#/" aria-label="Playmaker AI home" className="flex items-center gap-3 px-1 text-xl font-semibold">
        <Logo size={34} /> Playmaker AI
      </a>
      <button
        type="button"
        onClick={onNew}
        className="mt-6 w-full rounded-xl border border-gold-edge bg-gold py-2.5 text-lg font-semibold text-pitch shadow-sm hover:brightness-95"
      >
        New question
      </button>
      <nav aria-label="Question history" className="mt-7">
        <Group label="Today" items={history.filter((e) => isToday(e.createdAt))} activeId={activeId} onSelect={onSelect} />
        <Group label="Earlier" items={history.filter((e) => !isToday(e.createdAt))} activeId={activeId} onSelect={onSelect} />
      </nav>
    </aside>
  )
}