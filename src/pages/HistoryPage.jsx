import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../components/Toast.jsx'
import { addDays, dayKey, toDate } from '../lib/days.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import {
  MAX_ITEMS,
  clearHistory,
  deleteHistoryItem,
  chainLength,
  followUpsOf,
  languageOf,
  levelOf,
  listHistory,
  restoreHistory,
} from '../lib/historyStore.js'
import { listWords } from '../lib/wordStore.js'
import { findLanguage } from '../../shared/languages.js'

const NAME_CHARS = 60

const firstLine = (text) => text.split('\n')[0].trim()
const shortName = (line) => (line.length > NAME_CHARS ? `${line.slice(0, NAME_CHARS)}…` : line)

const LEVEL_NAMES = { simpler: 'Simpler', detail: 'More detail' }
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const dayWithYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// "Today", "Yesterday", "Monday 10 November", or with the year when it is not this year.
export function dayLabel(key, today) {
  if (key === today) return 'Today'
  if (key === addDays(today, -1)) return 'Yesterday'
  return key.slice(0, 4) === today.slice(0, 4) ? day.format(toDate(key)) : dayWithYear.format(toDate(key))
}

// Newest first, in groups of the same day (in the visitor's own time zone).
export function groupByDay(items, today) {
  const groups = []
  for (const h of items) {
    const key = dayKey(new Date(h.savedAt))
    const last = groups.at(-1)
    if (last?.key === key) last.items.push(h)
    else groups.push({ key, label: dayLabel(key, today), items: [h] })
  }
  return groups
}

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`

// One line of what is special about this entry: level, language, questions asked, words kept.
function details(h, savedFrom, items) {
  const parts = []
  const level = levelOf(h)
  if (level) parts.push(LEVEL_NAMES[level])
  const language = findLanguage(languageOf(h))
  if (language) parts.push(`in ${language.name}`)
  const questions = followUpsOf(h).length
  if (questions > 0) parts.push(count(questions, 'question', 'questions'))
  const saved = savedFrom.get(h.id) ?? 0
  if (saved > 0) parts.push(`${count(saved, 'word', 'words')} saved`)
  if (h.check) parts.push(`Checked ${h.check.right} of ${h.check.total}`)
  const tries = chainLength(h, items)
  if (tries > 1) parts.push(`Try ${tries}`)
  if (h.solved) parts.push('Solved')
  return parts.join(' · ')
}

export default function HistoryPage() {
  usePageTitle('History')
  const toast = useToast()
  const [items, setItems] = useState(listHistory)
  const [query, setQuery] = useState('')
  const [today] = useState(() => dayKey())

  // How many saved words came from each explanation.
  const savedFrom = new Map()
  for (const w of listWords()) if (w.source) savedFrom.set(w.source, (savedFrom.get(w.source) ?? 0) + 1)

  const needle = query.trim().toLowerCase()
  const shown = needle
    ? items.filter((h) => h.text.toLowerCase().includes(needle) || h.result.explanation.toLowerCase().includes(needle))
    : items

  // Undo replaces the "are you sure?" dialog: nothing is lost for good straight away.
  function offerUndo(message, removed) {
    if (removed.length === 0) {
      toast('Your browser could not delete this.')
      return
    }
    toast(message, { action: { label: 'Undo', onClick: () => undo(removed) } })
  }

  function undo(removed) {
    const ok = restoreHistory(removed)
    setItems(listHistory())
    toast(ok ? 'Brought back' : 'Your browser could not bring it back.')
  }

  function remove(id) {
    const removed = deleteHistoryItem(id)
    setItems(listHistory())
    offerUndo('Explanation deleted', removed)
  }

  function clearAll() {
    const removed = clearHistory()
    setItems(listHistory())
    offerUndo('History cleared', removed)
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
        <>
          <div className="stack-xs">
            <label htmlFor="history-search" className="field-label">
              Search History
            </label>
            <input
              id="history-search"
              type="search"
              className="search-box"
              placeholder={`Search ${count(items.length, 'explanation', 'explanations')}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {shown.length === 0 ? (
            <p className="soft">Nothing in History matches your search.</p>
          ) : (
            groupByDay(shown, today).map((g) => (
              <section key={g.key} className="history-day" aria-labelledby={`day-${g.key}`}>
                <h2 id={`day-${g.key}`} className="mono-label history-day-title">
                  {g.label}
                </h2>
                <ul className="card history-list">
                  {g.items.map((h) => {
                    const line = firstLine(h.text)
                    const name = shortName(line)
                    const isError = h.result.kind === 'error'
                    const extra = details(h, savedFrom, items)
                    return (
                      <li key={h.id} className="history-row-item">
                        <span className={`kind-tag ${isError ? 'kind-error' : 'kind-docs'}`}>
                          {isError ? 'Error' : 'Docs'}
                        </span>
                        <div className="history-main">
                          <p className="history-title">{line}</p>
                          <p className="history-snippet">{h.result.explanation}</p>
                          {extra && <p className="history-details">{extra}</p>}
                        </div>
                        <time className="history-time" dateTime={h.savedAt}>
                          {time.format(new Date(h.savedAt))}
                        </time>
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
              </section>
            ))
          )}
        </>
      )}
    </main>
  )
}
