import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, askQuestion } from '../api/client'
import { addEntry, loadHistory, newEntryId, saveHistory } from '../lib/history'
import { validateQuestion } from '../lib/validate'

export function useChat() {
  const [history, setHistory] = useState(loadHistory)
  const [current, setCurrent] = useState(null) // null = the empty "Ask anything" screen
  const [draft, setDraft] = useState('')
  const [topK, setTopK] = useState(5)
  const [focusTick, setFocusTick] = useState(0)
  const abortRef = useRef(null)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => () => abortRef.current?.abort(), [])

  const ask = useCallback(
    async (raw, { topK: depth } = {}) => {
      const question = raw.trim()
      if (validateQuestion(question)) return false

      abortRef.current?.abort() // a newer question cancels the older request
      const controller = new AbortController()
      abortRef.current = controller

      const k = depth ?? topK
      setDraft('')
      setCurrent({ phase: 'loading', question, topK: k })

      try {
        const { requestId, ...result } = await askQuestion(question, { signal: controller.signal, topK: k })
        const entry = { id: newEntryId(), question, topK: k, createdAt: Date.now(), result }
        setHistory((prev) => addEntry(prev, entry))
        setCurrent({ phase: 'done', question, topK: k, result, entryId: entry.id, requestId })
      } catch (err) {
        if (err.name === 'AbortError') return true
        const error = err instanceof ApiError ? err : new ApiError('server', 'Something went wrong. Please try again.')
        if (error.kind !== 'limit') setDraft(question) // "Your question is still here"
        setCurrent({
          phase: 'error',
          question,
          topK: k,
          error,
          retryUntil: error.kind === 'rate_limit' ? Date.now() + (error.retryAfter ?? 10) * 1000 : null,
        })
      }
      return true
    },
    [topK],
  )

  const newQuestion = useCallback(() => {
    abortRef.current?.abort()
    setCurrent(null)
    setDraft('')
  }, [])

  const selectEntry = useCallback(
    (id) => {
      const entry = history.find((e) => e.id === id)
      if (!entry) return
      abortRef.current?.abort()
      setDraft('')
      setCurrent({ phase: 'done', question: entry.question, topK: entry.topK, result: entry.result, entryId: entry.id })
    },
    [history],
  )

  const retry = useCallback(() => {
    if (current) ask(current.question, { topK: current.topK })
  }, [current, ask])

  const checkMore = useCallback(() => {
    if (current) ask(current.question, { topK: 10 })
  }, [current, ask])

  const editQuestion = useCallback(() => {
    if (!current) return
    setDraft(current.question)
    setFocusTick((t) => t + 1)
  }, [current])

  return {
    history, current, draft, setDraft, topK, setTopK, focusTick,
    ask, newQuestion, selectEntry, retry, checkMore, editQuestion,
  }
}