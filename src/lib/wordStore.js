import { normaliseTopic } from '../../shared/topics.js'
import { isDayKey } from './days.js'
import { isHelp } from './help.js'

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

// Sent after every change, so parts of the page that show counts (the Practice link) update.
export const WORDS_CHANGED = 'ple:words-changed'

function write(words) {
  try {
    localStorage.setItem(KEY, JSON.stringify(words))
  } catch {
    return false
  }
  window.dispatchEvent(new Event(WORDS_CHANGED))
  return true
}

const normalise = (word) => String(word).trim().toLowerCase()

const isGap = (v) => Number.isInteger(v) && v >= 0

export const MAX_WORD = 60
export const MAX_MEANING = 300
export const MAX_SENTENCE = 500
export const MAX_NOTE = 500

// The optional parts of a word that are valid, ready to spread into it:
// the translated meaning, the user's own note and the History entry it came from.
function extras(w) {
  return {
    ...(isHelp(w.help, ['meaning']) && { help: { lang: w.help.lang, meaning: w.help.meaning } }),
    ...(isText(w.note) && w.note.trim() !== '' && { note: w.note.trim().slice(0, MAX_NOTE) }),
    ...(isText(w.source) && w.source !== '' && { source: w.source }),
  }
}

// Words saved before topics existed have none; they show as General without being rewritten.
// Words never practised have no due day or gap: they are due now. Broken values count as missing.
export function listWords() {
  return read().map(({ help, note, source, ...w }) => ({
    ...w,
    ...extras({ help, note, source }),
    topic: normaliseTopic(w.topic),
    due: isDayKey(w.due) ? w.due : undefined,
    interval: isGap(w.interval) ? w.interval : undefined,
  }))
}

export function hasWord(word) {
  const key = normalise(word)
  return read().some((w) => normalise(w.word) === key)
}

// source: the id of the History entry the word came from (none for a word added by hand).
export function saveWord({ word, meaning, sentence = '', topic, help, note, source }) {
  if (hasWord(word)) return { ok: false, reason: 'duplicate' }
  const saved = {
    id: crypto.randomUUID(),
    word: word.trim(),
    meaning,
    sentence,
    topic: normaliseTopic(topic),
    savedAt: new Date().toISOString(),
    box: 1,
    ...extras({ help, note, source }),
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

// Adds the words from a backup file. Entries that are not real words are skipped, and a word
// already saved (in any letter case) keeps the copy that is here. Only known fields are kept.
export function importWords(list) {
  const words = read()
  const seen = new Set(words.map((w) => normalise(w.word)))
  const ids = new Set(words.map((w) => w.id))
  let added = 0
  for (const w of Array.isArray(list) ? list : []) {
    if (!isWord(w) || w.word.trim() === '' || seen.has(normalise(w.word)) || ids.has(w.id)) continue
    seen.add(normalise(w.word))
    ids.add(w.id)
    words.push({
      id: w.id,
      word: w.word.trim(),
      meaning: w.meaning,
      sentence: w.sentence,
      topic: normaliseTopic(w.topic),
      savedAt: w.savedAt,
      box: w.box,
      ...extras(w),
      ...(isGap(w.interval) && { interval: w.interval }),
      ...(isDayKey(w.due) && { due: w.due }),
    })
    added += 1
  }
  if (added === 0) return { ok: true, added }
  words.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  return write(words) ? { ok: true, added } : { ok: false, added: 0 }
}

// "Edit" on My Words: the meaning, the note and the topic. A new meaning drops the
// translation of the old one. An empty note removes it.
export function updateWord(id, { meaning, note, topic }) {
  const words = read()
  const word = words.find((w) => w.id === id)
  if (!word || !isText(meaning) || meaning.trim() === '') return false
  const { help, note: _oldNote, ...rest } = word
  const changed = {
    ...rest,
    meaning: meaning.trim(),
    topic: normaliseTopic(topic),
    ...extras({ help: meaning.trim() === word.meaning ? help : undefined, note }),
  }
  return write(words.map((w) => (w.id === id ? changed : w)))
}

// After a practice answer: the level (box 1 to 3), the gap in days and the due day.
export function setProgress(id, { box, interval, due }) {
  return write(read().map((w) => (w.id === id ? { ...w, box, interval, due } : w)))
}
