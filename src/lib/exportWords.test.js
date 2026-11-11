import { downloadWords, exportFileName, wordsToJson } from './exportWords.js'

const words = [
  { id: '1', word: 'callback', meaning: 'm', sentence: 's', savedAt: '2026-11-11T10:00:00.000Z', box: 2 },
  { id: '2', word: 'async', meaning: 'm2', sentence: 's2', savedAt: '2026-11-10T10:00:00.000Z', box: 1 },
]

test('wordsToJson round-trips the words', () => {
  expect(JSON.parse(wordsToJson(words)).words).toEqual(words)
})

test('wordsToJson names the app and version', () => {
  const parsed = JSON.parse(wordsToJson(words))
  expect(parsed.app).toBe('plain-language-explainer')
  expect(parsed.version).toBe(1)
  expect(typeof parsed.exportedAt).toBe('string')
})

test('exportFileName uses the date', () =>
  expect(exportFileName(new Date('2026-11-11T10:00:00Z'))).toBe('my-words-2026-11-11.json'))

test('downloadWords clicks a temporary download link and cleans up', () => {
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
  let link
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    link = this
  })
  downloadWords(words)
  expect(link.download).toMatch(/^my-words-\d{4}-\d{2}-\d{2}\.json$/)
  expect(link.href).toBe('blob:fake')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  expect(document.querySelector('a[download]')).toBeNull()
})
