import { useCallback, useEffect, useState } from 'react'

const KEY = 'playmaker.ui.v1'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return {
      historyOpen: typeof raw.historyOpen === 'boolean' ? raw.historyOpen : true,
      sourcesAuto: typeof raw.sourcesAuto === 'boolean' ? raw.sourcesAuto : true,
    }
  } catch {
    return { historyOpen: true, sourcesAuto: true }
  }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      // Blocked storage: the choice just won't survive a reload.
    }
  }, [prefs])
  const setPref = useCallback((key, value) => setPrefs((prev) => ({ ...prev, [key]: value })), [])
  return [prefs, setPref]
}