import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ResultCard from '../components/ResultCard.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { useToast } from '../components/Toast.jsx'
import { explainText } from '../lib/explainText.js'
import { formatDate } from '../lib/formatDate.js'
import { formatExplanation } from '../lib/formatExplanation.js'
import { addHistory, getHistoryItem } from '../lib/historyStore.js'
import { hasWord, saveWord } from '../lib/wordStore.js'

const MAX_CHARS = 3000

const ERROR_MESSAGES = {
  busy: 'The service is busy. Please try again in a minute.',
  ai_failed: 'Something went wrong. Please try again.',
  empty: 'Something went wrong. Please try again.',
  too_long: 'Please shorten the text',
  offline: 'No connection',
  bad_level: 'Something went wrong. Please try again.',
}

const LEVEL_NOTES = { simpler: 'Simpler version', detail: 'More detailed version' }

const wordKey = (word) => word.trim().toLowerCase()

const savedKeys = (words) => new Set(words.filter((w) => hasWord(w.word)).map((w) => wordKey(w.word)))

export default function ExplainPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  // An entry opened from the History page: shown as it was saved, with no AI call.
  const [opened, setOpened] = useState(() => getHistoryItem(params.get('item')) ?? null)
  const [text, setText] = useState(opened?.text ?? '')
  const [status, setStatus] = useState(opened ? 'done' : 'idle') // idle | loading | done | error
  const [result, setResult] = useState(opened?.result ?? null)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(() => (opened ? savedKeys(opened.result.words) : new Set()))
  // The text and level that the answer (or error) on screen belongs to.
  const [request, setRequest] = useState(opened ? { text: opened.text, level: null } : null)

  const tooLong = text.length > MAX_CHARS
  const loading = status === 'loading'
  const canExplain = text.trim() !== '' && !tooLong && !loading

  function explain() {
    if (!canExplain) return
    run({ text: text.trim(), level: null })
  }

  async function run(req) {
    if (loading) return
    setRequest(req)
    setStatus('loading')
    setResult(null)
    setError(null)
    setOpened(null)
    if (params.has('item')) setParams({}, { replace: true })
    const answer = await (req.level ? explainText(req.text, req.level) : explainText(req.text))
    if (answer.ok) {
      addHistory({ text: req.text, result: answer.data })
      setSaved(savedKeys(answer.data.words))
      setResult(answer.data)
      setStatus('done')
    } else {
      setError(answer.error)
      setStatus('error')
    }
  }

  function save(w) {
    const r = saveWord(w)
    if (!r.ok && r.reason === 'storage') {
      toast('Your browser could not save this word.')
      return
    }
    setSaved((prev) => new Set(prev).add(wordKey(w.word)))
    if (r.ok) toast('Saved to My Words')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatExplanation(result))
      toast('Copied')
    } catch {
      toast('Could not copy')
    }
  }

  return (
    <main className="page explain-layout">
      <section className="explain-left" aria-label="Paste area">
        <div className="stack-sm">
          <h1>
            Paste the text you <mark className="highlight">do not understand</mark>
          </h1>
          <p className="soft">Documentation or an error message. You get it back in simple English.</p>
        </div>

        <div className="stack-xs">
          <label htmlFor="paste" className="field-label">
            Your text
          </label>
          <textarea
            id="paste"
            className="paste-box"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="paste-meta">
            <span>Do not paste passwords or secret keys. Explanations are kept in History in this browser.</span>
            <span className={tooLong ? 'count-over' : undefined}>
              {text.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')}
            </span>
          </div>
          {tooLong && <p className="count-over">Please shorten the text</p>}
        </div>

        <button type="button" className="btn btn-primary" disabled={!canExplain} onClick={explain}>
          Explain
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </section>

      {status !== 'idle' && (
        <section className="explain-right" aria-label="Explanation">
          <div className="results-head">
            <h2>Explanation</h2>
            {result && (
              <button type="button" className="btn btn-outline" onClick={copy}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                </svg>
                Copy explanation
              </button>
            )}
          </div>

          {opened && (
            <p className="soft history-note">
              From your history · <time dateTime={opened.savedAt}>{formatDate(opened.savedAt)}</time>
            </p>
          )}

          {result && request?.level && <p className="soft history-note">{LEVEL_NOTES[request.level]}</p>}

          {error && (
            <div className="error-box" role="alert">
              <span>{ERROR_MESSAGES[error]}</span>
              {error === 'offline' && (
                <button type="button" className="btn btn-outline" onClick={() => run(request)}>
                  Try again
                </button>
              )}
            </div>
          )}

          {loading && <Skeleton />}

          {result && (
            <>
              <ResultCard tone="sunshine" title="In simple words" raised>
                <p className="result-lead">{result.explanation}</p>
              </ResultCard>
              <ResultCard tone="coral" title="Why this happens">
                <p>{result.why}</p>
              </ResultCard>
              {result.steps.length > 0 && (
                <ResultCard tone="teal" title="What to try next">
                  <ol className="steps">
                    {result.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </ResultCard>
              )}
              {result.example && (
                <ResultCard tone="violet" title="Practical example">
                  <pre className="code-block">{result.example}</pre>
                </ResultCard>
              )}
              {result.words.length > 0 && (
                <ResultCard tone="ink" title="Hard words">
                  <ul className="word-rows">
                    {result.words.map((w) => {
                      const isSaved = saved.has(wordKey(w.word))
                      return (
                        <li key={w.word} className="word-row">
                          <div className="word-row-text">
                            <span className={`word-name${isSaved ? ' word-name-saved' : ''}`}>{w.word}</span>
                            <p>{w.meaning}</p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={isSaved}
                            aria-label={`${isSaved ? 'Saved' : 'Save'} ${w.word}`}
                            onClick={() => save(w)}
                          >
                            {isSaved ? 'Saved' : 'Save'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </ResultCard>
              )}
              <div className="explain-again">
                <span className="explain-again-label">Not clear?</span>
                <button type="button" className="btn btn-outline" onClick={() => run({ text: request.text, level: 'simpler' })}>
                  Make it simpler
                </button>
                <button type="button" className="btn btn-outline" onClick={() => run({ text: request.text, level: 'detail' })}>
                  More detail
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  )
}
