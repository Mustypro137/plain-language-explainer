export function wordsToJson(words) {
  return JSON.stringify(
    { app: 'plain-language-explainer', version: 1, exportedAt: new Date().toISOString(), words },
    null,
    2,
  )
}

export function exportFileName(date) {
  return `my-words-${date.toISOString().slice(0, 10)}.json`
}

export function downloadWords(words) {
  const url = URL.createObjectURL(new Blob([wordsToJson(words)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(new Date())
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
