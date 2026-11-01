import { useEffect, useState } from 'react'

// Seconds left until a timestamp (milliseconds); 0 when there is no deadline or it has passed.
export function useCountdown(until) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!until) return undefined
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [until])

  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
}