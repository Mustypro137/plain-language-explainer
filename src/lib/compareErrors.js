// Fix-it loop: what changed between the last try's error and the new one, worked out in the
// browser (no AI call). Only the lines that name the error are compared; stack lines and
// other output around them are left out.

const MAX_LINES = 5

// npm prints its own prefix on every line ("npm ERR!" before v10, "npm error" since), so the
// prefix alone says nothing: the rest of the line decides.
const NPM_PREFIX = /^npm (?:ERR!|error)\s*/i

const ERROR_LINE = [
  /^code\s+\S+/i, // (npm) code ERESOLVE
  /^(?:Uncaught\s+(?:\(in promise\)\s+)?)?[A-Za-z]*Error\b/, // TypeError: …, Uncaught ReferenceError: …
  /\b(?:errors?|fatal|failed|exception)\b/i, // fatal: …, Build failed …, Unhandled exception
]

const NOT_ERROR = [
  /^at\s/, // a stack line, even "at console.error (…)"
  /^A complete log of this run/i, // npm's pointer to its log file, different every run
]

function isErrorLine(line) {
  const rest = line.replace(NPM_PREFIX, '')
  return !NOT_ERROR.some((re) => re.test(rest)) && ERROR_LINE.some((re) => re.test(rest))
}

// The same error at another place in a file is the same error: a position after a file name
// ("App.jsx:14:22"), letter case and runs of spaces are ignored. Other numbers, like a port
// (":::3000"), still count.
const normalise = (line) =>
  line
    .replace(/(\.[A-Za-z]\w*):\d+(?::\d+)?/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

// The error lines of a text, each once, in order: Map of normalised line -> line as written.
function errorLines(text) {
  const lines = new Map()
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim()
    if (line && isErrorLine(line) && !lines.has(normalise(line))) lines.set(normalise(line), line)
  }
  return lines
}

// { gone, added } with the lines as the user pasted them; null when neither text names an error.
export function compareErrors(oldText, newText) {
  const before = errorLines(oldText)
  const after = errorLines(newText)
  if (before.size === 0 && after.size === 0) return null
  const gone = [...before].filter(([key]) => !after.has(key)).map(([, line]) => line)
  const added = [...after].filter(([key]) => !before.has(key)).map(([, line]) => line)
  return { gone: gone.slice(0, MAX_LINES), added: added.slice(0, MAX_LINES) }
}
