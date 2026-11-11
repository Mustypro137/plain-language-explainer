import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LevelDots from '../components/LevelDots.jsx'
import { useToast } from '../components/Toast.jsx'
import { downloadWords } from '../lib/exportWords.js'
import { deleteWord, listWords } from '../lib/wordStore.js'

export default function WordsPage() {
  const toast = useToast()
  const [words, setWords] = useState(listWords)
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const shown = words.filter((w) => w.word.toLowerCase().includes(needle))

  function remove(id) {
    deleteWord(id)
    setWords(listWords())
    toast('Deleted')
  }

  return (
    <main className="page narrow-page">
      <div className="page-head">
        <div className="stack-sm">
          <h1>My Words</h1>
          {words.length > 0 && (
            <p className="soft">
              {words.length} {words.length === 1 ? 'word' : 'words'} saved in this browser
            </p>
          )}
        </div>
        {words.length > 0 && (
          <div className="page-actions">
            <button type="button" className="btn btn-outline" onClick={() => downloadWords(words)}>
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
          </div>
        )}
      </div>

      {words.length === 0 ? (
        <EmptyState
          title="No saved words yet"
          text="Explain a text and save the hard words. They will show up here."
          linkTo="/"
          linkLabel="Explain something"
        />
      ) : (
        <>
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
                    <span className="word-title">{w.word}</span>
                    <p>{w.meaning}</p>
                    <p className="word-source">{w.sentence}</p>
                  </div>
                  <div className="word-card-side">
                    <LevelDots box={w.box} />
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
