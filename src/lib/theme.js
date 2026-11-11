// The light/dark choice. index.html has a tiny copy of currentTheme() that runs
// before the page draws, so keep the key and the rules here in step with it.
export const THEME_KEY = 'ple.theme.v1'

const THEMES = ['light', 'dark']

function savedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return THEMES.includes(value) ? value : null
  } catch {
    return null
  }
}

function deviceTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function currentTheme() {
  return savedTheme() ?? deviceTheme()
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}
