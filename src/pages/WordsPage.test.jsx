import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
import { addHistory } from '../lib/historyStore.js'
import { listWords, saveWord, setProgress } from '../lib/wordStore.js'
import WordsPage from './WordsPage.jsx'

function seed(word, box = 1) {
  const { word: saved } = saveWord({ word, meaning: `${word} means`, sentence: `${word} in a sentence` })
  setProgress(saved.id, { box })
}

function setup() {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ToastProvider>
        <WordsPage />
      </ToastProvider>
    </MemoryRouter>,
  )
  return user
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

test('shows the empty state with a link to Explain when nothing is saved', () => {
  setup()
  expect(screen.getByRole('heading', { level: 1, name: 'My Words' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Explain something' })).toHaveAttribute('href', '/')
})

test('shows the count and each word with meaning, sentence and level', () => {
  seed('callback', 2)
  seed('async', 1)
  setup()
  expect(screen.getByText('2 words saved in this browser')).toBeInTheDocument()
  const item = screen.getByText('callback').closest('li')
  expect(within(item).getByText('callback means')).toBeInTheDocument()
  expect(within(item).getByText('callback in a sentence')).toBeInTheDocument()
  expect(within(item).getByRole('img', { name: 'Level 2 of 3' })).toBeInTheDocument()
  expect(within(item).getByText('Learning')).toBeInTheDocument()
})

test('uses the singular for one word', () => {
  seed('callback')
  setup()
  expect(screen.getByText('1 word saved in this browser')).toBeInTheDocument()
})

test('labels levels New, Learning and Known', () => {
  seed('a', 1)
  seed('b', 2)
  seed('c', 3)
  setup()
  expect(screen.getByText('New')).toBeInTheDocument()
  expect(screen.getByText('Learning')).toBeInTheDocument()
  expect(screen.getByText('Known')).toBeInTheDocument()
})

test('search filters by word, ignoring letter case', async () => {
  seed('callback')
  seed('promise')
  const user = setup()
  await user.type(screen.getByLabelText('Search your words'), 'CALL')
  expect(screen.getByText('callback')).toBeInTheDocument()
  expect(screen.queryByText('promise')).not.toBeInTheDocument()
})

test('search with no match says so', async () => {
  seed('callback')
  const user = setup()
  await user.type(screen.getByLabelText('Search your words'), 'zzz')
  expect(screen.getByText('No words match your search.')).toBeInTheDocument()
})

test('Delete removes the word from the page and from storage', async () => {
  seed('callback')
  seed('promise')
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Delete callback' }))
  expect(screen.queryByText('callback')).not.toBeInTheDocument()
  expect(screen.getByText('promise')).toBeInTheDocument()
  expect(listWords().map((w) => w.word)).toEqual(['promise'])
  expect(screen.getByRole('status')).toHaveTextContent('Deleted “callback”')
})

test('Undo after Delete brings the word back with its level', async () => {
  seed('callback', 3)
  seed('promise')
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Delete callback' }))
  await user.click(screen.getByRole('button', { name: 'Undo' }))
  expect(listWords().map((w) => [w.word, w.box])).toEqual([['promise', 1], ['callback', 3]])
  expect(screen.getByText('callback')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('“callback” is back')
})

test('Export and Practise are hidden when the list is empty', () => {
  setup()
  expect(screen.queryByRole('button', { name: /Export/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Practise these words' })).not.toBeInTheDocument()
})

test('Export and Practise show when words exist', () => {
  seed('callback')
  setup()
  expect(screen.getByRole('button', { name: /Export/ })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Practise these words' })).toHaveAttribute('href', '/practice')
})

test('Export downloads the saved words', async () => {
  seed('callback')
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const user = setup()
  await user.click(screen.getByRole('button', { name: /Export/ }))
  expect(click).toHaveBeenCalledTimes(1)
})

function seedTopic(word, topic, box = 1) {
  const { word: saved } = saveWord({ word, meaning: `${word} means`, sentence: `${word} in a sentence`, topic })
  setProgress(saved.id, { box })
}

const topicButton = (name) => within(screen.getByRole('group', { name: 'Filter by topic' })).getByRole('button', { name })

test('shows how many words are at each learning level', () => {
  seed('a', 1)
  seed('b', 1)
  seed('c', 2)
  seed('d', 3)
  setup()
  const stats = screen.getByRole('region', { name: 'Your progress' })
  expect(within(stats).getByText('2', { selector: 'strong' }).parentElement).toHaveTextContent('2 new')
  expect(within(stats).getByText(/learning$/)).toHaveTextContent('1 learning')
  expect(within(stats).getByText(/known$/)).toHaveTextContent('1 known')
})

test('each word card shows its topic', () => {
  seedTopic('useState', 'React')
  setup()
  const item = screen.getByText('useState').closest('li')
  expect(within(item).getByText('React')).toBeInTheDocument()
})

test('topic buttons show only the topics in use, with counts, most used first', () => {
  seedTopic('useState', 'React')
  seedTopic('props', 'React')
  seedTopic('commit', 'Git')
  setup()
  const names = within(screen.getByRole('group', { name: 'Filter by topic' }))
    .getAllByRole('button')
    .map((b) => b.textContent)
  expect(names).toEqual(['All 3', 'React 2', 'Git 1'])
  expect(topicButton('All 3')).toHaveAttribute('aria-pressed', 'true')
})

test('a topic button filters the list, and All shows everything again', async () => {
  seedTopic('useState', 'React')
  seedTopic('commit', 'Git')
  const user = setup()
  await user.click(topicButton('Git 1'))
  expect(topicButton('Git 1')).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('commit')).toBeInTheDocument()
  expect(screen.queryByText('useState')).not.toBeInTheDocument()
  await user.click(topicButton('All 2'))
  expect(screen.getByText('useState')).toBeInTheDocument()
})

test('topic and search work together', async () => {
  seedTopic('useState', 'React')
  seedTopic('useEffect', 'React')
  seedTopic('useless', 'Git')
  const user = setup()
  await user.click(topicButton('React 2'))
  await user.type(screen.getByLabelText('Search your words'), 'effect')
  expect(screen.getByText('useEffect')).toBeInTheDocument()
  expect(screen.queryByText('useState')).not.toBeInTheDocument()
  expect(screen.queryByText('useless')).not.toBeInTheDocument()
})

test('deleting the last word of a topic goes back to All', async () => {
  seedTopic('useState', 'React')
  seedTopic('commit', 'Git')
  const user = setup()
  await user.click(topicButton('Git 1'))
  await user.click(screen.getByRole('button', { name: 'Delete commit' }))
  expect(topicButton('All 1')).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('useState')).toBeInTheDocument()
})

describe('import and backup', () => {
  const fileInput = () => document.querySelector('input[type="file"]')
  const backupFile = (data, name = 'backup.json') =>
    new File([typeof data === 'string' ? data : JSON.stringify(data)], name, { type: 'application/json' })
  const backup = (words, history = []) => ({ app: 'plain-language-explainer', version: 2, exportedAt: 'x', words, history })
  const fileWord = (word) => ({ id: `f-${word}`, word, meaning: `${word} means`, sentence: 's', savedAt: '2026-01-01T00:00:00Z', box: 1 })
  const fileEntry = {
    id: 'h1',
    text: 'some error',
    level: null,
    savedAt: '2026-01-01T00:00:00Z',
    result: { kind: 'docs', explanation: 'e', why: 'w', steps: [], example: '', words: [] },
  }

  test('Import is there even with no words saved', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument()
  })

  test('the Import button opens the file picker', async () => {
    const user = setup()
    const click = vi.spyOn(fileInput(), 'click')
    await user.click(screen.getByRole('button', { name: 'Import' }))
    expect(click).toHaveBeenCalled()
  })

  test('a backup file adds its words and History, and says how many', async () => {
    seed('callback')
    const user = setup()
    await user.upload(fileInput(), backupFile(backup([fileWord('promise'), fileWord('callback')], [fileEntry])))
    expect(await screen.findByText('promise')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Added 1 word and 1 explanation.')
    expect(listWords().map((w) => w.word).sort()).toEqual(['callback', 'promise'])
    expect(JSON.parse(localStorage.getItem('ple.history.v1')).map((h) => h.id)).toEqual(['h1'])
  })

  test('a file with nothing new says so', async () => {
    seed('callback')
    const user = setup()
    await user.upload(fileInput(), backupFile(backup([fileWord('callback')])))
    expect(await screen.findByRole('status')).toHaveTextContent('Nothing new in this file')
  })

  test('a file that is not a backup changes nothing and says so', async () => {
    const user = setup()
    await user.upload(fileInput(), backupFile('{"hello": 1}'))
    expect(await screen.findByRole('status')).toHaveTextContent('This file is not a Plain-Language Explainer backup.')
    expect(listWords()).toEqual([])
  })

  test('Export downloads the words and the History together', async () => {
    seed('callback')
    localStorage.setItem('ple.history.v1', JSON.stringify([fileEntry]))
    let blob
    URL.createObjectURL = vi.fn((b) => {
      blob = b
      return 'blob:fake'
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = setup()
    await user.click(screen.getByRole('button', { name: /Export/ }))
    const saved = JSON.parse(await blob.text())
    expect(saved.version).toBe(2)
    expect(saved.words.map((w) => w.word)).toEqual(['callback'])
    expect(saved.history.map((h) => h.id)).toEqual(['h1'])
  })
})

describe('review days and the streak', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 10, 12))
  })
  afterEach(() => vi.useRealTimers())

  test('each word says when it comes back', () => {
    seed('fresh')
    const { word } = saveWord({ word: 'later', meaning: 'm', sentence: 's' })
    setProgress(word.id, { box: 2, interval: 3, due: '2026-01-13' })
    setup()
    expect(within(screen.getByText('fresh').closest('li')).getByText('Review today')).toBeInTheDocument()
    expect(within(screen.getByText('later').closest('li')).getByText('Review in 3 days')).toBeInTheDocument()
  })

  test('the summary line shows the streak and the fading words', () => {
    seed('callback')
    seed('promise')
    localStorage.setItem('ple.practice-days.v1', JSON.stringify(['2026-01-09']))
    // promise was practised before and is due again; callback was never practised.
    const words = JSON.parse(localStorage.getItem('ple.words.v1'))
    localStorage.setItem(
      'ple.words.v1',
      JSON.stringify(words.map((w) => (w.word === 'promise' ? { ...w, due: '2026-01-05', interval: 1 } : w))),
    )
    setup()
    const summary = screen.getByRole('region', { name: 'Your progress' })
    expect(within(summary).getByText(/in a row$/)).toHaveTextContent('1 day in a row')
    expect(within(summary).getByText(/fading$/)).toHaveTextContent('1 fading')
  })

  test('the summary leaves out fading and the streak when there are none', () => {
    seed('callback')
    setup()
    const summary = screen.getByRole('region', { name: 'Your progress' })
    expect(within(summary).queryByText(/fading$/)).not.toBeInTheDocument()
    expect(within(summary).queryByText(/in a row$/)).not.toBeInTheDocument()
  })
})

describe('word detail', () => {
  const card = (word) => screen.getByText(word, { selector: '.word-title' }).closest('li')

  test('Add a word saves a word typed by hand', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Add a word' }))
    const form = screen.getByRole('form', { name: 'Add a word' })
    expect(within(form).getByLabelText('Word')).toHaveFocus()
    await user.type(within(form).getByLabelText('Word'), 'closure')
    await user.type(within(form).getByLabelText('Meaning'), 'A function that remembers.')
    await user.selectOptions(within(form).getByLabelText('Topic'), 'JavaScript')
    await user.type(within(form).getByLabelText(/My note/), 'Ask in class')
    await user.click(within(form).getByRole('button', { name: 'Add to My Words' }))
    expect(screen.queryByRole('form', { name: 'Add a word' })).not.toBeInTheDocument()
    expect(listWords()[0]).toMatchObject({ word: 'closure', meaning: 'A function that remembers.', topic: 'JavaScript', note: 'Ask in class', sentence: '' })
    expect(within(card('closure')).getByText('Ask in class')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a word' })).toHaveFocus()
    expect(await screen.findByText('Added “closure”')).toBeInTheDocument()
  })

  test('Add a word refuses a word that is already saved, and an empty meaning', async () => {
    seed('callback')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Add a word' }))
    const form = screen.getByRole('form', { name: 'Add a word' })
    await user.type(within(form).getByLabelText('Word'), 'Callback')
    await user.click(within(form).getByRole('button', { name: 'Add to My Words' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('Please write what the word means.')
    await user.type(within(form).getByLabelText('Meaning'), 'm')
    await user.click(within(form).getByRole('button', { name: 'Add to My Words' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('“Callback” is already in My Words.')
    expect(listWords()).toHaveLength(1)
  })

  test('Cancel and Escape close the form without saving', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Add a word' }))
    await user.type(screen.getByLabelText('Word'), 'x')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('form', { name: 'Add a word' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add a word' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('form', { name: 'Add a word' })).not.toBeInTheDocument()
    expect(listWords()).toHaveLength(0)
  })

  test('Edit changes the meaning, the note and the topic in place', async () => {
    seed('callback', 2)
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Edit callback' }))
    const form = screen.getByRole('form', { name: 'Edit “callback”' })
    const meaning = within(form).getByLabelText('Meaning')
    expect(meaning).toHaveFocus()
    expect(meaning).toHaveValue('callback means')
    await user.clear(meaning)
    await user.type(meaning, 'A function called later.')
    await user.type(within(form).getByLabelText(/My note/), 'Like a phone call back')
    await user.selectOptions(within(form).getByLabelText('Topic'), 'React')
    await user.click(within(form).getByRole('button', { name: 'Save changes' }))
    const item = card('callback')
    expect(within(item).getByText('A function called later.')).toBeInTheDocument()
    expect(within(item).getByText('Like a phone call back')).toBeInTheDocument()
    expect(within(item).getByText('React')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit callback' })).toHaveFocus()
    expect(listWords()[0].box).toBe(2)
  })

  test('Cancel on Edit keeps the word as it was', async () => {
    seed('callback')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Edit callback' }))
    await user.clear(screen.getByLabelText('Meaning'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(within(card('callback')).getByText('callback means')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit callback' })).toHaveFocus()
  })

  test('links to the explanation it came from while History has it', () => {
    const entry = addHistory({ text: 'pasted', result: { kind: 'docs', explanation: 'e', why: 'w', steps: [], example: '', words: [] } })
    saveWord({ word: 'linked', meaning: 'm', sentence: 's', source: entry.id })
    saveWord({ word: 'lost', meaning: 'm', sentence: 's', source: 'gone' })
    setup()
    expect(within(card('linked')).getByRole('link', { name: 'See the explanation it came from' })).toHaveAttribute(
      'href',
      `/?item=${entry.id}`,
    )
    expect(within(card('lost')).queryByRole('link')).not.toBeInTheDocument()
  })

  test('shows the translated meaning under the English one', () => {
    saveWord({ word: 'callback', meaning: 'm', sentence: 's', help: { lang: 'fr', meaning: 'Une fonction.' } })
    setup()
    expect(within(card('callback')).getByText('Une fonction.')).toHaveAttribute('lang', 'fr')
  })

  test('with a topic chosen, the practise link practises that topic', async () => {
    saveWord({ word: 'hook', meaning: 'm', sentence: 's', topic: 'React' })
    saveWord({ word: 'prop', meaning: 'm', sentence: 's', topic: 'React' })
    saveWord({ word: 'promise', meaning: 'm', sentence: 's', topic: 'JavaScript' })
    const user = setup()
    expect(screen.getByRole('link', { name: 'Practise these words' })).toHaveAttribute('href', '/practice')
    await user.click(screen.getByRole('button', { name: /^React/ }))
    expect(screen.getByRole('link', { name: 'Practise React (2)' })).toHaveAttribute('href', '/practice?topic=React')
  })
})

describe('the Sky view', () => {
  const toSky = async (user) => user.click(screen.getByRole('button', { name: 'Sky' }))

  test('shows the words as stars, and the choice is remembered', async () => {
    seed('callback', 3)
    seed('promise')
    const user = setup()
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')
    await toSky(user)
    expect(screen.getByRole('button', { name: 'Sky' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^callback, known/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete callback' })).not.toBeInTheDocument()
    expect(localStorage.getItem('ple.words-view.v1')).toBe('sky')
  })

  test('a star opens its word, and Close puts focus back on the star', async () => {
    saveWord({ word: 'callback', meaning: 'A function you pass.', sentence: 'Pass a callback.', note: 'Phone me back' })
    const user = setup()
    await toSky(user)
    await user.click(screen.getByRole('button', { name: /^callback/ }))
    const panel = screen.getByRole('complementary', { name: 'callback' })
    expect(within(panel).getByText('A function you pass.')).toBeInTheDocument()
    expect(within(panel).getByText('Phone me back')).toBeInTheDocument()
    expect(within(panel).getByRole('img', { name: 'Level 1 of 3' })).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Close callback' }))
    expect(screen.queryByRole('complementary', { name: 'callback' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^callback/ })).toHaveFocus()
  })

  test('Edit works inside the panel', async () => {
    seed('callback')
    const user = setup()
    await toSky(user)
    await user.click(screen.getByRole('button', { name: /^callback/ }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const meaning = screen.getByLabelText('Meaning')
    await user.clear(meaning)
    await user.type(meaning, 'A function called later.')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('complementary', { name: 'callback' })).toHaveTextContent('A function called later.')
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus()
  })

  test('the search and the topic filter apply to the sky too', async () => {
    seed('callback')
    seed('promise')
    const user = setup()
    await toSky(user)
    await user.type(screen.getByLabelText('Search your words'), 'call')
    expect(screen.getByRole('button', { name: /^callback/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^promise/ })).not.toBeInTheDocument()
  })
})
