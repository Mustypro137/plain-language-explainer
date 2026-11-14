// The app's two calls to the server: an explanation, and a follow-up question about one.
const KNOWN_ERRORS = ['empty', 'too_long', 'busy', 'ai_failed', 'bad_level', 'bad_language', 'bad_question']

// The Vercel firewall limits how often one visitor can ask (a rule on /api/).
// Its 429 answer is not our JSON, so it is told apart from the AI limit by the missing body.
const VISITOR_WAIT = 60
const MAX_VISITOR_WAIT = 600

function visitorWait(res) {
  const header = Number(res.headers?.get?.('retry-after'))
  return Number.isInteger(header) && header > 0 ? Math.min(header, MAX_VISITOR_WAIT) : VISITOR_WAIT
}

// Leaves out empty values, so a normal request stays { text }.
const compact = (body) => Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null && v !== undefined))

async function post(path, body) {
  let res
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compact(body)),
    })
  } catch {
    return { ok: false, error: 'offline' }
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 200) return { ok: true, data }
  if (res.status === 429 && data?.error !== 'busy') {
    return { ok: false, error: 'busy', retryAfter: visitorWait(res), limit: 'visitor' }
  }
  const error = KNOWN_ERRORS.includes(data?.error) ? data.error : 'ai_failed'
  const wait = data?.retryAfter
  if (error === 'busy' && Number.isInteger(wait) && wait > 0) {
    const limit = data.limit === 'minute' || data.limit === 'day' ? data.limit : null
    return { ok: false, error, retryAfter: wait, ...(limit && { limit }) }
  }
  return { ok: false, error }
}

// level: null for the normal explanation, or 'simpler' / 'detail'.
// language: null for English only, or a code from shared/languages.js.
export function explainText(text, level = null, language = null) {
  return post('/api/explain', { text, level, language })
}

// earlier: the questions already asked about this explanation, with their answers.
export function askAbout({ text, explanation, question, earlier = [], language = null }) {
  return post('/api/ask', {
    text,
    explanation,
    question,
    earlier: earlier.length > 0 ? earlier.map(({ question: q, answer }) => ({ question: q, answer })) : null,
    language,
  })
}

// "Ask about a word": what one word of the text means in its line. Same answers as askAbout.
export function askWord({ text, line, word, language = null }) {
  return post('/api/ask', { mode: 'word', text, line, word, language })
}
