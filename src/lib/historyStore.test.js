import {
  MAX_ITEMS,
  addHistory,
  clearHistory,
  deleteHistoryItem,
  getHistoryItem,
  listHistory,
} from './historyStore.js'

const KEY = 'ple.history.v1'

const result = (over = {}) => ({
  kind: 'error',
  explanation: 'Simple words.',
  why: 'A reason.',
  steps: ['Try this'],
  example: 'const a = []',
  words: [{ word: 'undefined', meaning: 'Not set.', sentence: 'x is undefined' }],
  ...over,
})

const stored = (over = {}) => ({
  id: 'g',
  text: 'good text',
  result: result(),
  savedAt: '2026-01-01T00:00:00Z',
  ...over,
})

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

test('adds an explanation and lists it', () => {
  const item = addHistory({ text: 'some error', result: result() })
  expect(item.text).toBe('some error')
  expect(item.result).toEqual(result())
  expect(typeof item.id).toBe('string')
  expect(new Date(item.savedAt).toISOString()).toBe(item.savedAt)
  expect(listHistory()).toEqual([item])
})

test('lists the newest first', () => {
  addHistory({ text: 'first', result: result() })
  addHistory({ text: 'second', result: result() })
  expect(listHistory().map((h) => h.text)).toEqual(['second', 'first'])
})

test('explaining the same text again replaces the old entry', () => {
  addHistory({ text: 'same', result: result({ explanation: 'old' }) })
  addHistory({ text: 'other', result: result() })
  addHistory({ text: 'same', result: result({ explanation: 'new' }) })
  const list = listHistory()
  expect(list.map((h) => h.text)).toEqual(['same', 'other'])
  expect(list[0].result.explanation).toBe('new')
})

test('keeps only the newest entries', () => {
  for (let i = 0; i < MAX_ITEMS + 3; i++) addHistory({ text: `t${i}`, result: result() })
  const list = listHistory()
  expect(MAX_ITEMS).toBe(20)
  expect(list).toHaveLength(MAX_ITEMS)
  expect(list[0].text).toBe(`t${MAX_ITEMS + 2}`)
  expect(list.at(-1).text).toBe('t3')
})

test('getHistoryItem finds one entry by id', () => {
  const a = addHistory({ text: 'a', result: result() })
  addHistory({ text: 'b', result: result() })
  expect(getHistoryItem(a.id)).toEqual(a)
  expect(getHistoryItem('nope')).toBeUndefined()
  expect(getHistoryItem(null)).toBeUndefined()
})

test('deleteHistoryItem removes only that entry', () => {
  const a = addHistory({ text: 'a', result: result() })
  addHistory({ text: 'b', result: result() })
  deleteHistoryItem(a.id)
  expect(listHistory().map((h) => h.text)).toEqual(['b'])
})

test('clearHistory removes every entry', () => {
  addHistory({ text: 'a', result: result() })
  addHistory({ text: 'b', result: result() })
  clearHistory()
  expect(listHistory()).toEqual([])
})

test('returns an empty list when storage holds broken JSON', () => {
  localStorage.setItem(KEY, '{not json')
  expect(listHistory()).toEqual([])
})

test('returns an empty list when storage holds a non-list', () => {
  localStorage.setItem(KEY, '{"a":1}')
  expect(listHistory()).toEqual([])
})

test('skips broken entries inside an otherwise valid list', () => {
  const good = stored()
  localStorage.setItem(
    KEY,
    JSON.stringify([
      null,
      5,
      { id: 'x', text: 't' },
      stored({ id: 'k', result: result({ kind: 'other' }) }),
      stored({ id: 's', result: result({ steps: 'not a list' }) }),
      stored({ id: 'n', result: result({ steps: [1] }) }),
      stored({ id: 'w', result: result({ words: [{ word: 'no meaning' }] }) }),
      stored({ id: 'e', result: result({ example: null }) }),
      stored({ id: 'r', result: null }),
      stored({ id: 'd', savedAt: 'not a date' }),
      good,
    ]),
  )
  expect(listHistory()).toEqual([good])
  expect(getHistoryItem('k')).toBeUndefined()
})

test('reports a storage failure instead of throwing', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  expect(addHistory({ text: 'x', result: result() })).toBeNull()
})

test('does not touch the saved words', () => {
  localStorage.setItem('ple.words.v1', '[]')
  addHistory({ text: 'a', result: result() })
  clearHistory()
  expect(localStorage.getItem('ple.words.v1')).toBe('[]')
})
