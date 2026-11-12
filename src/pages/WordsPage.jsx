import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LevelDots from '../components/LevelDots.jsx'
import ListenButton from '../components/ListenButton.jsx'
import Streak from '../components/Streak.jsx'
import { useToast } from '../components/Toast.jsx'
import { listPracticeDays } from '../lib/activityStore.js'
import { MAX_FILE_BYTES, downloadBackup, readBackup } from '../lib/backup.js'
import { dayKey, whenDue } from '../lib/days.js'
import { importHistory, listHistory } from '../lib/historyStore.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import { deleteWord, importWords, listWords, restoreWord } from '../lib/wordStore.js'
import { TOPICS } from '../../shared/topics.js'

const LEVELS = [
  [1, 'new'],
  [2, 'learning'],
  [3, 'known'],
]

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`

// Topics in use, most words first; ties keep the fixed topic order.
function topicCounts(words) {
  const counts = new Map()
  for (const w of words) counts.set(w.topic, (counts.get(w.topic) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || TOPICS.indexOf(a[0]) - TOPICS.indexOf(b[0]))
}

function importMessage(words, explanations) {
  if (words === 0 && explanations === 0) return 'Nothing new in this file: everything in it is already here.'
  const added = [words > 0 && count(words, 'word', 'words'), explanations > 0 && count(explanations, 'explanation', 'explanations')]
  return `Added ${added.filter(Boolean).join(' and ')}.`
}

export default function WordsPage() {
  usePageTitle('My Words')
  const toast = useToast()
  const [today] = useState(() => dayKey())
  const [words, setWords] = useState(listWords)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('All')
  const fileInput = useRef(null)

  const counts = topicCounts(words)
  // If the chosen topic has no words left (after a delete), show them all.
  const activeTopic = counts.some(([t]) => t === topic) ? topic : 'All'
  const needle = query.trim().toLowerCase()
  const shown = words.filter(
    (w) => (activeTopic === 'All' || w.topic === activeTopic) && w.word.toLowerCase().includes(needle),
  )

  function remove(id) {
    const removed = deleteWord(id)
    setWords(listWords())
    if (!removed) {
      toast('Your browser could not delete this word.')
      return
    }
    toast(`Deleted “${removed.word.word}”`, { action: { label: 'Undo', onClick: () => undo(removed) } })
  }

  function undo(removed) {
    const ok = restoreWord(removed)
    setWords(listWords())
    toast(ok ? `“${removed.word.word}” is back` : 'Your browser could not bring the word back.')
  }

  async function importFile(e) {
    const file = e.target.files?.[0]
    // Clear the choice, so picking the same file again still works.
    e.target.value = ''
    if (!file) return
    const backup = file.size <= MAX_FILE_BYTES ? readBackup(await file.text()) : null
    if (!backup) {
      toast('This file is not a Plain-Language Explainer backup.')
      return
    }
    const w = importWords(backup.words)
    const h = importHistory(backup.history)
    setWords(listWords())
    toast(w.ok && h.ok ? importMessage(w.added, h.added) : 'Your browser could not save everything from the file.')
  }

  return (
    <main className="page narrow-page">
      <div className="page-head">
        <div className="stack-sm">
          <h1>My Words</h1>
          {words.length > 0 && <p className="soft">{count(words.length, 'word', 'words')} saved in this browser</p>}
        </div>
        <div className="page-actions">
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={importFile}
          />
          <button type="button" className="btn btn-outline" onClick={() => fileInput.current.click()}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V5" />
              <path d="M7 9l5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
            Import
          </button>
          {words.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => downloadBackup({ words, history: listHistory() })}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11" />
                  <path d="M7 11l5 5 5-5" />
                  <path d="M5 20h14" />
                </svg>
                Export
              </button>
              <Link className="btn btn-violet" to="/practice">
                Practise these words
              </Link>
            </>
          )}
        </div>
      </div>

      {words.length === 0 ? (
        <EmptyState
          title="No saved words yet"
          text="Explain a text and save the hard words. They will show up here. Moving from another browser? Import your backup file."
          linkTo="/"
          linkLabel="Explain something"
        />
      ) : (
        <>
          <section className="stats" aria-label="Your progress">
            <ul className="stat-list">
              {LEVELS.map(([box, label]) => (
                <li key={box} className="stat">
                  <strong>{words.filter((w) => w.box === box).length}</strong> {label}
                </li>
              ))}
            </ul>
          </section>

          <Streak days={listPracticeDays()} today={today} />

          <div className="topic-filter" role="group" aria-label="Filter by topic">
            {[['All', words.length], ...counts].map(([t, n]) => (
              <button
                key={t}
                type="button"
                className="btn topic-btn"
                aria-pressed={activeTopic === t}
                onClick={() => setTopic(t)}
              >
                {t} <span className="topic-count">{n}</span>
              </button>
            ))}
          </div>

          <div className="stack-xs">
            <label htmlFor="search" className="field-label">
              Search your words
            </label>
            <input
              id="search"
              type="search"
              className="search-box"
              placeholder="Type a word"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {shown.length === 0 ? (
            <p className="soft">No words match your search.</p>
          ) : (
            <ul className="word-cards">
              {shown.map((w) => (
                <li key={w.id} className="card word-card">
                  <div className="word-card-text">
                    <div className="word-title-row">
                      <span className="word-title">{w.word}</span>
                      <ListenButton text={w.word} />
                    </div>
                    <p>{w.meaning}</p>
                    <p className="word-source">{w.sentence}</p>
                  </div>
                  <div className="word-card-side">
                    <span className="topic-tag">{w.topic}</span>
                    <LevelDots box={w.box} />
                    <span className="review-day">Review {whenDue(w.due ?? today, today)}</span>
                    <button
                      type="button"
                      className="btn btn-delete"
                      aria-label={`Delete ${w.word}`}
                      onClick={() => remove(w.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
