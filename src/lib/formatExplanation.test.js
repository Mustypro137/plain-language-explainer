import { formatExplanation } from './formatExplanation.js'

const full = {
  kind: 'error',
  explanation: 'The list is missing.',
  why: 'Data is late.',
  steps: ['Open line 14', 'Add an empty list'],
  example: 'useState([])',
  words: [{ word: 'undefined', meaning: 'no value yet', sentence: 's' }],
}

test('writes all five headings for an error answer', () => {
  const text = formatExplanation(full)
  for (const h of ['In simple words', 'Why this happens', 'What to try next', 'Practical example', 'Hard words']) {
    expect(text).toContain(h)
  }
})

test('leaves out What to try next when there are no steps', () => {
  const text = formatExplanation({ ...full, kind: 'docs', steps: [] })
  expect(text).not.toContain('What to try next')
  expect(text).toContain('In simple words')
})

test('leaves out Practical example and Hard words when empty', () => {
  const text = formatExplanation({ ...full, example: '', words: [] })
  expect(text).not.toContain('Practical example')
  expect(text).not.toContain('Hard words')
})

test('numbers the steps and lists words as "word: meaning"', () => {
  const text = formatExplanation(full)
  expect(text).toContain('1. Open line 14')
  expect(text).toContain('2. Add an empty list')
  expect(text).toContain('undefined: no value yet')
})
