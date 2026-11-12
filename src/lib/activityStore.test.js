import { lastSevenDays, listPracticeDays, recordPracticeDay, streakLength } from './activityStore.js'

const KEY = 'ple.practice-days.v1'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

test('records a day once, newest first', () => {
  recordPracticeDay('2026-01-02')
  recordPracticeDay('2026-01-03')
  recordPracticeDay('2026-01-03')
  expect(listPracticeDays()).toEqual(['2026-01-03', '2026-01-02'])
})

test('ignores broken storage and broken entries', () => {
  localStorage.setItem(KEY, '{nope')
  expect(listPracticeDays()).toEqual([])
  localStorage.setItem(KEY, JSON.stringify(['2026-01-01', 'yesterday', 5, null]))
  expect(listPracticeDays()).toEqual(['2026-01-01'])
})

test('reports a storage failure instead of throwing', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  expect(recordPracticeDay('2026-01-01')).toBe(false)
})

test('keeps at most 400 days', () => {
  localStorage.setItem(
    KEY,
    JSON.stringify(Array.from({ length: 400 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10))),
  )
  recordPracticeDay('2026-06-01')
  const days = listPracticeDays()
  expect(days).toHaveLength(400)
  expect(days[0]).toBe('2026-06-01')
})

test.each([
  [[], 0],
  [['2026-01-10'], 1],
  [['2026-01-10', '2026-01-09', '2026-01-08'], 3],
  [['2026-01-09', '2026-01-08'], 2],
  [['2026-01-10', '2026-01-08'], 1],
  [['2026-01-08', '2026-01-07'], 0],
])('streakLength(%j) on 2026-01-10 is %i', (days, n) => expect(streakLength(days, '2026-01-10')).toBe(n))

test('a streak runs across the end of a month', () =>
  expect(streakLength(['2026-03-01', '2026-02-28', '2026-02-27'], '2026-03-01')).toBe(3))

test('lastSevenDays lists the week up to today, oldest first', () => {
  const week = lastSevenDays(['2026-01-10', '2026-01-05', '2026-01-01'], '2026-01-10')
  expect(week.map((d) => d.day)).toEqual([
    '2026-01-04',
    '2026-01-05',
    '2026-01-06',
    '2026-01-07',
    '2026-01-08',
    '2026-01-09',
    '2026-01-10',
  ])
  expect(week.filter((d) => d.practised).map((d) => d.day)).toEqual(['2026-01-05', '2026-01-10'])
  expect(week.filter((d) => d.isToday).map((d) => d.day)).toEqual(['2026-01-10'])
})
