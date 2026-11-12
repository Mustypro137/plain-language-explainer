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

const isText = (v) => typeof v === 'string' && v.trim() !== ''

// A path ("src/App.jsx"), a file with a line number ("App.jsx:14") or a build file
// ("react-dom.development.js") belongs to one project, so it is not a word to learn.
// One dot stays allowed for names like "Node.js".
const looksLikeFile = (word) => /[\\/]|:\d/.test(word) || (word.match(/\./g) ?? []).length > 1

function hardWords(list) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const words = []
  for (const w of list) {
    if (!w || !isText(w.word) || !isText(w.meaning) || !isText(w.sentence) || looksLikeFile(w.word)) continue
    const key = w.word.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    words.push({ word: w.word, meaning: w.meaning, sentence: w.sentence, topic: normaliseTopic(w.topic) })
  }
  return words.slice(0, MAX_WORDS)
}

function stripFence(raw) {
  const match = raw.trim().match(/^```[a-z]*\s*([\s\S]*?)\s*```$/i)
  return match ? match[1] : raw
}

export function parseAiAnswer(raw) {
  let data
  try {
    data = JSON.parse(stripFence(raw))
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  if (data.kind !== 'error' && data.kind !== 'docs') return null
  if (!isText(data.explanation) || !isText(data.why)) return null

  const steps =
    data.kind === 'docs' || !Array.isArray(data.steps)
      ? []
      : data.steps.filter(isText).slice(0, MAX_STEPS)
  const words = hardWords(data.words)

  return {
    kind: data.kind,
    explanation: data.explanation,
    why: data.why,
    steps,
    example: typeof data.example === 'string' ? data.example : '',
    words,
  }
}
