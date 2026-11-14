import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
import { listHistory } from '../lib/historyStore.js'
import { saveWord } from '../lib/wordStore.js'
import HistoryPage, { dayLabel, groupByDay } from './HistoryPage.jsx'

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

describe('grouped by day', () => {
  test('dayLabel says Today, Yesterday, the day, or the date with its year', () => {
    expect(dayLabel('2026-11-12', '2026-11-12')).toBe('Today')
    expect(dayLabel('2026-11-11', '2026-11-12')).toBe('Yesterday')
    expect(dayLabel('2026-11-09', '2026-11-12')).toBe('Monday 9 November')
    expect(dayLabel('2025-12-30', '2026-01-02')).toBe('30 December 2025')
  })

  test('groupByDay keeps the newest first, one group per day', () => {
    const at = (id, iso) => ({ id, savedAt: iso })
    const groups = groupByDay(
      [at('c', '2026-11-12T15:00:00'), at('b', '2026-11-12T09:00:00'), at('a', '2026-11-10T09:00:00')],
      '2026-11-12',
    )
    expect(groups.map((g) => [g.label, g.items.map((h) => h.id)])).toEqual([
      ['Today', ['c', 'b']],
      ['Tuesday 10 November', ['a']],
    ])
  })

  test('the page shows a heading per day and the details of each entry', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    localStorage.setItem(
      'ple.history.v1',
      JSON.stringify([
        { ...mk('new', 'today text', 'error', now.toISOString()), level: 'simpler', language: 'es', followUps: [{ question: 'q', answer: 'a' }], check: { right: 2, total: 3 } },
        mk('old', 'older text', 'docs', yesterday.toISOString()),
      ]),
    )
    saveWord({ word: 'callback', meaning: 'm', sentence: 's', source: 'new' })
    setup()
    expect(screen.getByRole('heading', { level: 2, name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Yesterday' })).toBeInTheDocument()
    expect(screen.getByText('Simpler · in Spanish · 1 question · 1 word saved · Checked 2 of 3')).toBeInTheDocument()
  })

  test('search keeps only the entries that match, by text or explanation', async () => {
    two()
    const user = setup()
    await user.type(screen.getByLabelText('Search History'), 'typeerror')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await user.clear(screen.getByLabelText('Search History'))
    await user.type(screen.getByLabelText('Search History'), 'new in simple')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await user.type(screen.getByLabelText('Search History'), 'zzz')
    expect(screen.getByText('Nothing in History matches your search.')).toBeInTheDocument()
  })
})

test('a later try says which try it is, and a solved one says so', () => {
  const now = Date.now()
  const at = (s) => new Date(now - s * 1000).toISOString()
  localStorage.setItem(
    'ple.history.v1',
    JSON.stringify([
      { ...mk('c', 'third error', 'error', at(1)), after: 'b', solved: true },
      { ...mk('b', 'second error', 'error', at(2)), after: 'a' },
      mk('a', 'first error', 'error', at(3)),
    ]),
  )
  setup()
  expect(screen.getByText('Try 3 · Solved')).toBeInTheDocument()
  expect(screen.getByText('Try 2')).toBeInTheDocument()
})
