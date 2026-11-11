import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { THEME_KEY } from '../lib/theme.js'
import ThemeToggle from './ThemeToggle.jsx'

const root = document.documentElement

beforeEach(() => {
  localStorage.clear()
  delete root.dataset.theme
  window.matchMedia = () => ({ matches: false })
})
afterEach(() => vi.restoreAllMocks())

test('in light mode it offers dark mode', () => {
  root.dataset.theme = 'light'
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
})

test('in dark mode it offers light mode', () => {
  root.dataset.theme = 'dark'
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
})

test('uses the device setting when the page has no theme yet', () => {
  window.matchMedia = () => ({ matches: true })
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
})

test('a press switches the page and remembers the choice', async () => {
  const user = userEvent.setup()
  root.dataset.theme = 'light'
  render(<ThemeToggle />)
  await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
  expect(root.dataset.theme).toBe('dark')
  expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
  expect(root.dataset.theme).toBe('light')
  expect(localStorage.getItem(THEME_KEY)).toBe('light')
})

test('still switches when the browser cannot save the choice', async () => {
  const user = userEvent.setup()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  root.dataset.theme = 'light'
  render(<ThemeToggle />)
  await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
  expect(root.dataset.theme).toBe('dark')
})
