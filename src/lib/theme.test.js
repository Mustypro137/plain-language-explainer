import { THEME_KEY, applyTheme, currentTheme, saveTheme } from './theme.js'

function deviceDark(isDark) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query === '(prefers-color-scheme: dark)' && isDark,
    media: query,
  }))
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  if (!window.matchMedia) window.matchMedia = () => ({ matches: false })
})
afterEach(() => vi.restoreAllMocks())

test('follows the device when nothing is saved', () => {
  deviceDark(true)
  expect(currentTheme()).toBe('dark')
  deviceDark(false)
  expect(currentTheme()).toBe('light')
})

test('a saved choice wins over the device', () => {
  deviceDark(true)
  saveTheme('light')
  expect(localStorage.getItem(THEME_KEY)).toBe('light')
  expect(currentTheme()).toBe('light')
})

test('ignores a saved value that is not a theme', () => {
  deviceDark(true)
  localStorage.setItem(THEME_KEY, 'purple')
  expect(currentTheme()).toBe('dark')
})

test('falls back to light when the browser cannot tell the device setting', () => {
  const original = window.matchMedia
  delete window.matchMedia
  try {
    expect(currentTheme()).toBe('light')
  } finally {
    window.matchMedia = original
  }
})

test('blocked storage does not throw', () => {
  deviceDark(true)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(currentTheme()).toBe('dark')
  expect(saveTheme('light')).toBe(false)
})

test('applyTheme marks the page with the theme', () => {
  applyTheme('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  applyTheme('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})
