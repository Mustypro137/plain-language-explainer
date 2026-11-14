import { segmentText } from '../../shared/segments.js'

// A first guess at what was pasted, shown under the box before anything is sent:
// "Looks like an npm error · 6 lines". Worked out here, with no AI call; the AI decides
// for real. The order matters: the most specific kind wins.
const KINDS = [
  [/\bnpm (ERR!|error)/i, 'an npm error'],
  [/^\s*Traceback \(most recent call last\)|^\s*File ".+", line \d+/m, 'a Python error'],
  [/\b(TypeError|ReferenceError|SyntaxError|RangeError|Uncaught)\b|^\s*at .+:\d+:\d+\)?\s*$/m, 'a JavaScript error'],
  [/\b(error|exception|failed|fatal|cannot|could not)\b/i, 'an error message'],
]

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export function describeText(text) {
  if (!text.trim()) return null
  const kind = KINDS.find(([re]) => re.test(text))?.[1] ?? 'documentation'
  const lines = text.split('\n').filter((l) => l.trim()).length
  // One paragraph is counted in sentences, as line by line will split it.
  const size = lines > 1 ? plural(lines, 'line') : plural(segmentText(text).length, 'sentence')
  return `Looks like ${kind} · ${size}`
}
