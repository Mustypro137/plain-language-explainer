import { ROUND_SIZE, buildRound, nextBox } from './practice.js'

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
