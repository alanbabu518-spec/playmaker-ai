const KEY = 'playmaker.chats.v1'
const LEGACY_KEY = 'playmaker.history.v1'
export const MAX_CHATS = 25
export const MAX_TURNS = 20

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isChatId = (value) => typeof value === 'string' && UUID.test(value)
export const newId = () => crypto.randomUUID()

// localStorage can be edited by the user or by other scripts, so check the shape before trusting it.
const isSource = (s) =>
  Boolean(s) &&
  Number.isInteger(s.id) &&
  typeof s.title === 'string' &&
  typeof s.snippet === 'string' &&
  typeof s.cited === 'boolean' &&
  typeof s.url === 'string' &&
  s.url.startsWith('https://') // never keep a javascript: link that a click could run

export const isTurn = (t) =>
  Boolean(t) &&
  typeof t.id === 'string' &&
  typeof t.question === 'string' &&
  typeof t.createdAt === 'number' &&
  Boolean(t.result) &&
  typeof t.result.answer === 'string' &&
  typeof t.result.answered === 'boolean' &&
  Array.isArray(t.result.sources) &&
  t.result.sources.every(isSource)

export const isChat = (c) =>
  Boolean(c) &&
  isChatId(c.id) &&
  typeof c.title === 'string' &&
  typeof c.createdAt === 'number' &&
  typeof c.updatedAt === 'number' &&
  Array.isArray(c.turns) &&
  c.turns.every(isTurn)

export function titleFrom(question) {
  const text = question.trim().replace(/\s+/g, ' ')
  return text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text
}

const newestFirst = (chats) => [...chats].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CHATS)

export function addTurn(chats, chatId, turn, now = Date.now()) {
  const existing = chats.find((c) => c.id === chatId)
  const chat = existing
    ? { ...existing, turns: [...existing.turns, turn].slice(-MAX_TURNS), updatedAt: now }
    : { id: chatId, title: titleFrom(turn.question), createdAt: now, updatedAt: now, turns: [turn] }
  return [chat, ...chats.filter((c) => c.id !== chatId)].slice(0, MAX_CHATS)
}

export function replaceTurn(chats, chatId, turnId, turn, now = Date.now()) {
  return newestFirst(
    chats.map((c) =>
      c.id === chatId ? { ...c, updatedAt: now, turns: c.turns.map((t) => (t.id === turnId ? turn : t)) } : c,
    ),
  )
}

export const removeChat = (chats, id) => chats.filter((c) => c.id !== id)

export function groupByDay(chats, now = Date.now()) {
  const startOfDay = (ts) => {
    const d = new Date(ts)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const today = startOfDay(now)
  const groups = [['Today', []], ['Yesterday', []], ['Previous 7 days', []], ['Older', []]]
  for (const chat of chats) {
    const age = Math.round((today - startOfDay(chat.updatedAt)) / 86_400_000)
    groups[age <= 0 ? 0 : age === 1 ? 1 : age <= 7 ? 2 : 3][1].push(chat)
  }
  return groups.filter(([, list]) => list.length).map(([label, list]) => ({ label, chats: list }))
}

export function saveChats(chats) {
  let list = chats
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list))
      return
    } catch {
      if (list.length <= 1) return // blocked or private mode: history just won't persist
      list = list.slice(0, -1) // storage full: drop the oldest chat and try again
    }
  }
}

// One-time move of the old single-question history into chats, so nobody loses what they had.
function migrateLegacy() {
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '[]')
    if (!Array.isArray(old)) return []
    const chats = old
      .filter((e) => isTurn({ id: 'x', ...e }))
      .map((e) => ({
        id: newId(),
        title: titleFrom(e.question),
        createdAt: e.createdAt,
        updatedAt: e.createdAt,
        turns: [{ id: newId(), question: e.question, topK: e.topK ?? 5, createdAt: e.createdAt, result: e.result }],
      }))
    const result = newestFirst(chats)
    saveChats(result)
    localStorage.removeItem(LEGACY_KEY)
    return result
  } catch {
    return []
  }
}

export function loadChats() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return Array.isArray(raw) ? newestFirst(raw.filter(isChat)) : migrateLegacy()
  } catch {
    return []
  }
}