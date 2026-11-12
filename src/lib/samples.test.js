import { MAX_CHARS, parseAiAnswer } from '../../api/_lib/validate.js'
import { SAMPLES } from './samples.js'

test('there are three samples: two errors and one docs paragraph', () => {
  expect(SAMPLES.map((s) => s.result.kind)).toEqual(['error', 'error', 'docs'])
  expect(new Set(SAMPLES.map((s) => s.id)).size).toBe(SAMPLES.length)
})

test.each(SAMPLES.map((s) => [s.id, s]))('%s follows the same rules as a real AI answer', (_, sample) => {
  expect(sample.text.length).toBeLessThanOrEqual(MAX_CHARS)
  expect(parseAiAnswer(JSON.stringify(sample.result))).toEqual(sample.result)
})

test.each(SAMPLES.map((s) => [s.id, s]))('every hard word in %s comes from its text', (_, sample) => {
  for (const w of sample.result.words) expect(sample.text).toContain(w.sentence)
})
