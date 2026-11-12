import { useId, useState } from 'react'
import WordPanel from './WordPanel.jsx'

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z'

// The hard words as a short row of chips, for answers with line by line (where the words
// are already dotted in the text). A tap opens the meaning with Listen and Save; a saved
// word carries a small star.
export default function WordChips({ words, isSaved, onSave }) {
  const [selected, setSelected] = useState(null)
  const panelId = useId()
  const current = words.find((w) => w.word === selected) ?? null

  return (
    <div className="word-chips-wrap">
      <p className="soft word-chips-hint">Tap a word for its meaning, then save it.</p>
      <ul className="word-chips">
        {words.map((w) => {
          const on = current === w
          const saved = isSaved(w)
          return (
            <li key={w.word}>
              <button
                type="button"
                className={`word-chip${saved ? ' word-chip-saved' : ''}${on ? ' word-chip-on' : ''}`}
                aria-expanded={on}
                aria-controls={panelId}
                onClick={() => setSelected(on ? null : w.word)}
              >
                {saved && (
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d={STAR} />
                  </svg>
                )}
                {w.word}
                {saved && <span className="visually-hidden">, saved</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <div id={panelId} className="word-panel-slot" aria-live="polite">
        {current && <WordPanel word={current} isSaved={isSaved} onSave={onSave} />}
      </div>
    </div>
  )
}
