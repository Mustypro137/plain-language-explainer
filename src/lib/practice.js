export const ROUND_SIZE = 10

export function buildRound(words, size = ROUND_SIZE) {
  return [...words]
    .sort((a, b) => a.box - b.box || a.savedAt.localeCompare(b.savedAt))
    .slice(0, size)
}

export function nextBox(box, knew) {
  return knew ? Math.min(box + 1, 3) : 1
}

export const CHOICES = 4

const meaningKey = (meaning) => meaning.trim().toLowerCase()

function distinctMeanings(words) {
  const seen = new Map()
  for (const w of words) if (!seen.has(meaningKey(w.meaning))) seen.set(meaningKey(w.meaning), w.meaning)
  return [...seen.values()]
}

// Multiple choice needs enough different meanings to fill every question.
export function canUseChoices(words) {
  return distinctMeanings(words).length >= CHOICES
}

function shuffle(list, random) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// The right meaning plus three meanings of other saved words, in random order.
export function buildChoices(card, words, random = Math.random) {
  const right = meaningKey(card.meaning)
  const others = distinctMeanings(words).filter((m) => meaningKey(m) !== right)
  const wrong = shuffle(others, random).slice(0, CHOICES - 1)
  return shuffle(
    [{ meaning: card.meaning, correct: true }, ...wrong.map((meaning) => ({ meaning, correct: false }))],
    random,
  )
}
