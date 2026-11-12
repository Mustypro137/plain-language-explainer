import { findLanguage } from '../../shared/languages.js'
import { normaliseTopic } from '../../shared/topics.js'

export const MAX_CHARS = 3000
const MAX_STEPS = 3
const MAX_WORDS = 5

export function validateText(text) {
  if (typeof text !== 'string') return { ok: false, error: 'empty' }
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, error: 'empty' }
  if (trimmed.length > MAX_CHARS) return { ok: false, error: 'too_long' }
  return { ok: true, text: trimmed }
}

// "Explain it differently": no level is the normal explanation.
export const LEVELS = ['simpler', 'detail']

export function validateLevel(level) {
  if (level === undefined || level === null) return { ok: true, level: null }
  return LEVELS.includes(level) ? { ok: true, level } : { ok: false, error: 'bad_level' }
}

// "Help in my language": no language means English only.
export function validateLanguage(language) {
  if (language === undefined || language === null) return { ok: true, language: null }
  return findLanguage(language) ? { ok: true, language } : { ok: false, error: 'bad_language' }
}

const isText = (v) => typeof v === 'string' && v.trim() !== ''

export const MAX_QUESTION = 300
const MAX_EXPLANATION = 2000
const MAX_EARLIER = 2
const MAX_EARLIER_ANSWER = 1500

// A follow-up question comes with the text and the explanation it is about, and the last
// questions asked about it. Earlier questions beyond the last two are not sent to the AI.
export function validateFollowUp(body) {
  const text = validateText(body?.text)
  if (!text.ok) return text
  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  if (question === '' || question.length > MAX_QUESTION) return { ok: false, error: 'bad_question' }
  const explanation = typeof body?.explanation === 'string' ? body.explanation.trim() : ''
  if (explanation === '' || explanation.length > MAX_EXPLANATION) return { ok: false, error: 'bad_question' }
  const earlier = (Array.isArray(body?.earlier) ? body.earlier : [])
    .filter((e) => isText(e?.question) && isText(e?.answer))
    .slice(-MAX_EARLIER)
    .map((e) => ({ question: e.question.trim().slice(0, MAX_QUESTION), answer: e.answer.trim().slice(0, MAX_EARLIER_ANSWER) }))
  return { ok: true, text: text.text, question, explanation, earlier }
}

// A path ("src/App.jsx"), a file with a line number ("App.jsx:14") or a build file
// ("react-dom.development.js") belongs to one project, so it is not a word to learn.
// One dot stays allowed for names like "Node.js".
const looksLikeFile = (word) => /[\\/]|:\d/.test(word) || (word.match(/\./g) ?? []).length > 1

// The AI's translation, kept only for a language that was asked for and only if it is real text.
const helpOf = (language, fields) =>
  language && Object.values(fields).every(isText) ? { help: { lang: language, ...fields } } : {}

function hardWords(list, language) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const words = []
  for (const w of list) {
    if (!w || !isText(w.word) || !isText(w.meaning) || !isText(w.sentence) || looksLikeFile(w.word)) continue
    const key = w.word.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    words.push({
      word: w.word,
      meaning: w.meaning,
      sentence: w.sentence,
      topic: normaliseTopic(w.topic),
      ...helpOf(language, { meaning: w.meaning_help }),
    })
  }
  return words.slice(0, MAX_WORDS)
}

// "Line by line": one plain sentence per numbered part, or per group of parts ("n" to "to").
// Entries out of range, overlapping an earlier one or without text are dropped; parts left
// without a plain line simply show without one. No usable entry at all gives [].
function plainLines(list, count, language) {
  if (!Array.isArray(list) || !count) return []
  const lines = []
  let next = 1
  const entries = list
    .filter((l) => l && Number.isInteger(l.n) && isText(l.plain))
    .sort((a, b) => a.n - b.n)
  for (const l of entries) {
    const to = Number.isInteger(l.to) && l.to > l.n ? Math.min(l.to, count) : l.n
    if (l.n < next || l.n > count) continue
    lines.push({ from: l.n, to, plain: l.plain.trim(), ...helpOf(language, { plain: l.plain_help }) })
    next = to + 1
  }
  return lines
}

function stripFence(raw) {
  const match = raw.trim().match(/^```[a-z]*\s*([\s\S]*?)\s*```$/i)
  return match ? match[1] : raw
}

function parseJson(raw) {
  try {
    const data = JSON.parse(stripFence(raw))
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

// language: the code asked for ("es"), or null. Without it any translation is ignored.
// parts: how many numbered parts the text had (segmentText), for the line-by-line view.
export function parseAiAnswer(raw, language = null, parts = 0) {
  const data = parseJson(raw)
  if (!data) return null
  if (data.kind !== 'error' && data.kind !== 'docs') return null
  if (!isText(data.explanation) || !isText(data.why)) return null

  const steps =
    data.kind === 'docs' || !Array.isArray(data.steps)
      ? []
      : data.steps.filter(isText).slice(0, MAX_STEPS)
  const words = hardWords(data.words, language)

  return {
    kind: data.kind,
    explanation: data.explanation,
    why: data.why,
    steps,
    example: typeof data.example === 'string' ? data.example : '',
    words,
    lines: plainLines(data.lines, parts, language),
    ...helpOf(language, { explanation: data.explanation_help, why: data.why_help }),
  }
}

export function parseFollowUp(raw, language = null) {
  const data = parseJson(raw)
  if (!data || !isText(data.answer)) return null
  return { answer: data.answer.trim(), ...helpOf(language, { answer: data.answer_help }) }
}
