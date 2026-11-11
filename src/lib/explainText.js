const KNOWN_ERRORS = ['empty', 'too_long', 'busy', 'ai_failed']

export async function explainText(text) {
  let res
  try {
    res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    return { ok: false, error: 'offline' }
  }

  const body = await res.json().catch(() => ({}))
  if (res.status === 200) return { ok: true, data: body }
  return { ok: false, error: KNOWN_ERRORS.includes(body?.error) ? body.error : 'ai_failed' }
}
