import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
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

  test('the streak shows with the words', () => {
    seed('callback')
    localStorage.setItem('ple.practice-days.v1', JSON.stringify(['2026-01-09']))
    setup()
    expect(screen.getByRole('heading', { level: 2, name: '1-day streak' })).toBeInTheDocument()
    expect(screen.getByText('One round today makes it longer.')).toBeInTheDocument()
  })
})
