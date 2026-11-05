import { useEffect, useState } from 'react'
import { isChatId } from './chats.js'

const EVENT = 'playmaker:navigate'

// '/' landing, '/new' empty chat, '/chat/<uuid>' a saved chat. Anything else is 'unknown'.
export function parseRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'landing', id: null }
  if (path === '/new') return { name: 'new', id: null }
  const match = path.match(/^\/chat\/([^/]+)$/)
  if (match && isChatId(match[1])) return { name: 'chat', id: match[1].toLowerCase() }
  return { name: 'unknown', id: null }
}

export const chatPath = (id) => `/chat/${id}`

export function navigate(path, { replace = false } = {}) {
  if (window.location.pathname === path) return
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path)
  window.dispatchEvent(new Event(EVENT))
}

// For <a href="/new" onClick={(e) => followLink(e, '/new')}>. The link stays a real link
// (middle-click and "open in new tab" work), but a plain click does not reload the page.
export function followLink(event, path) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  event.preventDefault()
  navigate(path)
}

// Old hash links (#/app) from the first version go to the new URLs.
export function fixLegacyUrl() {
  const { hash } = window.location
  if (hash.startsWith('#/')) window.history.replaceState(null, '', hash.startsWith('#/app') ? '/new' : '/')
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname))
  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', sync) // Back and Forward buttons
    window.addEventListener(EVENT, sync) // our own navigate()
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(EVENT, sync)
    }
  }, [])
  return route
}