const KNOWN_ERRORS = ['empty', 'too_long', 'busy', 'ai_failed', 'bad_level']

// The Vercel firewall limits how often one visitor can ask (a rule on /api/explain).
// Its 429 answer is not our JSON, so it is told apart from the AI limit by the missing body.
const VISITOR_WAIT = 60
const MAX_VISITOR_WAIT = 600

function visitorWait(res) {
  const header = Number(res.headers?.get?.('retry-after'))
  return Number.isInteger(header) && header > 0 ? Math.min(header, MAX_VISITOR_WAIT) : VISITOR_WAIT
}

// level: undefined for the normal explanation, or 'simpler' / 'detail'.
export async function explainText(text, level) {
  let res
  try {
    res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(level ? { text, level } : { text }),
    })
  } catch {
    return { ok: false, error: 'offline' }
  }

  const body = await res.json().catch(() => ({}))
  if (res.status === 200) return { ok: true, data: body }
  if (res.status === 429 && body?.error !== 'busy') {
    return { ok: false, error: 'busy', retryAfter: visitorWait(res), limit: 'visitor' }
  }
  const error = KNOWN_ERRORS.includes(body?.error) ? body.error : 'ai_failed'
  const wait = body?.retryAfter
  if (error === 'busy' && Number.isInteger(wait) && wait > 0) {
    const limit = body.limit === 'minute' || body.limit === 'day' ? body.limit : null
    return { ok: false, error, retryAfter: wait, ...(limit && { limit }) }
  }
  return { ok: false, error }
}
