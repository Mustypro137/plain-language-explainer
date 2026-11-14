import { isFollowUp, isLanguage, isLevel, isResult } from './answerShape.js'

const KEY = 'ple.history.v1'

export const MAX_ITEMS = 50

// "Ask about this": questions kept with each explanation, to protect the shared AI limit.
export const MAX_FOLLOW_UPS = 3

const isText = (v) => typeof v === 'string'

// "Check yourself": how many of the questions under the answer were right.
const isCheck = (c) => c !== null && typeof c === 'object' && Number.isInteger(c.right) && Number.isInteger(c.total) && c.total >= 1 && c.right >= 0 && c.right <= c.total

// A broken score is only a lost score: the entry itself is kept.
function withoutBadCheck(h) {
  if (h === null || typeof h !== 'object' || h.check === undefined || isCheck(h.check)) return h
  const { check, ...rest } = h
  return rest
}

function isItem(h) {
  return (
    h !== null &&
    typeof h === 'object' &&
    isText(h.id) &&
    isText(h.text) &&
    isText(h.savedAt) &&
    !Number.isNaN(Date.parse(h.savedAt)) &&
    isLevel(h.level) &&
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
    return Array.isArray(parsed) ? parsed.map(withoutBadCheck).filter(isItem) : []
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

// Keeps the score of the last "Check yourself" round on an entry. False if it is gone or the score is not possible.
export function setCheck(id, { right, total } = {}) {
  const items = read()
  const item = items.find((h) => h.id === id)
  if (!item || !isCheck({ right, total })) return false
  item.check = { right, total }
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
