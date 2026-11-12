import { MAX_SEGMENTS, numberSegments, segmentText } from './segments.js'

test('each line is a part, trimmed, and empty lines are skipped', () => {
  expect(segmentText('npm ERR! code ERESOLVE\n\n   at App (App.jsx:3:1)  \n')).toEqual([
    'npm ERR! code ERESOLVE',
    'at App (App.jsx:3:1)',
  ])
})

test('a short line with "!" stays whole', () => {
  expect(segmentText('npm ERR! ERESOLVE could not resolve')).toEqual(['npm ERR! ERESOLVE could not resolve'])
})

test('a long line of prose becomes one part per sentence', () => {
  const first = 'Cross-Origin Resource Sharing is a mechanism that lets a server say which other origins may load its resources.'
  const second = 'CORS also relies on a preflight request.'
  expect(segmentText(`${first} ${second}`)).toEqual([first, second])
})

test('a very long text keeps at most 40 parts, the tail joined into the last one', () => {
  const lines = Array.from({ length: 45 }, (_, i) => `at f${i} (a.js:${i}:1)`)
  const parts = segmentText(lines.join('\n'))
  expect(parts).toHaveLength(MAX_SEGMENTS)
  expect(parts.at(-1)).toBe(lines.slice(MAX_SEGMENTS - 1).join('\n'))
})

test('numbers the parts for the AI', () => {
  expect(numberSegments(['a', 'b'])).toBe('1| a\n2| b')
})
