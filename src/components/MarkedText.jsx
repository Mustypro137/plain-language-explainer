import { useId, useState } from 'react'
import { markWords } from '../lib/markWords.js'
import WordPanel from './WordPanel.jsx'

// The user's own text with the hard words marked. A tap on one shows its meaning right
// below, where the confusion happened, with Listen and Save. Used for answers without the
// line-by-line view (kept from before it existed).
export default function MarkedText({ text, words, isSaved, onSave }) {
  const [selected, setSelected] = useState(null)
  const panelId = useId()
  const pieces = markWords(text, words)
  if (!pieces.some((p) => p.word)) return null
  // After a new answer the chosen word may not be in the list any more.
  const current = words.find((w) => w.word === selected) ?? null

  return (
    <div className="marked">
      <p className="marked-hint soft">Tap a marked word in your text to see what it means.</p>
      <div className="marked-text">
        {pieces.map((p, i) =>
          p.word ? (
            <button
              key={i}
              type="button"
              className={`mark${current === p.word ? ' mark-on' : ''}`}
              aria-expanded={current === p.word}
              aria-controls={panelId}
              onClick={() => setSelected(current === p.word ? null : p.word.word)}
            >
              {p.text}
            </button>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </div>
      <div id={panelId} className="word-panel-slot" aria-live="polite">
        {current && <WordPanel word={current} isSaved={isSaved} onSave={onSave} />}
      </div>
    </div>
  )
}
