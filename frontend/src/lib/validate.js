export const MIN_LEN = 3
export const MAX_LEN = 500

export function questionLength(text) {
  return text.trim().length
}

// Returns null when the question is fine, otherwise the message to show.
export function validateQuestion(text) {
  const n = questionLength(text)
  if (n < MIN_LEN) {
    return { kind: 'short', message: `Questions need at least ${MIN_LEN} characters.` }
  }
  if (n > MAX_LEN) {
    return { kind: 'long', message: `Shorten your question by ${n - MAX_LEN} characters to ask it.` }
  }
  return null
}