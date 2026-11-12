import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

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
  ['/', 'Paste the text you do not understand'],
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

test('the app name in the top bar links to the Explain page', () => {
  renderAt('/words')
  expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Plain-Language Explainer' })).toHaveAttribute(
    'href',
    '/',
  )
})

test('the top bar has the light/dark switch', () => {
  renderAt('/')
  expect(screen.getByRole('banner')).toContainElement(screen.getByRole('button', { name: /^Switch to (dark|light) mode$/ }))
})
