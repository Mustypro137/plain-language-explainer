import { runAi } from './runAi.js'
import { parseFollowUp, validateFollowUp, validateLanguage } from './validate.js'

// A follow-up question about an explanation. The app allows three per explanation;
// the server keeps no state, so the firewall rule on /api/ is what limits a visitor.
export async function handleAsk(body, askFollowUp) {
  const checked = validateFollowUp(body)
  if (!checked.ok) return { status: 400, body: { error: checked.error } }
  const language = validateLanguage(body?.language)
  if (!language.ok) return { status: 400, body: { error: language.error } }

  const { text, explanation, question, earlier } = checked
  return runAi(
    () => askFollowUp({ text, explanation, question, earlier, language: language.language }),
    (raw) => parseFollowUp(raw, language.language),
  )
}
