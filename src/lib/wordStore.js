import { normaliseTopic } from '../../shared/topics.js'

const KEY = 'ple.words.v1'

const isText = (v) => typeof v === 'string'

function isWord(w) {
  return (
    w !== null &&
    typeof w === 'object' &&
    isText(w.id) &&
    isText(w.word) &&
    isText(w.meaning) &&
    isText(w.sentence) &&
    isText(w.savedAt) &&
    [1, 2, 3].includes(w.box)
  )
}

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(parsed) ? parsed.filter(isWord) : []
  } catch {
    return []
  }
}

function write(words) {
  try {
    localStorage.setItem(KEY, JSON.stringify(words))
    return true
  } catch {
    return false
  }
}

const normalise = (word) => String(word).trim().toLowerCase()

// Words saved before topics existed have none; they show as General without being rewritten.
export function listWords() {
  return read().map((w) => ({ ...w, topic: normaliseTopic(w.topic) }))
}

export function hasWord(word) {
  const key = normalise(word)
  return read().some((w) => normalise(w.word) === key)
}

export function saveWord({ word, meaning, sentence, topic }) {
  if (hasWord(word)) return { ok: false, reason: 'duplicate' }
  const saved = {
    id: crypto.randomUUID(),
    word: word.trim(),
    meaning,
    sentence,
    topic: normaliseTopic(topic),
    savedAt: new Date().toISOString(),
    box: 1,
  }
  if (!write([saved, ...read()])) return { ok: false, reason: 'storage' }
  return { ok: true, word: saved }
}

// Returns what restoreWord needs to undo the delete, or null if nothing was deleted.
export function deleteWord(id) {
  const words = read()
  const index = words.findIndex((w) => w.id === id)
  if (index === -1) return null
  if (!write(words.filter((w) => w.id !== id))) return null
  return { word: words[index], index }
}

// Puts a deleted word back where it was. If it was saved again meanwhile, that copy stays.
export function restoreWord({ word, index }) {
  const words = read()
  if (words.some((w) => normalise(w.word) === normalise(word.word))) return true
  words.splice(Math.min(index, words.length), 0, word)
  return write(words)
}

export function setBox(id, box) {
  write(read().map((w) => (w.id === id ? { ...w, box } : w)))
}
