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

export function listWords() {
  return read()
}

export function hasWord(word) {
  const key = normalise(word)
  return read().some((w) => normalise(w.word) === key)
}

export function saveWord({ word, meaning, sentence }) {
  if (hasWord(word)) return { ok: false, reason: 'duplicate' }
  const saved = {
    id: crypto.randomUUID(),
    word: word.trim(),
    meaning,
    sentence,
    savedAt: new Date().toISOString(),
    box: 1,
  }
  if (!write([saved, ...read()])) return { ok: false, reason: 'storage' }
  return { ok: true, word: saved }
}

export function deleteWord(id) {
  write(read().filter((w) => w.id !== id))
}

export function setBox(id, box) {
  write(read().map((w) => (w.id === id ? { ...w, box } : w)))
}
