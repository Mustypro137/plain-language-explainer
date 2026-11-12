import { askAbout, explainText } from './explainText.js'
import { formatExplanation } from './formatExplanation.js'
import {
  MAX_FOLLOW_UPS,
  addFollowUp,
  addHistory,
  findHistory,
  followUpsOf,
  getHistoryItem,
  languageOf,
  listHistory,
} from './historyStore.js'
import { getLanguage, setLanguage } from './languageStore.js'
import { blankOut } from './markWords.js'
import { importWords, listWords, saveWord, updateWord } from './wordStore.js'

const result = (over = {}) => ({
  kind: 'docs',
  explanation: 'Simple words.',
  why: 'A reason.',
  steps: [],
  example: '',
  words: [{ word: 'callback', meaning: 'A function you pass.', sentence: 'Pass a callback.' }],
  ...over,
})

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubFetch(status, body) {
  const fn = vi.fn().mockResolvedValue({ status, ok: status === 200, json: async () => body })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('requests', () => {
  test('explainText sends the language only when there is one', async () => {
    const fetchFn = stubFetch(200, result())
    await explainText('hi', null, 'es')
    await explainText('hi', 'simpler', null)
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ text: 'hi', language: 'es' })
    expect(JSON.parse(fetchFn.mock.calls[1][1].body)).toEqual({ text: 'hi', level: 'simpler' })
  })

  test('askAbout posts the question to /api/ask', async () => {
    const fetchFn = stubFetch(200, { answer: 'A.' })
    const r = await askAbout({ text: 't', explanation: 'e', question: 'q?' })
    expect(r).toEqual({ ok: true, data: { answer: 'A.' } })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('/api/ask')
    expect(JSON.parse(init.body)).toEqual({ text: 't', explanation: 'e', question: 'q?' })
  })

  test('askAbout sends earlier questions without their translations', async () => {
    const fetchFn = stubFetch(200, { answer: 'A.' })
    await askAbout({
      text: 't',
      explanation: 'e',
      question: 'q2',
      earlier: [{ question: 'q1', answer: 'a1', help: { lang: 'es', answer: 'b1' } }],
      language: 'es',
    })
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({
      text: 't',
      explanation: 'e',
      question: 'q2',
      earlier: [{ question: 'q1', answer: 'a1' }],
      language: 'es',
    })
  })

  test('askAbout reports the firewall limit like explainText', async () => {
    stubFetch(429, {})
    expect(await askAbout({ text: 't', explanation: 'e', question: 'q' })).toEqual({
      ok: false,
      error: 'busy',
      retryAfter: 60,
      limit: 'visitor',
    })
  })

  test('a bad_question answer is passed on', async () => {
    stubFetch(400, { error: 'bad_question' })
    expect(await askAbout({ text: 't', explanation: 'e', question: '' })).toEqual({ ok: false, error: 'bad_question' })
  })
})

describe('language choice', () => {
  test('is English only at first, and remembered once chosen', () => {
    expect(getLanguage()).toBeNull()
    setLanguage('es')
    expect(getLanguage()).toBe('es')
    setLanguage(null)
    expect(getLanguage()).toBeNull()
  })

  test('an unknown stored value counts as English only', () => {
    localStorage.setItem('ple.language.v1', 'klingon')
    expect(getLanguage()).toBeNull()
  })

  test('a blocked localStorage is not an error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setLanguage('es')).not.toThrow()
    expect(getLanguage()).toBeNull()
  })
})

describe('History with languages and follow-ups', () => {
  const help = { lang: 'es', explanation: 'Sencillo.', why: 'Porque.' }

  test('keeps the language, and findHistory matches it', () => {
    addHistory({ text: 't', result: result({ help }), level: null, language: 'es' })
    expect(languageOf(listHistory()[0])).toBe('es')
    expect(findHistory('t', null, 'es')).toBeTruthy()
    expect(findHistory('t', null, null)).toBeUndefined()
    expect(findHistory('t', null, 'fr')).toBeUndefined()
  })

  test('older entries without a language count as English only', () => {
    addHistory({ text: 't', result: result() })
    const raw = JSON.parse(localStorage.getItem('ple.history.v1'))
    delete raw[0].language
    localStorage.setItem('ple.history.v1', JSON.stringify(raw))
    expect(findHistory('t', null, null)).toBeTruthy()
  })

  test('the same text explained again keeps its id', () => {
    const first = addHistory({ text: 't', result: result() })
    addHistory({ text: 'other', result: result() })
    const again = addHistory({ text: 't', result: result({ explanation: 'New.' }), level: 'simpler' })
    expect(again.id).toBe(first.id)
    expect(listHistory()).toHaveLength(2)
    expect(getHistoryItem(first.id).result.explanation).toBe('New.')
  })

  test('an entry with a broken translation or language is dropped on read', () => {
    addHistory({ text: 'a', result: result() })
    const good = JSON.parse(localStorage.getItem('ple.history.v1'))[0]
    localStorage.setItem(
      'ple.history.v1',
      JSON.stringify([
        good,
        { ...good, id: 'b', text: 'b', result: result({ help: { lang: 'es', explanation: 'x' } }) },
        { ...good, id: 'c', text: 'c', language: 'xx' },
        { ...good, id: 'd', text: 'd', followUps: [{ question: 'q' }] },
        { ...good, id: 'e', text: 'e', result: result({ words: [{ ...result().words[0], help: 'no' }] }) },
      ]),
    )
    expect(listHistory().map((h) => h.text)).toEqual(['a'])
  })

  test('follow-ups are kept with the entry, up to the limit', () => {
    const item = addHistory({ text: 't', result: result() })
    expect(followUpsOf(item)).toEqual([])
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) expect(addFollowUp(item.id, { question: `q${i}`, answer: `a${i}` })).toBe(true)
    expect(addFollowUp(item.id, { question: 'one more', answer: 'no' })).toBe(false)
    expect(followUpsOf(getHistoryItem(item.id)).map((f) => f.question)).toEqual(['q0', 'q1', 'q2'])
  })

  test('a follow-up keeps its translation, and odd ones are refused', () => {
    const item = addHistory({ text: 't', result: result() })
    expect(addFollowUp(item.id, { question: 'q', answer: 'a', help: { lang: 'es', answer: 'b' }, extra: 1 })).toBe(true)
    expect(addFollowUp(item.id, { question: 'q' })).toBe(false)
    expect(addFollowUp('gone', { question: 'q', answer: 'a' })).toBe(false)
    expect(followUpsOf(getHistoryItem(item.id))).toEqual([{ question: 'q', answer: 'a', help: { lang: 'es', answer: 'b' } }])
  })

  test('a new answer for the text starts without the old follow-ups', () => {
    const item = addHistory({ text: 't', result: result() })
    addFollowUp(item.id, { question: 'q', answer: 'a' })
    addHistory({ text: 't', result: result(), level: 'simpler' })
    expect(followUpsOf(getHistoryItem(item.id))).toEqual([])
  })
})

describe('words with translation, note and source', () => {
  const help = { lang: 'es', meaning: 'Una función.' }

  test('saveWord keeps the translation, the source and a note', () => {
    saveWord({ word: 'callback', meaning: 'm', sentence: 's', help, source: 'h1', note: '  remember me  ' })
    const [w] = listWords()
    expect(w.help).toEqual(help)
    expect(w.source).toBe('h1')
    expect(w.note).toBe('remember me')
  })

  test('a word added by hand needs no sentence', () => {
    expect(saveWord({ word: 'mine', meaning: 'm' }).ok).toBe(true)
    expect(listWords()[0].sentence).toBe('')
  })

  test('broken extras are left out when listing', () => {
    saveWord({ word: 'callback', meaning: 'm', sentence: 's' })
    const raw = JSON.parse(localStorage.getItem('ple.words.v1'))
    raw[0] = { ...raw[0], help: { lang: 'es' }, note: 42, source: '' }
    localStorage.setItem('ple.words.v1', JSON.stringify(raw))
    const [w] = listWords()
    expect(w.help).toBeUndefined()
    expect(w.note).toBeUndefined()
    expect(w.source).toBeUndefined()
  })

  test('updateWord changes the meaning, note and topic', () => {
    const { word } = saveWord({ word: 'callback', meaning: 'old', sentence: 's', help, note: 'n' })
    expect(updateWord(word.id, { meaning: ' new ', note: '', topic: 'react' })).toBe(true)
    const [w] = listWords()
    expect(w.meaning).toBe('new')
    expect(w.topic).toBe('React')
    expect(w.note).toBeUndefined()
    // The translation was of the old meaning.
    expect(w.help).toBeUndefined()
    expect(w.box).toBe(1)
  })

  test('updateWord keeps the translation when the meaning stays', () => {
    const { word } = saveWord({ word: 'callback', meaning: 'same', sentence: 's', help })
    updateWord(word.id, { meaning: 'same', note: 'mine', topic: 'General' })
    expect(listWords()[0]).toMatchObject({ help, note: 'mine' })
  })

  test('updateWord refuses an empty meaning or an unknown word', () => {
    const { word } = saveWord({ word: 'callback', meaning: 'm', sentence: 's' })
    expect(updateWord(word.id, { meaning: '  ', note: '', topic: 'General' })).toBe(false)
    expect(updateWord('nope', { meaning: 'x', note: '', topic: 'General' })).toBe(false)
    expect(listWords()[0].meaning).toBe('m')
  })

  test('importWords keeps valid extras', () => {
    importWords([
      { id: 'a', word: 'alpha', meaning: 'm', sentence: 's', savedAt: '2026-01-01T00:00:00Z', box: 2, help, note: 'n', source: 'h' },
    ])
    expect(listWords()[0]).toMatchObject({ help, note: 'n', source: 'h' })
  })
})

describe('blankOut', () => {
  test('hides every use of the word, ignoring letter case', () => {
    expect(blankOut('A Callback runs a callback.', 'callback')).toEqual([
      { text: 'A ' },
      { blank: true, text: 'Callback' },
      { text: ' runs a ' },
      { blank: true, text: 'callback' },
      { text: '.' },
    ])
  })

  test('null when the sentence does not use the word as saved', () => {
    expect(blankOut('Read the properties.', 'property')).toBeNull()
    expect(blankOut('', 'callback')).toBeNull()
  })
})

describe('copying an answer with a translation', () => {
  test('puts each translation after its English line', () => {
    const text = formatExplanation(
      result({
        help: { lang: 'es', explanation: 'Sencillo.', why: 'Porque.' },
        words: [{ word: 'callback', meaning: 'A function.', sentence: 's', help: { lang: 'es', meaning: 'Una función.' } }],
      }),
    )
    expect(text).toContain('In simple words\nSimple words.\nSencillo.')
    expect(text).toContain('Why this happens\nA reason.\nPorque.')
    expect(text).toContain('callback: A function. (Una función.)')
  })
})
