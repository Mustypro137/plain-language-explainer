import { buildCheck } from './checkQuestions.js'

const row = (n, plain) => ({ from: n, to: n, text: `original line ${n}`, plain })
const rows = (count) => Array.from({ length: count }, (_, i) => row(i + 1, `plain sentence ${i + 1}`))
const words = (count) => Array.from({ length: count }, (_, i) => ({ word: `word${i + 1}`, meaning: `meaning ${i + 1}` }))

// A fixed sequence of "random" numbers, so the order of choices is known.
function seeded(values) {
  let i = 0
  return () => values[i++ % values.length]
}

const correctOf = (q) => q.choices.find((c) => c.correct)

test('nothing to ask with fewer than 3 lines and fewer than 3 words', () => {
  expect(buildCheck(rows(2), words(2))).toEqual([])
  expect(buildCheck([], [])).toEqual([])
})

test('three lines and no words make three line questions', () => {
  const qs = buildCheck(rows(3), [])
  expect(qs.map((q) => q.kind)).toEqual(['line', 'line', 'line'])
  for (const q of qs) {
    expect(q.choices).toHaveLength(3)
    expect(q.choices.filter((c) => c.correct)).toHaveLength(1)
    const r = rows(3).find((x) => x.from === q.line)
    expect(q.prompt).toBe(r.text)
    expect(correctOf(q).text).toBe(r.plain)
  }
})

test('three words and no lines make three word questions', () => {
  const qs = buildCheck([], words(3))
  expect(qs.map((q) => q.kind)).toEqual(['word', 'word', 'word'])
  for (const q of qs) {
    expect(q.line).toBeNull()
    const w = words(3).find((x) => x.word === q.prompt)
    expect(correctOf(q).text).toBe(w.meaning)
  }
})

test('with both, the kinds take turns, a line first', () => {
  expect(buildCheck(rows(4), words(4)).map((q) => q.kind)).toEqual(['line', 'word', 'line'])
})

test('rows without a plain version are never used', () => {
  const qs = buildCheck([...rows(3), row(4, null), { ...row(5, '  '), plain: '  ' }], [])
  for (const q of qs) {
    expect(q.line).toBeLessThanOrEqual(3)
    for (const c of q.choices) expect(c.text.trim()).not.toBe('')
  }
})

test('two lines with the same plain sentence never give two identical choices', () => {
  const same = [row(1, 'same'), row(2, 'same'), row(3, 'other'), row(4, 'third')]
  for (const q of buildCheck(same, [])) {
    expect(new Set(q.choices.map((c) => c.text)).size).toBe(q.choices.length)
  }
})

test('the same line or word is never asked twice', () => {
  const qs = buildCheck(rows(6), words(6))
  const asked = qs.map((q) => `${q.kind}:${q.prompt}`)
  expect(new Set(asked).size).toBe(asked.length)
})

test('the right choice is not always in the same place', () => {
  const qs = buildCheck(rows(5), [], seeded([0.1, 0.9, 0.5, 0.3, 0.7, 0.2]))
  const places = qs.map((q) => q.choices.findIndex((c) => c.correct))
  expect(new Set(places).size).toBeGreaterThan(1)
})

test('the same random numbers give the same questions', () => {
  const a = buildCheck(rows(5), words(5), seeded([0.4, 0.8, 0.1]))
  const b = buildCheck(rows(5), words(5), seeded([0.4, 0.8, 0.1]))
  expect(a).toEqual(b)
})

test('a line that appears twice is never offered with the other copy as a wrong choice', () => {
  const twice = [
    { from: 1, to: 1, text: '}', plain: 'This closes the function.' },
    { from: 2, to: 2, text: '}', plain: 'This closes the file.' },
    row(3, 'third'),
  ]
  const qs = buildCheck(twice, [], seeded([0.1, 0.6, 0.9, 0.3]))
  for (const q of qs) {
    if (q.prompt !== '}') continue
    const otherCopy = twice.find((r) => r.text === '}' && r.from !== q.line).plain
    expect(q.choices.map((c) => c.text)).not.toContain(otherCopy)
  }
})
