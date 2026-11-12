const KEY = 'ple.history.v1'

export const MAX_ITEMS = 20

const isText = (v) => typeof v === 'string'

const isHardWord = (w) =>
  w !== null && typeof w === 'object' && isText(w.word) && isText(w.meaning) && isText(w.sentence)

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
    r.words.every(isHardWord)
  )
}

// "simpler" or "detail" for "Not clear?" answers. Missing (entries saved before levels) means normal.
const LEVELS = [undefined, null, 'simpler', 'detail']

function isItem(h) {
  return (
    h !== null &&
    typeof h === 'object' &&
    isText(h.id) &&
    isText(h.text) &&
    isText(h.savedAt) &&
    !Number.isNaN(Date.parse(h.savedAt)) &&
    LEVELS.includes(h.level) &&
    isResult(h.result)
  )
}

export const levelOf = (item) => item.level ?? null

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

// The kept answer for exactly this text at this level, so it can be shown without asking the AI.
export function findHistory(text, level = null) {
  return read().find((h) => h.text === text && levelOf(h) === level)
}

export function addHistory({ text, result, level = null }) {
  const item = {
    id: crypto.randomUUID(),
    text,
    level,
    result,
    savedAt: new Date().toISOString(),
  }
  const others = read().filter((h) => h.text !== text)
  return write([item, ...others].slice(0, MAX_ITEMS)) ? item : null
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
