import { segmentText } from '../../shared/segments.js'

// The answer as plain text for "Copy explanation". A translation follows its English line.
const withHelp = (english, help) => (help ? `${english}\n${help}` : english)

// Each part of the user's text, then "→" and what it means.
function lineByLine(lines, text) {
  if (!lines?.length || !text) return ''
  const parts = segmentText(text)
  return lines
    .map((l) => `${parts.slice(l.from - 1, l.to).join('\n')}\n→ ${withHelp(l.plain, l.help?.plain)}`)
    .join('\n\n')
}

export function formatExplanation({ explanation, why, steps, example, words, help, lines }, text) {
  const sections = [
    ['In simple words', withHelp(explanation, help?.explanation)],
    ['Line by line', lineByLine(lines, text)],
    ['Why this happens', withHelp(why, help?.why)],
    ['What to try next', steps.map((s, i) => `${i + 1}. ${s}`).join('\n')],
    ['Practical example', example],
    ['Hard words', words.map((w) => `${w.word}: ${w.meaning}${w.help ? ` (${w.help.meaning})` : ''}`).join('\n')],
  ]
  return sections
    .filter(([, body]) => body)
    .map(([heading, body]) => `${heading}\n${body}`)
    .join('\n\n')
}
