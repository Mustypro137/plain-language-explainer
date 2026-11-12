import { backupFileName, backupToJson, downloadBackup, readBackup } from './backup.js'

const words = [
  { id: '1', word: 'callback', meaning: 'm', sentence: 's', savedAt: '2026-11-11T10:00:00.000Z', box: 2 },
  { id: '2', word: 'async', meaning: 'm2', sentence: 's2', savedAt: '2026-11-10T10:00:00.000Z', box: 1 },
]
const history = [{ id: 'h', text: 't', level: null, savedAt: '2026-11-11T10:00:00.000Z', result: {} }]

test('backupToJson names the app and version 2, and holds words and History', () => {
  const parsed = JSON.parse(backupToJson({ words, history }))
  expect(parsed).toMatchObject({ app: 'plain-language-explainer', version: 2, words, history })
  expect(typeof parsed.exportedAt).toBe('string')
})

test('a backup reads back the same lists', () =>
  expect(readBackup(backupToJson({ words, history }))).toEqual({ words, history }))

test('an old version 1 export (words only) is read with an empty History', () => {
  const v1 = JSON.stringify({ app: 'plain-language-explainer', version: 1, exportedAt: 'x', words })
  expect(readBackup(v1)).toEqual({ words, history: [] })
})

test.each([
  ['not json'],
  ['null'],
  ['[]'],
  [JSON.stringify({ app: 'other-app', version: 2, words })],
  [JSON.stringify({ app: 'plain-language-explainer', version: 3, words })],
  [JSON.stringify({ app: 'plain-language-explainer', version: 2, words: 'many' })],
])('readBackup(%s) is not a backup', (text) => expect(readBackup(text)).toBeNull())

test('backupFileName uses the date', () =>
  expect(backupFileName(new Date('2026-11-11T10:00:00Z'))).toBe('plain-language-backup-2026-11-11.json'))

test('downloadBackup clicks a temporary download link and cleans up', () => {
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
  let link
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    link = this
  })
  downloadBackup({ words, history })
  expect(link.download).toMatch(/^plain-language-backup-\d{4}-\d{2}-\d{2}\.json$/)
  expect(link.href).toBe('blob:fake')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  expect(document.querySelector('a[download]')).toBeNull()
})
