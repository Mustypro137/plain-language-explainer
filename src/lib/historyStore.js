import { findLanguage } from '../../shared/languages.js'
import { isOptionalHelp } from './help.js'

const KEY = 'ple.history.v1'

export const MAX_ITEMS = 50

// "Ask about this": questions kept with each explanation, to protect the shared AI limit.
export const MAX_FOLLOW_UPS = 3

const isText = (v) => typeof v === 'string'

const isHardWord = (w) =>
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

function isResult(r) {
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

const isFollowUp = (f) =>
  f !== null && typeof f === 'object' && isText(f.question) && isText(f.answer) && isOptionalHelp(f.help, ['answer'])

// Missing language (entries saved before "Help in my language") means English only.
const isLanguage = (code) => code === undefined || code === null || findLanguage(code) !== null

function isItem(h) {
  return (
    h !== null &&
    typeof h === 'object' &&
    isText(h.id) &&
    isText(h.text) &&
    isText(h.savedAt) &&
    !Number.isNaN(Date.parse(h.savedAt)) &&
    LEVELS.includes(h.level) &&
    isLanguage(h.language) &&
    (h.followUps === undefined || (Array.isArray(h.followUps) && h.followUps.every(isFollowUp))) &&
    isResult(h.result)
  )
}

export const levelOf = (item) => item.level ?? null
export const languageOf = (item) => item.language ?? null
export const followUpsOf = (item) => item.followUps ?? []

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(parsed) ? parsed.filter(isItem) : []
  } catch {
    return []
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function listHistory() {
  return read()
}

export function getHistoryItem(id) {
  return read().find((h) => h.id === id)
}

// The kept answer for exactly this text, level and language, so it can be shown without asking the AI.
export function findHistory(text, level = null, language = null) {
  return read().find((h) => h.text === text && levelOf(h) === level && languageOf(h) === language)
}

// One entry per text. A text explained again keeps its id, so a saved word's link to
// "the explanation it came from" still works.
export function addHistory({ text, result, level = null, language = null }) {
  const items = read()
  const item = {
    id: items.find((h) => h.text === text)?.id ?? crypto.randomUUID(),
    text,
    level,
    language,
    result,
    savedAt: new Date().toISOString(),
  }
  const others = items.filter((h) => h.text !== text)
  return write([item, ...others].slice(0, MAX_ITEMS)) ? item : null
}

// Adds a follow-up question and its answer to an entry. False if it is gone or full.
export function addFollowUp(id, followUp) {
  const items = read()
  const item = items.find((h) => h.id === id)
  if (!item || !isFollowUp(followUp) || followUpsOf(item).length >= MAX_FOLLOW_UPS) return false
  const { question, answer, help } = followUp
  item.followUps = [...followUpsOf(item), { question, answer, ...(help && { help }) }]
  return write(items)
}

// Both return the removed entries, so restoreHistory can undo them; [] if nothing changed.
export function deleteHistoryItem(id) {
  const items = read()
  const removed = items.filter((h) => h.id === id)
  if (removed.length === 0 || !write(items.filter((h) => h.id !== id))) return []
  return removed
}

export function clearHistory() {
  const items = read()
  return write([]) ? items : []
}

// Adds the History from a backup file, with the same rules as restoreHistory.
export function importHistory(list) {
  const before = new Set(read().map((h) => h.id))
  if (!restoreHistory(Array.isArray(list) ? list : [])) return { ok: false, added: 0 }
  return { ok: true, added: read().filter((h) => !before.has(h.id)).length }
}

// Merges removed entries back, newest first. A text explained again meanwhile keeps its newer entry.
export function restoreHistory(removed) {
  const byText = new Map()
  for (const h of [...read(), ...removed.filter(isItem)]) {
    const kept = byText.get(h.text)
    if (!kept || h.savedAt > kept.savedAt) byText.set(h.text, h)
  }
  const items = [...byText.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  return write(items.slice(0, MAX_ITEMS))
}
