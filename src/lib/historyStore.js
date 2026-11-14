import { isFollowUp, isHardWord, isLanguage, isLevel, isResult } from './answerShape.js'

const KEY = 'ple.history.v1'

export const MAX_ITEMS = 50

// "Ask about this": questions kept with each explanation, to protect the shared AI limit.
export const MAX_FOLLOW_UPS = 3

const isText = (v) => typeof v === 'string'

// "Check yourself": how many of the questions under the answer were right.
const isCheck = (c) => c !== null && typeof c === 'object' && Number.isInteger(c.right) && Number.isInteger(c.total) && c.total >= 1 && c.right >= 0 && c.right <= c.total

// Fix-it loop: the ticked steps, the try this one followed, and whether it got solved.
const isDone = (d) => Array.isArray(d) && d.every((i) => Number.isInteger(i) && i >= 0)
// "Ask about a word": up to five words asked about, kept with the answer.
export const MAX_EXTRA_WORDS = 5
const isExtraWords = (w) => Array.isArray(w) && w.length <= MAX_EXTRA_WORDS && w.every(isHardWord)
const EXTRAS = { check: isCheck, done: isDone, after: isText, solved: (v) => v === true, extraWords: isExtraWords }

// A broken extra (a score, ticks, a link) is only that extra lost: the entry itself is kept.
function withoutBadExtras(h) {
  if (h === null || typeof h !== 'object') return h
  const bad = Object.keys(EXTRAS).filter((k) => h[k] !== undefined && !EXTRAS[k](h[k]))
  if (bad.length === 0) return h
  const out = { ...h }
  for (const k of bad) delete out[k]
  return out
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
    return Array.isArray(parsed) ? parsed.map(withoutBadExtras).filter(isItem) : []
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
// after: the id of the try this one follows (Fix-it loop). It is kept only when it is another
// entry that is still there, so a try never follows itself; without one, an entry explained
// again keeps the link it had.
export function addHistory({ text, result, level = null, language = null, after = null }) {
  const items = read()
  const existing = items.find((h) => h.text === text)
  const id = existing?.id ?? crypto.randomUUID()
  const usable = (link) => link && link !== id && items.some((h) => h.id === link)
  // Explaining the same try again (another level, "Ask the AI again") keeps its place in the chain.
  const link = usable(after) ? after : usable(existing?.after) ? existing.after : null
  const item = {
    id,
    text,
    level,
    language,
    result,
    savedAt: new Date().toISOString(),
    ...(link && { after: link }),
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

// Fix-it loop: which steps of "What to try next" are ticked.
export function setDone(id, indices) {
  const items = read()
  const item = items.find((h) => h.id === id)
  if (!item || !isDone(indices)) return false
  item.done = [...new Set(indices)].sort((a, b) => a - b)
  return write(items)
}

// Keeps a word asked about with the entry. False if the entry is gone, full, or has it already.
export function addExtraWord(id, word) {
  const items = read()
  const item = items.find((h) => h.id === id)
  if (!item || !isHardWord(word)) return false
  const words = item.extraWords ?? []
  const key = word.word.trim().toLowerCase()
  if (words.length >= MAX_EXTRA_WORDS || words.some((w) => w.word.trim().toLowerCase() === key)) return false
  item.extraWords = [...words, word]
  return write(items)
}

// Fix-it loop: "It works now".
export function setSolved(id) {
  const items = read()
  const item = items.find((h) => h.id === id)
  if (!item) return false
  item.solved = true
  return write(items)
}

// How many tries lead up to this entry, counting it: 1 for a first try. Follows "after" back,
// and stops at a missing entry or a loop.
export function chainLength(entry, items) {
  const byId = new Map(items.map((h) => [h.id, h]))
  const seen = new Set([entry.id])
  let n = 1
  let at = entry
  while (at.after && byId.has(at.after) && !seen.has(at.after) && n < 20) {
    seen.add(at.after)
    at = byId.get(at.after)
    n += 1
  }
  return n
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
