// A backup file holds the saved words and the History, so they can move to another
// browser or device. Version 1 files (words only, from the old Export) can still be read.
const APP = 'plain-language-explainer'
const VERSION = 2

// localStorage holds about 5 MB in most browsers; a bigger file cannot be a real backup.
export const MAX_FILE_BYTES = 5_000_000

export function backupToJson({ words, history }) {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: new Date().toISOString(), words, history }, null, 2)
}

export function backupFileName(date) {
  return `plain-language-backup-${date.toISOString().slice(0, 10)}.json`
}

export function downloadBackup(data) {
  const url = URL.createObjectURL(new Blob([backupToJson(data)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName(new Date())
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// The lists from a backup file, or null if the text is not one. Each word and History entry
// is checked again by its store before it is saved.
export function readBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || data.app !== APP || ![1, VERSION].includes(data.version) || !Array.isArray(data.words)) return null
  return { words: data.words, history: Array.isArray(data.history) ? data.history : [] }
}
