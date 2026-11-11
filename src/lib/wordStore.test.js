import { deleteWord, hasWord, listWords, saveWord, setBox } from './wordStore.js'

const entry = (word) => ({ word, meaning: 'm', sentence: 's' })

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

test('saves a word in box 1 and lists it', () => {
  const r = saveWord(entry('callback'))
  expect(r.ok).toBe(true)
  expect(r.word.box).toBe(1)
  expect(listWords()).toHaveLength(1)
})

test('lists newest first', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-11T10:00:00Z'))
  saveWord(entry('a'))
  vi.setSystemTime(new Date('2026-11-11T10:00:01Z'))
  saveWord(entry('b'))
  vi.useRealTimers()
  expect(listWords().map((w) => w.word)).toEqual(['b', 'a'])
})

test('refuses the same word in another letter case', () => {
  saveWord(entry('callback'))
  expect(saveWord(entry(' Callback '))).toEqual({ ok: false, reason: 'duplicate' })
  expect(listWords()).toHaveLength(1)
})

test('hasWord ignores letter case and outer spaces', () => {
  saveWord(entry('callback'))
  expect(hasWord('  CALLBACK ')).toBe(true)
  expect(hasWord('promise')).toBe(false)
})

test('deleteWord removes only that word', () => {
  const a = saveWord(entry('a')).word
  saveWord(entry('b'))
  deleteWord(a.id)
  expect(listWords().map((w) => w.word)).toEqual(['b'])
})

test('setBox changes the box and survives a reload', () => {
  const { word } = saveWord(entry('a'))
  setBox(word.id, 3)
  expect(listWords()[0].box).toBe(3)
})

test('returns an empty list when storage holds broken JSON', () => {
  localStorage.setItem('ple.words.v1', '{not json')
  expect(listWords()).toEqual([])
})

test('returns an empty list when storage holds a non-list', () => {
  localStorage.setItem('ple.words.v1', '{"a":1}')
  expect(listWords()).toEqual([])
})

test('reports a storage failure instead of throwing', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  expect(saveWord(entry('x'))).toEqual({ ok: false, reason: 'storage' })
})
