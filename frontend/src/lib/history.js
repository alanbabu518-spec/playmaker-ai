const KEY = 'playmaker.history.v1'
const MAX_ENTRIES = 20

const normalize = (q) => q.trim().toLowerCase().replace(/\s+/g, ' ')

// localStorage can be edited by the user or by other scripts, so check the shape before trusting it.
function isEntry(e) {
  return Boolean(
    e &&
      typeof e.id === 'string' &&
      typeof e.question === 'string' &&
      typeof e.createdAt === 'number' &&
      e.result &&
      typeof e.result.answer === 'string' &&
      Array.isArray(e.result.sources) &&
      e.result.sources.every(
        (s) => s && typeof s.title === 'string' && typeof s.url === 'string' && s.url.startsWith('https://'),
      ),
  )
}

export function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(isEntry).slice(0, MAX_ENTRIES) : []
  } catch {
    return []
  }
}

export function saveHistory(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // Storage full or blocked (private mode): history just won't persist.
  }
}

// Newest first. Asking the same question again replaces the old entry instead of duplicating it.
export function addEntry(entries, entry) {
  const key = normalize(entry.question)
  return [entry, ...entries.filter((e) => normalize(e.question) !== key)].slice(0, MAX_ENTRIES)
}

export function newEntryId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function isToday(timestamp) {
  return new Date(timestamp).toDateString() === new Date().toDateString()
}