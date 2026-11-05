import { followLink } from '../lib/router'
import { MenuIcon, PanelLeftIcon, PlusIcon, SourcesIcon } from './Icons'
import Logo from './Logo'
import { iconButton, pillButton } from './ui'

export default function TopBar({ isDesktop, historyOpen, onOpenHistory, onNewChat, sources }) {
  const showHistoryControls = !isDesktop || !historyOpen // the sidebar's own buttons cover it otherwise
  return (
    <header className="shrink-0 border-b border-line bg-chalk pt-[env(safe-area-inset-top,0px)]">
      <div className="flex h-[52px] items-center gap-1 px-2 md:px-4">
        {showHistoryControls ? (
          <>
            <button type="button" onClick={onOpenHistory} aria-label="Open chat history" className={iconButton}>
              {isDesktop ? <PanelLeftIcon /> : <MenuIcon />}
            </button>
            <a href="/" onClick={(event) => followLink(event, '/')} aria-label="Playmaker AI home" className="flex items-center gap-2 px-1 text-xl font-semibold">
              <Logo size={26} /> <span className="hidden sm:inline">Playmaker AI</span>
            </a>
          </>
        ) : null}
        <div className="flex-1" />
        {showHistoryControls ? (
          <button type="button" onClick={onNewChat} aria-label="New chat" className={iconButton}>
            <PlusIcon />
          </button>
        ) : null}
        {sources ? (
          <button type="button" onClick={sources.onToggle} aria-pressed={sources.open} className={pillButton}>
            <SourcesIcon size={18} /> Sources ({sources.count})
          </button>
        ) : null}
      </div>
    </header>
  )
}