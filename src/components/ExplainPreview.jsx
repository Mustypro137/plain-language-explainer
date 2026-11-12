// Shown in the answer column before the first answer, so a new visitor knows what they will get.
const PARTS = [
  ['sunshine', 'In simple words', 'The main idea, in short sentences and common words.'],
  ['coral', 'Why this happens', 'The reason behind the error or the idea.'],
  ['teal', 'What to try next', 'Steps to fix the problem. Only for error messages.'],
  ['violet', 'Practical example', 'A short piece of code that shows it.'],
  ['ink', 'Hard words', 'Save them, then practise them as flashcards.'],
]

export default function ExplainPreview() {
  return (
    <ul className="preview-list">
      {PARTS.map(([tone, title, text]) => (
        <li key={title} className="preview-part">
          <span className={`label-chip tone-${tone}`}>{title}</span>
          <span className="soft">{text}</span>
        </li>
      ))}
    </ul>
  )
}
