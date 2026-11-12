import { runAi } from './runAi.js'
import { parseAiAnswer, validateLanguage, validateLevel, validateText } from './validate.js'

export async function handleExplain(body, askAi) {
  const checked = validateText(body?.text)
  if (!checked.ok) return { status: 400, body: { error: checked.error } }
  const level = validateLevel(body?.level)
  if (!level.ok) return { status: 400, body: { error: level.error } }
  const language = validateLanguage(body?.language)
  if (!language.ok) return { status: 400, body: { error: language.error } }

  return runAi(
    () => askAi(checked.text, level.level, language.language),
    (raw) => parseAiAnswer(raw, language.language),
  )
}
