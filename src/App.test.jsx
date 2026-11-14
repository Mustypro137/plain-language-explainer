import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { saveWord } from './lib/wordStore.js'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

test('shows four navigation links', () => {
  renderAt('/')
  const nav = screen.getByRole('navigation', { name: 'Main' })
  expect(within(nav).getByRole('link', { name: 'Explain' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'My Words' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'Practice' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'History' })).toHaveAttribute('href', '/history')
  expect(within(nav).getAllByRole('link')).toHaveLength(4)
})

test.each([
  ['/', /^Paste what you don’t understand\. Read it line by line/],
  ['/words', 'My Words'],
  ['/practice', 'Practice'],
  ['/history', 'History'],
])('route %s shows its heading', (path, name) => {
  renderAt(path)
  expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument()
})

test.each([
  ['/', 'Plain-Language Explainer'],
  ['/words', 'My Words · Plain-Language Explainer'],
  ['/practice', 'Practice · Plain-Language Explainer'],
  ['/history', 'History · Plain-Language Explainer'],
  ['/no-such-page', 'Page not found · Plain-Language Explainer'],
])('route %s names itself in the browser tab', (path, title) => {
  renderAt(path)
  expect(document.title).toBe(title)
})

test('an unknown address shows Page not found with a way back', () => {
  renderAt('/no-such-page')
  expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go to Explain' })).toHaveAttribute('href', '/')
})

test('only the Page not found screen asks search engines not to keep it', () => {
  const { unmount } = renderAt('/no-such-page')
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  unmount()
  renderAt('/')
  expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
})

test('the app name in the top bar links to the Explain page', () => {
  renderAt('/words')
  expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Plain-Language Explainer' })).toHaveAttribute(
    'href',
    '/',
  )
})

describe('due words on the Practice link', () => {
  const word = (id, due) => ({ id, word: id, meaning: 'm', sentence: 's', savedAt: '2026-01-01T00:00:00Z', box: 1, due })
  const practiceLink = () => within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: /^Practice/ })

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 10, 12))
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  test('shows how many words are due today', () => {
    localStorage.setItem('ple.words.v1', JSON.stringify([word('a', '2026-01-09'), word('b', undefined), word('c', '2026-01-11')]))
    renderAt('/')
    expect(practiceLink()).toHaveAccessibleName('Practice, 2 due')
  })

  test('shows no count when nothing is due', () => {
    localStorage.setItem('ple.words.v1', JSON.stringify([word('a', '2026-01-11')]))
    renderAt('/')
    expect(practiceLink()).toHaveAccessibleName('Practice')
  })

  test('updates at once when a word is saved', async () => {
    renderAt('/')
    expect(practiceLink()).toHaveAccessibleName('Practice')
    act(() => {
      saveWord({ word: 'callback', meaning: 'm', sentence: 's' })
    })
    expect(practiceLink()).toHaveAccessibleName('Practice, 1 due')
  })
})

test('the top bar has the light/dark switch', () => {
  renderAt('/')
  expect(screen.getByRole('banner')).toContainElement(screen.getByRole('button', { name: /^Switch to (dark|light) mode$/ }))
})
