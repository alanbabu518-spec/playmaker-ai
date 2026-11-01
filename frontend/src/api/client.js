const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
export const isMock = import.meta.env.VITE_USE_MOCK === 'true'

const TIMEOUT_MS = 120_000 // the backend may try several models before answering

export class ApiError extends Error {
  // kind: 'rate_limit' | 'unavailable' | 'invalid' | 'timeout' | 'network' | 'server'
  constructor(kind, message, retryAfter = null) {
    super(message)
    this.kind = kind
    this.retryAfter = retryAfter // seconds, for rate limits
  }
}

export async function askQuestion(question, { signal } = {}) {
  if (isMock) return mockAsk(question, signal)

  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let res
  try {
    res = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: combined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err // the user cancelled, so it is not an error to show
    if (err.name === 'TimeoutError') {
      throw new ApiError('timeout', 'The server took too long to answer. Please try again.')
    }
    throw new ApiError('network', 'Could not reach the server. Check your connection and try again.')
  }

  if (!res.ok) throw await toApiError(res)

  const data = await res.json()
  return { ...data, requestId: res.headers.get('X-Request-ID') }
}

async function toApiError(res) {
  let detail = ''
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') detail = body.detail
  } catch {
    // the body was not JSON, so fall back to the generic messages below
  }

  if (res.status === 429) {
    const seconds = parseInt(res.headers.get('Retry-After') ?? '', 10)
    return new ApiError(
      'rate_limit',
      detail || 'Too many questions. Please wait a moment.',
      Number.isFinite(seconds) ? seconds : null,
    )
  }
  if (res.status === 503) {
    return new ApiError('unavailable', detail || 'The service is temporarily unavailable.')
  }
  if (res.status === 422) {
    return new ApiError('invalid', 'Please enter a question between 3 and 500 characters.')
  }
  return new ApiError('server', 'Something went wrong on the server. Please try again.')
}

// ---------- Mock mode: lets us build and test every UI state without the backend ----------

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

async function mockAsk(question, signal) {
  await sleep(900, signal)
  const q = question.toLowerCase()

  // Magic words trigger each error state.
  if (q.includes('mock-429')) throw new ApiError('rate_limit', 'Too many questions. Please wait a moment.', 12)
  if (q.includes('mock-503')) throw new ApiError('unavailable', "The demo's daily answer budget is used up. Previously asked questions still work.")
  if (q.includes('mock-network')) throw new ApiError('network', 'Could not reach the server. Check your connection and try again.')

  if (q.includes('next season') || q.includes('will win')) {
    return { answer: "I don't know based on the available sources.", answered: false, sources: [], model: 'mock-model', latency_ms: 850, cached: false, requestId: 'mock-request-id' }
  }

  return {
    answer: 'Argentina won the 2022 World Cup final, beating France 4-2 on penalties after a 3-3 draw [1][2].',
    answered: true,
    sources: [
      { id: 1, title: '2022 FIFA World Cup final', section: 'Introduction', url: 'https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final', snippet: '2022 FIFA World Cup final - Introduction It was the second time that Argentina reached the World Cup final...', cited: true },
      { id: 2, title: '2022 FIFA World Cup final', section: 'Post-match', url: 'https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final', snippet: 'Messi was named as the player of the match and won his second Golden Ball...', cited: true },
      { id: 3, title: 'Kylian Mbappé', section: 'Introduction', url: 'https://en.wikipedia.org/wiki/Kylian_Mbapp%C3%A9', snippet: 'Mbappé made his senior debut for France in 2017...', cited: false },
    ],
    model: 'mock-model',
    latency_ms: 870,
    cached: false,
    requestId: 'mock-request-id',
  }
}