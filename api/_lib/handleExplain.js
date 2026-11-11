import { parseAiAnswer, validateText } from './validate.js'

const ATTEMPTS = 2

export async function handleExplain(body, askAi) {
  const checked = validateText(body?.text)
  if (!checked.ok) return { status: 400, body: { error: checked.error } }

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    let raw
    try {
      raw = await askAi(checked.text)
    } catch (err) {
      if (err?.status === 429) return { status: 429, body: { error: 'busy' } }
      continue
    }
    const answer = parseAiAnswer(raw)
    if (answer) return { status: 200, body: answer }
  }
  return { status: 502, body: { error: 'ai_failed' } }
}
