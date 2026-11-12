import { addDays } from './days.js'

export const ROUND_SIZE = 10

// Lowest level first, then the word that has waited longest, then the oldest saved.
export function buildRound(words, size = ROUND_SIZE) {
  return [...words]
    .sort((a, b) => a.box - b.box || (a.due ?? '').localeCompare(b.due ?? '') || a.savedAt.localeCompare(b.savedAt))
    .slice(0, size)
}

export function nextBox(box, knew) {
  return knew ? Math.min(box + 1, 3) : 1
}

// Days until a word comes back, growing with each "I knew it" in a row.
export const INTERVALS = [1, 3, 7, 16, 35]

export function nextInterval(interval, knew) {
  if (!knew) return 0
  return INTERVALS.find((n) => n > interval) ?? INTERVALS.at(-1)
}

// After an answer: the word's new level, its gap in days and the day it is due.
// "I forgot" makes it due again today.
export function schedule(word, knew, today) {
  const interval = nextInterval(word.interval ?? 0, knew)
  return { box: nextBox(word.box, knew), interval, due: addDays(today, interval) }
}

// A word with no due day (never practised) is due now.
export const isDue = (word, today) => !word.due || word.due <= today

// The soonest day after today when some word is due, and how many words are due then.
export function nextReview(words, today) {
  const later = words.map((w) => w.due).filter((d) => d && d > today)
  if (later.length === 0) return null
  const day = later.reduce((a, b) => (b < a ? b : a))
  return { day, count: later.filter((d) => d === day).length }
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
