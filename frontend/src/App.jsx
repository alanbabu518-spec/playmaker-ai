import { useEffect } from 'react'
import { isMock } from './api/client'
import { useChat } from './hooks/useChat'
import { navigate, useRoute } from './lib/router'
import AppScreen from './screens/AppScreen'
import LandingScreen from './screens/LandingScreen'

export default function App() {
  const route = useRoute()
  const chat = useChat(route)

  useEffect(() => {
    window.scrollTo(0, 0) // every screen change starts at the top
  }, [route.name])

  useEffect(() => {
    if (route.name === 'unknown') navigate('/', { replace: true })
  }, [route.name])

  useEffect(() => {
    document.title =
      route.name === 'chat' && chat.activeChat
        ? `${chat.activeChat.title} · Playmaker AI`
        : route.name === 'new'
          ? 'New chat · Playmaker AI'
          : 'Playmaker AI: football answers you can check'
  }, [route.name, chat.activeChat])

  return (
    <>
      {isMock ? (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-notice py-1 text-center text-sm font-semibold text-notice-ink"
        >
          Demo mode: these are sample answers, not real results.
        </div>
      ) : null}
      {route.name === 'landing' ? (
        <LandingScreen onOpen={() => navigate('/new')} onAsk={chat.ask} />
      ) : route.name === 'unknown' ? null : (
        <AppScreen chat={chat} route={route} />
      )}
    </>
  )
}