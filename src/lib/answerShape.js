import { findLanguage } from '../../shared/languages.js'
import { isOptionalHelp } from './help.js'

// The shape of a kept answer. History checks what it reads back from the browser with these,
// and a shared link is checked the same way, since anyone can edit a link by hand.

const isText = (v) => typeof v === 'string'

export const isHardWord = (w) =>
  w !== null &&
  typeof w === 'object' &&
  isText(w.word) &&
  isText(w.meaning) &&
  isText(w.sentence) &&
  isOptionalHelp(w.help, ['meaning'])

// "Line by line": parts "from" to "to" of the text, in plain English.
const isLine = (l) =>
  l !== null &&
  typeof l === 'object' &&
  Number.isInteger(l.from) &&
  l.from >= 1 &&
  Number.isInteger(l.to) &&
  l.to >= l.from &&
  isText(l.plain) &&
  isOptionalHelp(l.help, ['plain'])

export function isResult(r) {
  return (
    r !== null &&
    typeof r === 'object' &&
    (r.kind === 'error' || r.kind === 'docs') &&
    isText(r.explanation) &&
    isText(r.why) &&
    Array.isArray(r.steps) &&
    r.steps.every(isText) &&
    isText(r.example) &&
    Array.isArray(r.words) &&
    r.words.every(isHardWord) &&
    // Answers saved before "line by line" have no lines; they show the five parts only.
    (r.lines === undefined || (Array.isArray(r.lines) && r.lines.every(isLine))) &&
    isOptionalHelp(r.help, ['explanation', 'why'])
  )
}

// "simpler" or "detail" for "Not clear?" answers. Missing (entries saved before levels) means normal.
const LEVELS = [undefined, null, 'simpler', 'detail']
export const isLevel = (level) => LEVELS.includes(level)

export const isFollowUp = (f) =>
  f !== null && typeof f === 'object' && isText(f.question) && isText(f.answer) && isOptionalHelp(f.help, ['answer'])

// Missing language (entries saved before "Help in my language") means English only.
export const isLanguage = (code) => code === undefined || code === null || findLanguage(code) !== null
