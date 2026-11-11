import { formatWait } from './formatWait.js'

test.each([
  [1, '1 second'],
  [8, '8 seconds'],
  [59, '59 seconds'],
  [60, '1 minute'],
  [61, '1 minute 1 second'],
  [200, '3 minutes 20 seconds'],
  [3600, '1 hour'],
  [3660, '1 hour 1 minute'],
  [8001, '2 hours 14 minutes'],
])('%i seconds reads as "%s"', (seconds, text) => expect(formatWait(seconds)).toBe(text))
