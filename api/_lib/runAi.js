const ATTEMPTS = 2
const MAX_WAIT = 24 * 60 * 60

// What the browser needs to show "You can try again in …". Anything odd is left out.
function busyBody(err) {
  const body = { error: 'busy' }
  const wait = err.retryAfter
  if (typeof wait !== 'number' || !Number.isFinite(wait) || wait <= 0) return body
  body.retryAfter = Math.min(Math.ceil(wait), MAX_WAIT)
  if (err.limit === 'minute' || err.limit === 'day') body.limit = err.limit
  return body
}

// Asks the AI, and once more if the call fails or the answer cannot be used.
// A rate limit is passed on at once: asking again would only make it worse.
export async function runAi(call, parse) {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    let raw
    try {
      raw = await call()
    } catch (err) {
      if (err?.status === 429) return { status: 429, body: busyBody(err) }
      continue
    }
    const answer = parse(raw)
    if (answer) return { status: 200, body: answer }
  }
  return { status: 502, body: { error: 'ai_failed' } }
}
