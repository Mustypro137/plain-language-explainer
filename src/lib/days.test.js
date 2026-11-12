import { addDays, dayKey, daysBetween, isDayKey, whenDue } from './days.js'

test('dayKey uses the local calendar day', () => {
  expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  expect(dayKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
})

test.each([
  ['2026-01-31', 1, '2026-02-01'],
  ['2026-02-28', 1, '2026-03-01'],
  ['2028-02-28', 1, '2028-02-29'],
  ['2026-12-31', 1, '2027-01-01'],
  ['2026-03-28', 7, '2026-04-04'],
  ['2026-01-10', -10, '2025-12-31'],
  ['2026-05-05', 0, '2026-05-05'],
])('addDays(%s, %i) is %s', (key, n, out) => expect(addDays(key, n)).toBe(out))

test('daysBetween counts whole days across months and clock changes', () => {
  expect(daysBetween('2026-03-27', '2026-04-03')).toBe(7)
  expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  expect(daysBetween('2026-01-02', '2026-01-01')).toBe(-1)
})

test.each([
  ['2026-01-01', true],
  ['2026-1-1', false],
  ['2026-02-31', false],
  ['not a day', false],
  [undefined, false],
  [20260101, false],
])('isDayKey(%p) is %p', (v, ok) => expect(isDayKey(v)).toBe(ok))

test.each([
  ['2026-01-04', 'today'],
  ['2026-01-05', 'today'],
  ['2026-01-06', 'tomorrow'],
  ['2026-01-12', 'in 7 days'],
])('due %s, seen on 2026-01-05, is %s', (due, text) => expect(whenDue(due, '2026-01-05')).toBe(text))
