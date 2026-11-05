const INLINE = /\*\*([^*]+?)\*\*|\[(\d+)\]/g

export function parseInline(text) {
  const tokens = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) tokens.push({ type: 'text', text: text.slice(last, m.index) })
    if (m[1] !== undefined) tokens.push({ type: 'bold', children: parseInline(m[1]) })
    else tokens.push({ type: 'cite', n: Number(m[2]) })
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) })
  return tokens
}

export function parseBlocks(text) {
  const blocks = []
  let list = null
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      list = null
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/)
    const numbered = line.match(/^\d{1,2}[.)]\s+(.*)$/)
    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol'
      if (!list || list.type !== type) {
        list = { type, items: [] }
        blocks.push(list)
      }
      list.items.push(parseInline((bullet ?? numbered)[1]))
    } else {
      list = null
      blocks.push({ type: 'p', inline: parseInline(line) })
    }
  }
  return blocks
}