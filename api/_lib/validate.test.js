import { MAX_CHARS, parseAiAnswer, validateText } from './validate.js'

test('MAX_CHARS is 3000', () => expect(MAX_CHARS).toBe(3000))

test.each([[undefined], [42], [''], ['   \n ']])('%p is empty', (v) =>
  expect(validateText(v)).toEqual({ ok: false, error: 'empty' }),
)

test('trims the text', () => expect(validateText('  hi \n')).toEqual({ ok: true, text: 'hi' }))

test('3,000 characters pass and 3,001 fail', () => {
  expect(validateText('a'.repeat(3000)).ok).toBe(true)
  expect(validateText('a'.repeat(3001))).toEqual({ ok: false, error: 'too_long' })
})

const good = {
  kind: 'error',
  explanation: 'e',
  why: 'w',
  steps: ['1', '2'],
  example: 'x',
  words: [{ word: 'undefined', meaning: 'm', sentence: 's' }],
}

test('reads a good answer', () => expect(parseAiAnswer(JSON.stringify(good))).toEqual(good))

test('reads an answer inside a Markdown code fence', () =>
  expect(parseAiAnswer('```json\n' + JSON.stringify(good) + '\n```')).toEqual(good))

test('keeps at most 3 steps and 8 words', () => {
  const many = {
    ...good,
    steps: ['1', '2', '3', '4', '5'],
    words: Array.from({ length: 12 }, (_, i) => ({ word: `w${i}`, meaning: 'm', sentence: 's' })),
  }
  const r = parseAiAnswer(JSON.stringify(many))
  expect(r.steps).toHaveLength(3)
  expect(r.words).toHaveLength(8)
})

test('empties steps when kind is docs', () => {
  const r = parseAiAnswer(JSON.stringify({ ...good, kind: 'docs' }))
  expect(r.steps).toEqual([])
})

test('drops words with missing fields', () => {
  const raw = JSON.stringify({
    ...good,
    words: [
      { word: 'a', meaning: 'm', sentence: 's' },
      { word: 'b', sentence: 's' },
    ],
  })
  expect(parseAiAnswer(raw).words).toEqual([{ word: 'a', meaning: 'm', sentence: 's' }])
})

test('missing example becomes an empty string', () => {
  const { example, ...rest } = good
  expect(parseAiAnswer(JSON.stringify(rest)).example).toBe('')
})

test.each([
  ['not json'],
  ['{}'],
  [JSON.stringify({ ...good, kind: 'other' })],
  [JSON.stringify({ ...good, explanation: '' })],
])('rejects %s', (raw) => expect(parseAiAnswer(raw)).toBeNull())
