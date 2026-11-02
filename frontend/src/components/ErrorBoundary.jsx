import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="grid min-h-dvh place-items-center bg-chalk p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold">Something broke.</h1>
          <p className="mt-2 text-lg text-moss">Reload the page to start again. Your saved questions are still here.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 min-h-11 rounded-xl border border-gold-edge bg-gold px-5 text-base font-semibold text-pitch"
          >
            Reload
          </button>
        </div>
      </main>
    )
  }
}