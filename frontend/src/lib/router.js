import { useEffect, useState } from 'react'

const read = () => (window.location.hash.startsWith('#/app') ? 'app' : 'landing')

export function useRoute() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function goTo(route) {
  window.location.hash = route === 'app' ? '#/app' : '#/'
}