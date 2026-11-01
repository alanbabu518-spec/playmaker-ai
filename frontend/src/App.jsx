import AppScreen from './screens/AppScreen'
import { useChat } from './hooks/useChat'
import { goTo, useRoute } from './lib/router'

export default function App() {
  const route = useRoute()
  const chat = useChat()

  if (route === 'app') return <AppScreen chat={chat} />

  // Temporary until step 6: the landing page.
  return (
    <main className="grid min-h-dvh place-items-center bg-pitch p-6 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Landing page comes in step 6</h1>
        <button
          type="button"
          onClick={() => goTo('app')}
          className="mt-6 min-h-11 rounded-xl border border-gold-edge bg-gold px-6 text-lg font-semibold text-pitch"
        >
          Open Playmaker AI
        </button>
      </div>
    </main>
  )
}