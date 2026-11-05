const CITATION = /[ \t]*\[(\d+)\]/g

// Rewrites the model's [n] markers as 1, 2, 3... in order of first appearance. Each number then points at
// exactly one source card, and a marker that matches no source is dropped, so a made-up [9] never shows.
export function prepareAnswer(result) {
  const byId = new Map(result.sources.map((s) => [s.id, s]))
  const order = []
  const text = result.answer.replace(CITATION, (_, raw) => {
    const source = byId.get(Number(raw))
    if (!source) return ''
    if (!order.includes(source)) order.push(source)
    return `[${order.indexOf(source) + 1}]`
  })
  const used = order.map((source, i) => ({ n: i + 1, source }))
  const checked = result.sources.filter((s) => !order.includes(s))
  return { text, used, checked }
}

export function toPlainText(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1')
}

// The backend snippet starts with a "Title - Section" line, and it is cut at 300 characters.
export function cleanSnippet(raw) {
  const truncated = raw.length >= 300
  const body = raw.includes('\n') ? raw.slice(raw.indexOf('\n') + 1) : raw
  const text = body.trim().replace(/\s+/g, ' ')
  return truncated ? `${text}…` : text
}