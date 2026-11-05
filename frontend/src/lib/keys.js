// Enter sends, Shift+Enter or Alt+Enter adds a new line. Ctrl+Enter and Cmd+Enter send too.
// While an input method editor (Japanese, Chinese, an accent picker) is composing, Enter belongs to it.
export function isSubmitKey(event) {
  if (event.key !== 'Enter') return false
  if (event.isComposing || event.keyCode === 229) return false
  return !event.shiftKey && !event.altKey
}