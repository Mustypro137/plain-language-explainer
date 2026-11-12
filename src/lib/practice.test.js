import {
  CHOICES,
  INTERVALS,
  ROUND_SIZE,
  buildChoices,
  buildRound,
  canUseChoices,
  isDue,
  nextBox,
  nextInterval,
  nextReview,
  schedule,
} from './practice.js'

test('the gaps between reviews are 1, 3, 7, 16 and 35 days', () => expect(INTERVALS).toEqual([1, 3, 7, 16, 35]))

test('nextInterval grows with each "knew it" and stops at 35 days', () => {
  const gaps = []
  let n = 0
  for (let i = 0; i < 7; i++) gaps.push((n = nextInterval(n, true)))
  expect(gaps).toEqual([1, 3, 7, 16, 35, 35, 35])
})

test('nextInterval starts again at 0 days on "forgot"', () => expect(nextInterval(16, false)).toBe(0))

test('schedule sets the level, the gap and the due day', () => {
  const word = { box: 2, interval: 3 }
  expect(schedule(word, true, '2026-01-30')).toEqual({ box: 3, interval: 7, due: '2026-02-06' })
  expect(schedule(word, false, '2026-01-30')).toEqual({ box: 1, interval: 0, due: '2026-01-30' })
})

test('schedule treats a word never practised as gap 0', () =>
  expect(schedule({ box: 1 }, true, '2026-01-30')).toEqual({ box: 2, interval: 1, due: '2026-01-31' }))

test('isDue: no due day, a past day and today are due; a later day is not', () => {
  expect(isDue({}, '2026-01-05')).toBe(true)
  expect(isDue({ due: null }, '2026-01-05')).toBe(true)
  expect(isDue({ due: '2026-01-04' }, '2026-01-05')).toBe(true)
  expect(isDue({ due: '2026-01-05' }, '2026-01-05')).toBe(true)
  expect(isDue({ due: '2026-01-06' }, '2026-01-05')).toBe(false)
})

test('nextReview finds the soonest later day and counts its words', () => {
  const words = [{ due: '2026-01-09' }, { due: '2026-01-07' }, { due: '2026-01-07' }, { due: '2026-01-05' }, {}]
  expect(nextReview(words, '2026-01-05')).toEqual({ day: '2026-01-07', count: 2 })
  expect(nextReview([{ due: '2026-01-05' }, {}], '2026-01-05')).toBeNull()
})

test('buildRound puts the word that waited longest first within a level', () => {
  const words = [
    { ...w('late', 2, '2026-01-01'), due: '2026-01-05' },
    { ...w('early', 2, '2026-01-02'), due: '2026-01-02' },
  ]
  expect(buildRound(words).map((x) => x.id)).toEqual(['early', 'late'])
})

const w = (id, box, savedAt) => ({ id, word: id, meaning: 'm', sentence: 's', box, savedAt })

test('ROUND_SIZE is 10', () => expect(ROUND_SIZE).toBe(10))

test('nextBox moves up on knew and stops at 3', () => {
  expect(nextBox(1, true)).toBe(2)
  expect(nextBox(2, true)).toBe(3)
  expect(nextBox(3, true)).toBe(3)
})

test('nextBox returns to 1 on forgot', () => {
  expect(nextBox(3, false)).toBe(1)
  expect(nextBox(1, false)).toBe(1)
})

test('buildRound puts the lowest box first, then the oldest word', () => {
  const words = [
    w('c', 2, '2026-01-01'),
    w('b', 1, '2026-01-03'),
    w('a', 1, '2026-01-02'),
    w('d', 3, '2025-12-01'),
  ]
  expect(buildRound(words).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd'])
})

test('buildRound returns at most 10 words', () => {
  const words = Array.from({ length: 14 }, (_, i) => w(`w${i}`, 1, `2026-01-${String(i + 1).padStart(2, '0')}`))
  expect(buildRound(words)).toHaveLength(10)
})

test('buildRound keeps the lowest boxes when cutting', () => {
  const words = [
    ...Array.from({ length: 10 }, (_, i) => w(`k${i}`, 3, '2026-01-01')),
    w('new', 1, '2026-02-01'),
  ]
  expect(buildRound(words).map((x) => x.id)).toContain('new')
})

test('buildRound does not change the list it is given', () => {
  const words = [w('b', 2, '2026-01-02'), w('a', 1, '2026-01-01')]
  buildRound(words)
  expect(words.map((x) => x.id)).toEqual(['b', 'a'])
})

const mw = (id, meaning) => ({ id, word: id, meaning, sentence: 's', box: 1, savedAt: '2026-01-01' })
const pool = [mw('a', 'Meaning A'), mw('b', 'Meaning B'), mw('c', 'Meaning C'), mw('d', 'Meaning D'), mw('e', 'Meaning E')]

// A fixed "random" source, so the order is the same on every run.
const seq = (...values) => {
  let i = 0
  return () => values[i++ % values.length]
}

test('CHOICES is 4', () => expect(CHOICES).toBe(4))

test('buildChoices gives four meanings with exactly one right answer', () => {
  const choices = buildChoices(pool[0], pool, seq(0.1, 0.7, 0.4, 0.9, 0.2))
  expect(choices).toHaveLength(4)
  expect(choices.filter((c) => c.correct)).toEqual([{ meaning: 'Meaning A', correct: true }])
  expect(new Set(choices.map((c) => c.meaning)).size).toBe(4)
  for (const c of choices) expect(pool.map((w) => w.meaning)).toContain(c.meaning)
})

test('buildChoices does not always put the right answer first', () => {
  const places = new Set()
  for (const r of [0, 0.3, 0.6, 0.99]) {
    places.add(buildChoices(pool[0], pool, () => r).findIndex((c) => c.correct))
  }
  expect(places.size).toBeGreaterThan(1)
})

test('wrong answers never repeat the right meaning, even in another letter case', () => {
  const words = [mw('a', 'Same thing'), mw('b', ' same THING '), mw('c', 'Other 1'), mw('d', 'Other 2'), mw('e', 'Other 3')]
  for (const r of [0, 0.5, 0.99]) {
    const wrong = buildChoices(words[0], words, () => r).filter((c) => !c.correct)
    expect(wrong.map((c) => c.meaning).sort()).toEqual(['Other 1', 'Other 2', 'Other 3'])
  }
})

test('canUseChoices needs four different meanings', () => {
  expect(canUseChoices(pool.slice(0, 3))).toBe(false)
  expect(canUseChoices(pool.slice(0, 4))).toBe(true)
  expect(canUseChoices([...pool.slice(0, 3), mw('x', 'meaning a')])).toBe(false)
})
