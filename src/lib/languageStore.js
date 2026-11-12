import { findLanguage } from '../../shared/languages.js'

const KEY = 'ple.language.v1'

// The language chosen for "Help in my language", or null for English only.
export function getLanguage() {
  try {
    const code = localStorage.getItem(KEY)
    return findLanguage(code) ? code : null
  } catch {
    return null
  }
}

export function setLanguage(code) {
  try {
    if (findLanguage(code)) localStorage.setItem(KEY, code)
    else localStorage.removeItem(KEY)
  } catch {
    // The choice still applies until the page is closed.
  }
}
