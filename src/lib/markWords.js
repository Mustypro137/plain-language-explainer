const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A hard word must not touch other letters, so "map" marks "map" but not "bitmap".
function pattern(word) {
  const start = /^\w/.test(word) ? '(?<!\\w)' : ''
  const end = /\w$/.test(word) ? '(?!\\w)' : ''
  return `${start}${escape(word)}${end}`
}

// Splits the text into pieces; a piece that is a hard word carries that word.
// Letter case is ignored. Longer words go first, so "peer dependency" wins over "dependency".
// A hard word that is not in the text (the AI may change its form) is simply not marked.
export function markWords(text, words) {
  const usable = words.filter((w) => w.word.trim() !== '').sort((a, b) => b.word.trim().length - a.word.trim().length)
  if (usable.length === 0) return [{ text }]
  const re = new RegExp(usable.map((w) => `(${pattern(w.word.trim())})`).join('|'), 'gi')
  const pieces = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) pieces.push({ text: text.slice(last, m.index) })
    pieces.push({ text: m[0], word: usable[m.slice(1).findIndex((g) => g !== undefined)] })
    last = m.index + m[0].length
  }
  if (last < text.length) pieces.push({ text: text.slice(last) })
  return pieces
}

// The words markWords would mark in the text, each once, in the order they are first met.
export function wordsIn(text, words) {
  const found = []
  for (const p of markWords(text, words)) if (p.word && !found.includes(p.word)) found.push(p.word)
  return found
}

// "Fill the blank": the saved sentence in pieces, with every use of the word as a blank
// ({ blank: true, text }). Null if the sentence does not use the word as it is saved.
export function blankOut(sentence, word) {
  const pieces = markWords(sentence, [{ word }])
  if (!pieces.some((p) => p.word)) return null
  return pieces.map((p) => (p.word ? { blank: true, text: p.text } : { text: p.text }))
}
