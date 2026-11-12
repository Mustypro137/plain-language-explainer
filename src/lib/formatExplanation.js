// The answer as plain text for "Copy explanation". A translation follows its English line.
const withHelp = (english, help) => (help ? `${english}\n${help}` : english)

export function formatExplanation({ explanation, why, steps, example, words, help }) {
  const sections = [
    ['In simple words', withHelp(explanation, help?.explanation)],
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
