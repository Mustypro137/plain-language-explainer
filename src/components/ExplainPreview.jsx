// Shown in the answer column before the first answer, so a new visitor knows what they will get.
const PARTS = [
  ['In simple words', 'The main idea, in short sentences and common words.'],
  ['Why this happens', 'The reason behind the error or the idea.'],
  ['What to try next', 'Steps to fix the problem. Only for error messages.'],
  ['Practical example', 'A short piece of code that shows it.'],
  ['Hard words', 'Save them, then practise them as flashcards.'],
]

export default function ExplainPreview() {
  return (
    <ul className="preview-list">
      {PARTS.map(([title, text]) => (
        <li key={title} className="preview-part">
          <span className="label-chip preview-label">{title}</span>
          <span className="soft">{text}</span>
        </li>
      ))}
    </ul>
  )
}
