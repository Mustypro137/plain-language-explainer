import { Link } from 'react-router-dom'
import { whenDue } from '../lib/days.js'
import { LEVEL_NAMES } from '../lib/sky.js'
import HelpLine from './HelpLine.jsx'
import ListenButton from './ListenButton.jsx'

// The word chosen in the Sky: everything about it in one panel.
export default function WordDetail({ word, today, sourceKept, onClose, onEdit }) {
  return (
    <aside className="card word-detail" aria-labelledby="word-detail-title">
      <div className="word-detail-top">
        <span className="mono-label">
          {word.topic} · {LEVEL_NAMES[word.box]}
        </span>
        <button type="button" className="btn btn-quiet word-detail-close" aria-label={`Close ${word.word}`} onClick={onClose}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="word-title-row">
        <h2 id="word-detail-title" className="word-detail-title">
          {word.word}
        </h2>
        <ListenButton text={word.word} />
      </div>
      <p>{word.meaning}</p>
      <HelpLine help={word.help} field="meaning" />
      {word.sentence && <p className="word-source">{word.sentence}</p>}
      <div className="brightness">
        <span className="brightness-label">How bright</span>
        <span className="brightness-bar" role="img" aria-label={`Level ${word.box} of 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= word.box ? 'on' : undefined} />
          ))}
        </span>
        <span className="soft brightness-when">Review {whenDue(word.due ?? today, today)}</span>
      </div>
      {word.note && (
        <p className="word-note">
          <span className="word-note-label">My note:</span> {word.note}
        </p>
      )}
      <div className="page-actions">
        <button id="word-detail-edit" type="button" className="btn btn-outline" onClick={onEdit}>
          Edit
        </button>
        {sourceKept && (
          <Link className="btn btn-primary" to={`/?item=${word.source}`}>
            Open the explanation
          </Link>
        )}
      </div>
    </aside>
  )
}
