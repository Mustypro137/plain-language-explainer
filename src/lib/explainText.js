const KNOWN_ERRORS = ['empty', 'too_long', 'busy', 'ai_failed', 'bad_level']

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
  const error = KNOWN_ERRORS.includes(body?.error) ? body.error : 'ai_failed'
  const wait = body?.retryAfter
  if (error === 'busy' && Number.isInteger(wait) && wait > 0) {
    const limit = body.limit === 'minute' || body.limit === 'day' ? body.limit : null
    return { ok: false, error, retryAfter: wait, ...(limit && { limit }) }
  }
  return { ok: false, error }
}
