export function formatExplanation({ explanation, why, steps, example, words }) {
  const sections = [
    ['In simple words', explanation],
    ['Why this happens', why],
    ['What to try next', steps.map((s, i) => `${i + 1}. ${s}`).join('\n')],
    ['Practical example', example],
    ['Hard words', words.map((w) => `${w.word}: ${w.meaning}`).join('\n')],
  ]
  return sections
    .filter(([, body]) => body)
    .map(([heading, body]) => `${heading}\n${body}`)
    .join('\n\n')
}
