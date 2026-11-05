import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, askQuestion } from '../api/client'
import { addTurn, loadChats, newId, removeChat, replaceTurn, saveChats } from '../lib/chats'
import { chatPath, navigate } from '../lib/router'
import { validateQuestion } from '../lib/validate'

export function useChat(route) {
  const routeChatId = route.name === 'chat' ? route.id : null
  const [chats, setChats] = useState(loadChats)
  const [live, setLive] = useState(null) // the question being answered, or one that just failed
  const [draft, setDraft] = useState('')
  const [topK, setTopK] = useState(5)
  const [focusTick, setFocusTick] = useState(0)
  const [notice, setNotice] = useState('')
  const abortRef = useRef(null)

  const activeChat = routeChatId ? (chats.find((c) => c.id === routeChatId) ?? null) : null

  useEffect(() => {
    saveChats(chats)
  }, [chats])

  useEffect(() => () => abortRef.current?.abort(), [])

  // A /chat/<id> link that is not stored in this browser: start a new chat and say why.
  useEffect(() => {
    if (!routeChatId || activeChat || live?.chatId === routeChatId) return
    navigate('/new', { replace: true })
    setNotice('That chat is not saved in this browser, so here is a new one.')
  }, [routeChatId, activeChat, live])

  // Leaving a chat while it is loading cancels the request.
  useEffect(() => {
    if (live && live.chatId !== routeChatId) {
      abortRef.current?.abort()
      setLive(null)
    }
  }, [routeChatId, live])

  const ask = useCallback(
    async (raw, { topK: depth, replaceTurnId } = {}) => {
      const question = raw.trim()
      if (validateQuestion(question) || live?.phase === 'loading') return false

      const chatId = routeChatId ?? newId() // the first question of a new chat creates its id
      const k = depth ?? topK
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setNotice('')
      setDraft('')
      setLive({ chatId, question, topK: k, phase: 'loading', replaceTurnId })
      if (!routeChatId) navigate(chatPath(chatId), { replace: route.name === 'new' })

      try {
        const { requestId, ...result } = await askQuestion(question, { signal: controller.signal, topK: k })
        const turn = { id: newId(), question, topK: k, createdAt: Date.now(), result }
        setChats((prev) =>
          replaceTurnId ? replaceTurn(prev, chatId, replaceTurnId, turn) : addTurn(prev, chatId, turn),
        )
        setLive(null)
      } catch (err) {
        if (err.name === 'AbortError') return true
        const error = err instanceof ApiError ? err : new ApiError('server', 'Something went wrong. Please try again.')
        if (error.kind !== 'limit') setDraft(question) // "Your question is still here"
        setLive({
          chatId,
          question,
          topK: k,
          phase: 'error',
          error,
          replaceTurnId,
          retryUntil: error.kind === 'rate_limit' ? Date.now() + (error.retryAfter ?? 10) * 1000 : null,
        })
      }
      return true
    },
    [routeChatId, topK, live],
  )

  const retry = useCallback(() => {
    if (live?.phase === 'error') ask(live.question, { topK: live.topK, replaceTurnId: live.replaceTurnId })
  }, [live, ask])

  const checkMore = useCallback(
    (turnId) => {
      const turn = activeChat?.turns.find((t) => t.id === turnId)
      if (turn) ask(turn.question, { topK: 10, replaceTurnId: turn.id })
    },
    [activeChat, ask],
  )

  const editQuestion = useCallback((question) => {
    setDraft(question)
    setFocusTick((t) => t + 1)
  }, [])

  const newChat = useCallback(() => {
    setDraft('')
    setNotice('')
    navigate('/new')
  }, [])

  const openChat = useCallback((id) => navigate(chatPath(id)), [])

  const deleteChat = useCallback(
    (id) => {
      setChats((prev) => removeChat(prev, id))
      if (routeChatId === id) navigate('/new', { replace: true })
    },
    [routeChatId],
  )

  return {
    chats, activeChat, live, draft, setDraft, topK, setTopK, focusTick,
    notice, dismissNotice: () => setNotice(''),
    ask, retry, checkMore, editQuestion, newChat, openChat, deleteChat,
  }
}