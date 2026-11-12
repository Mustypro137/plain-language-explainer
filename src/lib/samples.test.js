import { MAX_CHARS, parseAiAnswer } from '../../api/_lib/validate.js'
import { segmentText } from '../../shared/segments.js'
import { SAMPLES } from './samples.js'

test('there are three samples: two errors and one docs paragraph', () => {
  expect(SAMPLES.map((s) => s.result.kind)).toEqual(['error', 'error', 'docs'])
  expect(new Set(SAMPLES.map((s) => s.id)).size).toBe(SAMPLES.length)
})

// The AI sends line numbers as "n" (and "to"); the app keeps them as "from" and "to".
const asAiSends = (result) => ({ ...result, lines: result.lines.map(({ from, to, plain }) => ({ n: from, to, plain })) })

test.each(SAMPLES.map((s) => [s.id, s]))('%s follows the same rules as a real AI answer', (_, sample) => {
  expect(sample.text.length).toBeLessThanOrEqual(MAX_CHARS)
  const parts = segmentText(sample.text).length
  expect(parseAiAnswer(JSON.stringify(asAiSends(sample.result)), null, parts)).toEqual(sample.result)
})

test.each(SAMPLES.map((s) => [s.id, s]))('the line-by-line answer of %s covers every part of its text', (_, sample) => {
  const covered = sample.result.lines.flatMap((l) => Array.from({ length: l.to - l.from + 1 }, (_, i) => l.from + i))
  expect(covered).toEqual(segmentText(sample.text).map((_, i) => i + 1))
})

test.each(SAMPLES.map((s) => [s.id, s]))('every hard word in %s comes from its text', (_, sample) => {
  for (const w of sample.result.words) expect(sample.text).toContain(w.sentence)
})
