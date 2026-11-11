import { parseAiAnswer, validateLevel, validateText } from './validate.js'

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

export async function handleExplain(body, askAi) {
  const checked = validateText(body?.text)
  if (!checked.ok) return { status: 400, body: { error: checked.error } }
  const level = validateLevel(body?.level)
  if (!level.ok) return { status: 400, body: { error: level.error } }

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    let raw
    try {
      raw = await askAi(checked.text, level.level)
    } catch (err) {
      if (err?.status === 429) return { status: 429, body: busyBody(err) }
      continue
    }
    const answer = parseAiAnswer(raw)
    if (answer) return { status: 200, body: answer }
  }
  return { status: 502, body: { error: 'ai_failed' } }
}
