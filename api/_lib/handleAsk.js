import { runAi } from './runAi.js'
import { parseFollowUp, parseWordAnswer, validateFollowUp, validateLanguage, validateWordQuestion } from './validate.js'

// A follow-up question about an explanation. The app allows three per explanation;
// the server keeps no state, so the firewall rule on /api/ is what limits a visitor.
// mode "word": what one word of the text means in its line ("Ask about a word"), answered
// as a hard word. The app allows five per explanation.
async function handleWord(body, askWord) {
  const checked = validateWordQuestion(body)
  if (!checked.ok) return { status: 400, body: { error: checked.error } }
  const language = validateLanguage(body?.language)
  if (!language.ok) return { status: 400, body: { error: language.error } }
  const { text, line, word } = checked
  return runAi(
    () => askWord({ text, line, word, language: language.language }),
    (raw) => parseWordAnswer(raw, language.language, { word, line }),
  )
}

export async function handleAsk(body, askFollowUp, askWord) {
  if (body?.mode === 'word') return handleWord(body, askWord)
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
