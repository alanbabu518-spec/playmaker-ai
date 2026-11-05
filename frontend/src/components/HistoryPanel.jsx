import { useState } from 'react'
import { groupByDay } from '../lib/chats'
import { chatPath, followLink } from '../lib/router'
import { CloseIcon, PanelLeftIcon, PlusIcon, TrashIcon } from './Icons'
import Logo from './Logo'
import { iconButtonDark } from './ui'

function ChatItem({ chat, active, onNavigate, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <li className="flex items-center gap-1 rounded-xl bg-white/10 py-1 pl-3 pr-1 text-base">
        <span className="min-w-0 flex-1 truncate text-white/85">Delete this chat?</span>
        <button type="button" onClick={() => onDelete(chat.id)} className="h-[40px] rounded-lg px-3 font-semibold text-gold">
          Delete
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="h-[40px] rounded-lg px-3 text-white/85">
          Cancel
        </button>
      </li>
    )
  }

  const path = chatPath(chat.id)
  return (
    <li className="group relative">
      <a
        href={path}
        onClick={(event) => {
          followLink(event, path)
          if (event.defaultPrevented) onNavigate?.()
        }}
        aria-current={active ? 'page' : undefined}
        className={`block truncate rounded-xl py-3 pl-3 pr-12 text-base leading-snug transition-colors duration-150 ${
          active ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/[0.07]'
        }`}
      >
        {chat.title}
      </a>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete chat: ${chat.title}`}
        className="absolute right-1 top-1/2 flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition duration-150 hover:text-white focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0"
      >
        <TrashIcon size={18} />
      </button>
    </li>
  )
}

export default function HistoryPanel({ chats, activeId, onNew, onNavigate, onDelete, onClose, closeLabel, closeIcon = 'panel' }) {
  const groups = groupByDay(chats)
  return (
    <div className="flex h-full w-full flex-col bg-pitch pt-[env(safe-area-inset-top,0px)] text-white">
      <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3">
        <a
          href="/"
          onClick={(event) => {
            followLink(event, '/')
            if (event.defaultPrevented) onNavigate?.()
          }}
          aria-label="Playmaker AI home"
          className="flex items-center gap-2.5 text-xl font-semibold"
        >
          <Logo size={30} /> Playmaker AI
        </a>
        <button type="button" onClick={onClose} aria-label={closeLabel} className={iconButtonDark}>
          {closeIcon === 'close' ? <CloseIcon /> : <PanelLeftIcon />}
        </button>
      </div>

      <div className="px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={onNew}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gold-edge bg-gold text-lg font-semibold text-pitch shadow-sm transition duration-150 ease-out hover:brightness-95 active:scale-[0.98]"
        >
          <PlusIcon size={18} /> New chat
        </button>
      </div>

      <nav aria-label="Chat history" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {groups.length === 0 ? (
          <p className="px-3 py-2 text-base text-white/60">Your chats will appear here.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-4">
              <h2 className="px-3 pb-1.5 text-base text-white/60">{group.label}</h2>
              <ul>
                {group.chats.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} active={chat.id === activeId} onNavigate={onNavigate} onDelete={onDelete} />
                ))}
              </ul>
            </section>
          ))
        )}
      </nav>
    </div>
  )
}