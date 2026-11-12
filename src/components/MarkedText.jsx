import { useId, useState } from 'react'
import { markWords } from '../lib/markWords.js'
import HelpLine from './HelpLine.jsx'
import ListenButton from './ListenButton.jsx'

// The user's own text with the hard words marked. A tap on one shows its meaning right
// below, where the confusion happened, with Listen and Save.
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
        {current && (
          <div className="word-panel">
            <div className="word-panel-head">
              <span className="word-name">{current.word}</span>
              <ListenButton text={current.word} />
            </div>
            <p>{current.meaning}</p>
            <HelpLine help={current.help} field="meaning" />
            <button
              type="button"
              className="btn btn-outline"
              disabled={isSaved(current)}
              aria-label={`${isSaved(current) ? 'Saved' : 'Save'} ${current.word} to My Words`}
              onClick={() => onSave(current)}
            >
              {isSaved(current) ? 'Saved' : 'Save to My Words'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
