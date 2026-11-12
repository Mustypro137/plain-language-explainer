import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
import { listHistory } from '../lib/historyStore.js'
import HistoryPage from './HistoryPage.jsx'

const mk = (id, text, kind, savedAt) => ({
  id,
  text,
  savedAt,
  result: {
    kind,
    explanation: `${id} in simple words`,
    why: 'A reason.',
    steps: kind === 'error' ? ['Try this'] : [],
    example: '',
    words: [],
  },
})

const two = () =>
  localStorage.setItem(
    'ple.history.v1',
    JSON.stringify([
      mk('new', 'useEffect is a React Hook.', 'docs', '2026-06-15T12:00:00.000Z'),
      mk('old', "TypeError: x is not a function\n    at App (App.jsx:3:1)", 'error', '2026-06-14T12:00:00.000Z'),
    ]),
  )

function setup() {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ToastProvider>
        <HistoryPage />
      </ToastProvider>
    </MemoryRouter>,
  )
  return user
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

test('shows the empty state when nothing is kept', () => {
  setup()
  expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'No explanations yet' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Explain something' })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
})

test('says how many explanations are kept and where', () => {
  two()
  setup()
  expect(screen.getByText('2 explanations kept in this browser. Only the newest 50 are kept.')).toBeInTheDocument()
})

test('uses the singular for one explanation', () => {
  localStorage.setItem('ple.history.v1', JSON.stringify([mk('a', 'one', 'docs', '2026-06-15T12:00:00.000Z')]))
  setup()
  expect(screen.getByText(/^1 explanation kept in this browser\./)).toBeInTheDocument()
})

test('lists each explanation, newest first, with its kind, first line and date', () => {
  two()
  setup()
  const cards = screen.getAllByRole('listitem')
  expect(cards).toHaveLength(2)
  expect(within(cards[0]).getByText('Docs')).toBeInTheDocument()
  expect(within(cards[0]).getByText('useEffect is a React Hook.')).toBeInTheDocument()
  expect(within(cards[0]).getByText('new in simple words')).toBeInTheDocument()
  expect(cards[0].querySelector('time')).toHaveAttribute('datetime', '2026-06-15T12:00:00.000Z')
  expect(within(cards[1]).getByText('Error')).toBeInTheDocument()
  expect(within(cards[1]).getByText('TypeError: x is not a function')).toBeInTheDocument()
  expect(within(cards[1]).queryByText(/at App/)).not.toBeInTheDocument()
})

test('Open links to the Explain page with that entry', () => {
  two()
  setup()
  expect(
    screen.getByRole('link', { name: 'Open explanation of: TypeError: x is not a function' }),
  ).toHaveAttribute('href', '/?item=old')
})

test('Delete removes only that explanation', async () => {
  two()
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Delete explanation of: TypeError: x is not a function' }))
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  expect(listHistory().map((h) => h.id)).toEqual(['new'])
  expect(screen.getByRole('status')).toHaveTextContent('Explanation deleted')
})

test('Undo after Delete brings the explanation back in its place', async () => {
  two()
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Delete explanation of: useEffect is a React Hook.' }))
  await user.click(screen.getByRole('button', { name: 'Undo' }))
  expect(listHistory().map((h) => h.id)).toEqual(['new', 'old'])
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByRole('status')).toHaveTextContent('Brought back')
})

test('Clear all removes everything at once, with no dialog, and offers Undo', async () => {
  two()
  const confirm = vi.spyOn(window, 'confirm')
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Clear all' }))
  expect(confirm).not.toHaveBeenCalled()
  expect(listHistory()).toEqual([])
  expect(screen.getByRole('heading', { level: 2, name: 'No explanations yet' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('History cleared')
  expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
})

test('Undo after Clear all brings every explanation back', async () => {
  two()
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Clear all' }))
  await user.click(screen.getByRole('button', { name: 'Undo' }))
  expect(listHistory().map((h) => h.id)).toEqual(['new', 'old'])
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})

test('a very long first line is shortened in the button names', () => {
  localStorage.setItem(
    'ple.history.v1',
    JSON.stringify([mk('a', 'x'.repeat(200), 'docs', '2026-06-15T12:00:00.000Z')]),
  )
  setup()
  expect(screen.getByRole('link', { name: `Open explanation of: ${'x'.repeat(60)}…` })).toBeInTheDocument()
})
