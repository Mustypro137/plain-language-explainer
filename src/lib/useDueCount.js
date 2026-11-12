import { useSyncExternalStore } from 'react'
import { dayKey } from './days.js'
import { isDue } from './practice.js'
import { WORDS_CHANGED, listWords } from './wordStore.js'

// Re-count when words change here or in another tab, and when the tab comes back
// into view (a new day may have started since).
function subscribe(onChange) {
  window.addEventListener(WORDS_CHANGED, onChange)
  window.addEventListener('storage', onChange)
  window.addEventListener('focus', onChange)
  return () => {
    window.removeEventListener(WORDS_CHANGED, onChange)
    window.removeEventListener('storage', onChange)
    window.removeEventListener('focus', onChange)
  }
}

function countDue() {
  const today = dayKey()
  return listWords().filter((w) => isDue(w, today)).length
}

// How many saved words are due for review today.
export function useDueCount() {
  return useSyncExternalStore(subscribe, countDue)
}

const countWords = () => listWords().length

// How many words are saved (the stars in the sky).
export function useWordCount() {
  return useSyncExternalStore(subscribe, countWords)
}
