import { addDays, daysBetween, isDayKey } from './days.js'

// The days on which a practice round was finished. This file is the only one that touches this key.
const KEY = 'ple.practice-days.v1'
// About a year is enough for any streak the page shows.
const MAX_DAYS = 400

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(parsed) ? parsed.filter(isDayKey) : []
  } catch {
    return []
  }
}

export function listPracticeDays() {
  return read()
}

export function recordPracticeDay(day) {
  const days = read()
  if (days.includes(day)) return true
  try {
    localStorage.setItem(KEY, JSON.stringify([day, ...days].sort().reverse().slice(0, MAX_DAYS)))
    return true
  } catch {
    return false
  }
}

// Days in a row with a finished round, ending today. A streak stays alive through today
// until the day is over, so practising yesterday but not yet today still counts.
export function streakLength(days, today) {
  const set = new Set(days)
  let day = set.has(today) ? today : addDays(today, -1)
  let n = 0
  while (set.has(day)) {
    n += 1
    day = addDays(day, -1)
  }
  return n
}

// The last seven days, oldest first, for the week strip.
export function lastSevenDays(days, today) {
  const set = new Set(days)
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6)
    return { day, practised: set.has(day), isToday: daysBetween(day, today) === 0 }
  })
}
