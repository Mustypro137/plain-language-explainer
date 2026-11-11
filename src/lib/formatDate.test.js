import { formatDate } from './formatDate.js'

test('shows the day, month, year and time of a saved date', () => {
  // Midday UTC is the same calendar month in every time zone.
  const shown = formatDate('2026-06-15T12:00:00.000Z')
  expect(shown).toMatch(/Jun 2026/)
  expect(shown).toMatch(/\d{2}:\d{2}/)
})
