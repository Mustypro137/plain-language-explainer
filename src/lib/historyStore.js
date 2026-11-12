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

function isItem(h) {
  return (
    h !== null &&
    typeof h === 'object' &&
    isText(h.id) &&
    isText(h.text) &&
    isText(h.savedAt) &&
    !Number.isNaN(Date.parse(h.savedAt)) &&
    isResult(h.result)
  )
}

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

export function addHistory({ text, result }) {
  const item = {
    id: crypto.randomUUID(),
    text,
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
