import { TOPICS } from '../../shared/topics.js'

// "Sky" view of My Words: one constellation per topic. Each star gets its own cell, so
// labels never overlap; a small fixed jitter (from the word's id) makes it look like a
// sky, not a table, and keeps every star in the same place on every visit.
export const CELL_W = 112
export const CELL_H = 84
// Three stars a row fit beside the word panel; a phone takes two.
export const MAX_COLS = 3
const TOP = 26 // room above the first row of stars

function hash(text) {
  let h = 5381
  for (const ch of text) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0
  return h
}

// -1 to 1, the same every time for the same id and salt.
const jitter = (id, salt) => ((hash(`${salt}:${id}`) % 2001) - 1000) / 1000

export function skyLayout(words, maxCols = MAX_COLS) {
  const byTopic = new Map()
  for (const w of words) {
    if (!byTopic.has(w.topic)) byTopic.set(w.topic, [])
    byTopic.get(w.topic).push(w)
  }
  return [...byTopic]
    .sort((a, b) => b[1].length - a[1].length || TOPICS.indexOf(a[0]) - TOPICS.indexOf(b[0]))
    .map(([topic, list]) => {
      // Oldest first; the id breaks ties, so the order never depends on the list's order.
      const sorted = [...list].sort((a, b) => a.savedAt.localeCompare(b.savedAt) || a.id.localeCompare(b.id))
      const cols = Math.min(sorted.length, maxCols, Math.ceil(Math.sqrt(sorted.length * 1.5)))
      const rows = Math.ceil(sorted.length / cols)
      const stars = sorted.map((word, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        return {
          word,
          x: Math.round(col * CELL_W + CELL_W / 2 + jitter(word.id, 'x') * 20),
          y: Math.round(TOP + row * CELL_H + jitter(word.id, 'y') * 8),
        }
      })
      return {
        topic,
        index: Math.max(0, TOPICS.indexOf(topic)),
        width: cols * CELL_W,
        height: TOP + (rows - 1) * CELL_H + 56,
        stars,
      }
    })
}

export const LEVEL_NAMES = { 1: 'new', 2: 'learning', 3: 'known' }
