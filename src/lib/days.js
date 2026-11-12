// Calendar days in the visitor's own time zone, written as "YYYY-MM-DD".
// Reviews and streaks count days, not hours: a word due "tomorrow" is due from midnight.

const pad = (n) => String(n).padStart(2, '0')

export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// A real calendar day: "2026-02-31" is not one.
export const isDayKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && dayKey(toDate(v)) === v

// Midnight at the start of that day, local time.
export function toDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const date = toDate(key)
  date.setDate(date.getDate() + n)
  return dayKey(date)
}

// Whole days from one key to another (negative when `to` is earlier).
export function daysBetween(from, to) {
  return Math.round((Date.UTC(...parts(to)) - Date.UTC(...parts(from))) / 86400000)
}

function parts(key) {
  const [y, m, d] = key.split('-').map(Number)
  return [y, m - 1, d]
}

// "today", "tomorrow", "in 3 days"; a day in the past also reads "today" (it is due now).
export function whenDue(due, today) {
  const n = daysBetween(today, due)
  if (n <= 0) return 'today'
  if (n === 1) return 'tomorrow'
  return `in ${n} days`
}
