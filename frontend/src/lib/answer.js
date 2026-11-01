const CITATION = /\[(\d+)\]/g

// Turns the backend answer into text pieces plus numbered citations.
// Citations are renumbered 1, 2, 3... in the order they appear, and each number points at exactly
// one source card. A marker that matches no source is dropped, so a made-up [9] never shows.
export function prepareAnswer(result) {
  const byId = new Map(result.sources.map((s) => [s.id, s]))
  const order = []
  const parts = []
  let last = 0

  for (const match of result.answer.matchAll(CITATION)) {
    const before = result.answer.slice(last, match.index)
    last = match.index + match[0].length
    const source = byId.get(Number(match[1]))
    if (!source) {
      parts.push({ type: 'text', text: before })
      continue
    }
    let pos = order.indexOf(source)
    if (pos === -1) {
      order.push(source)
      pos = order.length - 1
    }
    parts.push({ type: 'text', text: before.replace(/\s+$/, '') }) // the badge sits right against the word
    parts.push({ type: 'cite', n: pos + 1 })
  }
  parts.push({ type: 'text', text: result.answer.slice(last) })

  const used = order.map((source, i) => ({ n: i + 1, source }))
  const checked = result.sources.filter((s) => !order.includes(s))
  return { parts, used, checked }
}

export function toPlainText(parts) {
  return parts.map((p) => (p.type === 'cite' ? `[${p.n}]` : p.text)).join('')
}

// The backend snippet starts with a "Title - Section" line, and it is cut at 300 characters.
export function cleanSnippet(raw) {
  const truncated = raw.length >= 300
  const body = raw.includes('\n') ? raw.slice(raw.indexOf('\n') + 1) : raw
  const text = body.trim().replace(/\s+/g, ' ')
  return truncated ? `${text}…` : text
}