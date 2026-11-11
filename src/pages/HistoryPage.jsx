import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDate } from '../lib/formatDate.js'
import { MAX_ITEMS, clearHistory, deleteHistoryItem, listHistory } from '../lib/historyStore.js'

const NAME_CHARS = 60

const firstLine = (text) => text.split('\n')[0].trim()
const shortName = (line) => (line.length > NAME_CHARS ? `${line.slice(0, NAME_CHARS)}…` : line)

export default function HistoryPage() {
  const toast = useToast()
  const [items, setItems] = useState(listHistory)

  function remove(id) {
    deleteHistoryItem(id)
    setItems(listHistory())
    toast('Deleted')
  }

  function clearAll() {
    if (!window.confirm('Delete all explanations from this browser?')) return
    clearHistory()
    setItems(listHistory())
    toast('History cleared')
  }

  return (
    <main className="page narrow-page">
      <div className="page-head">
        <div className="stack-sm">
          <h1>History</h1>
          {items.length > 0 && (
            <p className="soft">
              {items.length} {items.length === 1 ? 'explanation' : 'explanations'} kept in this browser. Only the
              newest {MAX_ITEMS} are kept.
            </p>
          )}
        </div>
        {items.length > 0 && (
          <div className="page-actions">
            <button type="button" className="btn btn-delete" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No explanations yet"
          text="Explain a text and it will be kept here, so you can read it again later."
          linkTo="/"
          linkLabel="Explain something"
        />
      ) : (
        <ul className="word-cards">
          {items.map((h) => {
            const line = firstLine(h.text)
            const name = shortName(line)
            const isError = h.result.kind === 'error'
            return (
              <li key={h.id} className="card word-card">
                <div className="word-card-text">
                  <span className={`label-chip tone-${isError ? 'coral' : 'violet'}`}>{isError ? 'Error' : 'Docs'}</span>
                  <p className="history-title">{line}</p>
                  <p className="history-snippet">{h.result.explanation}</p>
                  <time className="history-date" dateTime={h.savedAt}>
                    {formatDate(h.savedAt)}
                  </time>
                </div>
                <div className="history-actions">
                  <Link
                    className="btn btn-outline"
                    to={`/?item=${encodeURIComponent(h.id)}`}
                    aria-label={`Open explanation of: ${name}`}
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    className="btn btn-delete"
                    aria-label={`Delete explanation of: ${name}`}
                    onClick={() => remove(h.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
