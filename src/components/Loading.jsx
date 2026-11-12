import { useEffect, useState } from 'react'

const MAX_LINES = 6
// After this long, say why it is slow instead of leaving the user guessing.
export const SLOW_AFTER_MS = 8000

// While the AI works: the user's own lines show at once, each with a placeholder for its
// plain-English version. There is no progress bar: the answer arrives in one piece.
export default function Loading({ text }) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const shown = lines.slice(0, MAX_LINES)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="card loading" aria-busy="true">
      <p className="loading-title" role="status">
        {lines.length > 1 ? `Reading your ${lines.length} lines…` : 'Reading your text…'}
      </p>
      <ol className="loading-lines" aria-hidden="true">
        {shown.map((line, i) => (
          <li key={i} className="loading-line" style={{ '--i': i }}>
            <span className="loading-num">{String(i + 1).padStart(2, '0')}</span>
            <code className="loading-text">{line}</code>
            <span className="loading-bar" />
          </li>
        ))}
      </ol>
      {lines.length > MAX_LINES && <p className="soft loading-more">and {lines.length - MAX_LINES} more lines</p>}
      <p className="soft loading-slow" aria-live="polite">
        {slow ? 'Still working. The free AI is busy right now.' : ''}
      </p>
    </div>
  )
}
