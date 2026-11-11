import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
import { listWords, saveWord, setBox } from '../lib/wordStore.js'
import WordsPage from './WordsPage.jsx'

function seed(word, box = 1) {
  const { word: saved } = saveWord({ word, meaning: `${word} means`, sentence: `${word} in a sentence` })
  setBox(saved.id, box)
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
  expect(screen.getByRole('status')).toHaveTextContent('Deleted')
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
