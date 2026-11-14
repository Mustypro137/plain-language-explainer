// "Check yourself": up to three questions built from an answer already on screen, with no AI call.
// A line question shows a line of the user's text and asks which plain sentence matches it; a word
// question shows a hard word and asks for its meaning. The wrong choices are other lines' plain
// sentences or other words' meanings, so every choice is real text from the same answer.

const MAX_QUESTIONS = 3
const CHOICES = 3

const filled = (s) => typeof s === 'string' && s.trim() !== ''

// Keeps the first item for each answer text, so two choices can never read the same.
function uniqueBy(items, answerOf) {
  const seen = new Set()
  return items.filter((item) => {
    const key = answerOf(item).trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function shuffle(list, random) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Null when there are not enough wrong choices. A row whose text repeats elsewhere ("}") cannot
// use the other copy as a wrong choice: both answers would be right.
function question(kind, item, pool, answerOf, random) {
  const promptOf = (p) => (kind === 'line' ? p.text.trim() : p.word)
  const candidates = pool.filter((p) => p !== item && promptOf(p) !== promptOf(item))
  if (candidates.length < CHOICES - 1) return null
  const others = shuffle(candidates, random).slice(0, CHOICES - 1)
  const choices = shuffle([item, ...others], random).map((p) => ({ text: answerOf(p), correct: p === item }))
  return kind === 'line'
    ? { kind, prompt: item.text, line: item.from, choices }
    : { kind, prompt: item.word, line: null, choices }
}

// rows: line-by-line rows ({ from, to, text, plain }); words: the answer's hard words ({ word, meaning }).
export function buildCheck(rows, words, random = Math.random) {
  const lines = uniqueBy(rows.filter((r) => filled(r.plain)), (r) => r.plain)
  const terms = uniqueBy(words.filter((w) => filled(w.word) && filled(w.meaning)), (w) => w.meaning)
  const kinds = [
    lines.length >= CHOICES && { kind: 'line', pool: lines, answerOf: (r) => r.plain, next: 0 },
    terms.length >= CHOICES && { kind: 'word', pool: terms, answerOf: (w) => w.meaning, next: 0 },
  ].filter(Boolean)

  const out = []
  for (let turn = 0; out.length < MAX_QUESTIONS && kinds.some((k) => k.next < k.pool.length); turn++) {
    const k = kinds[turn % kinds.length]
    if (k.next >= k.pool.length) continue
    const q = question(k.kind, k.pool[k.next++], k.pool, k.answerOf, random)
    if (q) out.push(q)
  }
  return out
}
