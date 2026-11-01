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
export async function askQuestion(question, { signal, topK = 5 } = {}) {
  if (isMock) return mockAsk(question, signal)

  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let res
  try {
    res = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, top_k: topK }),
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
    // The two daily-limit messages from the backend contain "daily"; the outage message does not.
    const kind = /daily/i.test(detail) ? 'limit' : 'unavailable'
    return new ApiError(kind, detail || 'The service is temporarily unavailable.')
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
  if (q.includes('mock-limit')) throw new ApiError('limit', "The demo's daily answer budget is used up. Previously asked questions still work.")

  if (q.includes('next season') || q.includes('will win')) {
    return { answer: "I don't know based on the available sources.", answered: false, sources: [], model: 'mock-model', latency_ms: 850, cached: false, requestId: 'mock-request-id' }
  }

  return {
    answer: 'Germany won the 2014 final, beating Argentina 1–0 after extra time at the Maracanã. Mario Götze scored the only goal in the 113th minute [1][2].',
    answered: true,
    sources: [
      { id: 1, title: '2014 FIFA World Cup', section: 'Final', url: 'https://en.wikipedia.org/wiki/2014_FIFA_World_Cup', snippet: 'Germany defeated Argentina 1–0 after extra time at the Maracanã in Rio de Janeiro.', cited: true },
      { id: 2, title: '2014 FIFA World Cup final', section: 'Match summary', url: 'https://en.wikipedia.org/wiki/2014_FIFA_World_Cup_final', snippet: 'Mario Götze scored the only goal in the 113th minute.', cited: true },
      { id: 3, title: 'Mario Götze', section: 'International career', url: 'https://en.wikipedia.org/wiki/Mario_G%C3%B6tze', snippet: 'Götze made his senior debut for Germany in 2010.', cited: false },
    ],
    model: 'mock-model',
    latency_ms: 1400,
    cached: false,
    requestId: 'mock-request-id',
  }
}