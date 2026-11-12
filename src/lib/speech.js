// Reads a word aloud with the browser's own speech, so learners hear how to say it.
// Nothing is sent anywhere. Browsers without speech simply show no Listen button.
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'
}

export function speak(text) {
  if (!canSpeak()) return false
  const utterance = new window.SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  // A second press restarts the word instead of queueing it.
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}
