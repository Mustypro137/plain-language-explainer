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

test('shows three navigation links', () => {
  renderAt('/')
  const nav = screen.getByRole('navigation', { name: 'Main' })
  expect(within(nav).getByRole('link', { name: 'Explain' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'My Words' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'Practice' })).toBeInTheDocument()
})

test.each([
  ['/', 'Paste the text you do not understand'],
  ['/words', 'My Words'],
  ['/practice', 'Practice'],
])('route %s shows its heading', (path, name) => {
  renderAt(path)
  expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument()
})
