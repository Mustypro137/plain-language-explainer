import { WORDS_CHANGED, deleteWord, hasWord, importWords, listWords, restoreWord, saveWord, setProgress } from './wordStore.js'

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

test('deleteWord returns the word and its place, and restoreWord puts it back there', () => {
  const c = saveWord(entry('c')).word
  const b = saveWord(entry('b')).word
  saveWord(entry('a'))
  setProgress(b.id, { box: 3 })
  const removed = deleteWord(b.id)
  expect(removed).toEqual({ word: { ...b, box: 3 }, index: 1 })
  expect(listWords().map((w) => w.word)).toEqual(['a', 'c'])
  expect(restoreWord(removed)).toBe(true)
  expect(listWords().map((w) => [w.word, w.box])).toEqual([['a', 1], ['b', 3], ['c', 1]])
  expect(c.id).toBe(listWords()[2].id)
})

test('deleteWord returns null for an unknown id', () => {
  saveWord(entry('a'))
  expect(deleteWord('nope')).toBeNull()
  expect(listWords()).toHaveLength(1)
})

test('restoreWord does not add a second copy of a word saved again meanwhile', () => {
  const removed = deleteWord(saveWord(entry('callback')).word.id)
  saveWord(entry('Callback'))
  expect(restoreWord(removed)).toBe(true)
  expect(listWords().map((w) => w.word)).toEqual(['Callback'])
})

test('restoreWord fits the word in when the list got shorter', () => {
  saveWord(entry('b'))
  const a = saveWord(entry('a')).word
  const removedB = deleteWord(listWords()[1].id)
  deleteWord(a.id)
  restoreWord(removedB)
  expect(listWords().map((w) => w.word)).toEqual(['b'])
})

test('setProgress changes the box and survives a reload', () => {
  const { word } = saveWord(entry('a'))
  setProgress(word.id, { box: 3 })
  expect(listWords()[0].box).toBe(3)
})

test('setProgress keeps the gap and the due day', () => {
  const { word } = saveWord(entry('a'))
  saveWord(entry('b'))
  setProgress(word.id, { box: 2, interval: 3, due: '2026-02-01' })
  expect(listWords().find((w) => w.word === 'a')).toMatchObject({ box: 2, interval: 3, due: '2026-02-01' })
  expect(listWords().find((w) => w.word === 'b')).toMatchObject({ box: 1, interval: undefined, due: undefined })
})

test('a broken due day or gap counts as missing, without rewriting the word', () => {
  const raw = { id: 'o', word: 'old', meaning: 'm', sentence: 's', savedAt: '2026-01-01T00:00:00Z', box: 2 }
  localStorage.setItem('ple.words.v1', JSON.stringify([{ ...raw, due: 'soon', interval: -1 }]))
  expect(listWords()[0]).toMatchObject({ due: undefined, interval: undefined })
  expect(JSON.parse(localStorage.getItem('ple.words.v1'))[0].due).toBe('soon')
})

describe('importWords', () => {
  const backupWord = (word, over = {}) => ({
    id: `id-${word}`,
    word,
    meaning: 'm',
    sentence: 's',
    savedAt: '2026-01-02T00:00:00Z',
    box: 2,
    ...over,
  })

  test('adds new words, newest first, with their level and review day', () => {
    saveWord(entry('here'))
    const r = importWords([
      backupWord('old', { savedAt: '2025-01-01T00:00:00Z', interval: 3, due: '2026-01-05', topic: 'git' }),
      backupWord('mid'),
    ])
    expect(r).toEqual({ ok: true, added: 2 })
    expect(listWords().map((w) => w.word)).toEqual(['here', 'mid', 'old'])
    expect(listWords()[2]).toMatchObject({ box: 2, interval: 3, due: '2026-01-05', topic: 'Git' })
  })

  test('keeps the saved copy of a word that is already here, in any letter case', () => {
    const here = saveWord(entry('callback')).word
    expect(importWords([backupWord('CALLBACK', { box: 3 })])).toEqual({ ok: true, added: 0 })
    expect(listWords()).toHaveLength(1)
    expect(listWords()[0].box).toBe(here.box)
  })

  test('skips broken entries and repeats inside the file', () => {
    const r = importWords([null, { word: 'no id' }, backupWord('x', { box: 7 }), backupWord('a'), backupWord('A', { id: 'other' })])
    expect(r).toEqual({ ok: true, added: 1 })
    expect(listWords().map((w) => w.word)).toEqual(['a'])
  })

  test('drops fields it does not know and broken review days', () => {
    importWords([backupWord('a', { extra: '<script>', due: 'soon', interval: -2 })])
    const raw = JSON.parse(localStorage.getItem('ple.words.v1'))[0]
    expect(raw).not.toHaveProperty('extra')
    expect(raw).not.toHaveProperty('due')
    expect(raw).not.toHaveProperty('interval')
  })

  test('reports a storage failure', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(importWords([backupWord('a')])).toEqual({ ok: false, added: 0 })
  })
})

test('every change tells the page, so counts can update', () => {
  const heard = vi.fn()
  window.addEventListener(WORDS_CHANGED, heard)
  const { word } = saveWord(entry('a'))
  setProgress(word.id, { box: 2 })
  deleteWord(word.id)
  window.removeEventListener(WORDS_CHANGED, heard)
  expect(heard).toHaveBeenCalledTimes(3)
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

test('skips broken entries inside an otherwise valid list', () => {
  const good = { id: 'g', word: 'good', meaning: 'm', sentence: 's', savedAt: '2026-01-01T00:00:00Z', box: 2 }
  localStorage.setItem('ple.words.v1', JSON.stringify([null, 5, { word: 'no id' }, { ...good, id: 'b', box: 9 }, good]))
  expect(listWords()).toEqual([{ ...good, topic: 'General' }])
  expect(() => hasWord('anything')).not.toThrow()
  expect(hasWord('GOOD')).toBe(true)
})

test('saving after broken entries drops them and keeps the good words', () => {
  localStorage.setItem('ple.words.v1', JSON.stringify([null]))
  expect(saveWord(entry('fresh')).ok).toBe(true)
  expect(listWords().map((w) => w.word)).toEqual(['fresh'])
})

test('saves the topic of a word', () => {
  const r = saveWord({ word: 'useState', meaning: 'm', sentence: 's', topic: 'react' })
  expect(r.word.topic).toBe('React')
  expect(listWords()[0].topic).toBe('React')
})

test('a word saved without a topic, or with an unknown one, lists as General', () => {
  saveWord(entry('plain'))
  saveWord({ ...entry('odd'), topic: 'Cooking' })
  expect(listWords().map((w) => w.topic)).toEqual(['General', 'General'])
})

test('words saved before topics existed list as General and are not rewritten', () => {
  const old = { id: 'o', word: 'old', meaning: 'm', sentence: 's', savedAt: '2026-01-01T00:00:00Z', box: 2 }
  localStorage.setItem('ple.words.v1', JSON.stringify([old]))
  expect(listWords()).toEqual([{ ...old, topic: 'General' }])
  expect(JSON.parse(localStorage.getItem('ple.words.v1'))).toEqual([old])
})
