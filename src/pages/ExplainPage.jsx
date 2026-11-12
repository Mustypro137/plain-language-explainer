import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CountdownRing from '../components/CountdownRing.jsx'
import ExplainPreview from '../components/ExplainPreview.jsx'
import FollowUp from '../components/FollowUp.jsx'
import HelpLine from '../components/HelpLine.jsx'
import LevelSlider from '../components/LevelSlider.jsx'
import LineByLine from '../components/LineByLine.jsx'
import ListenButton from '../components/ListenButton.jsx'
import WordChips from '../components/WordChips.jsx'
import Loading from '../components/Loading.jsx'
import MarkedText from '../components/MarkedText.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { useToast } from '../components/Toast.jsx'
import { dayKey } from '../lib/days.js'
import { describeText } from '../lib/describeText.js'
import { askAbout, explainText } from '../lib/explainText.js'
import { formatDate } from '../lib/formatDate.js'
import { formatExplanation } from '../lib/formatExplanation.js'
import { formatWait } from '../lib/formatWait.js'
import {
  addFollowUp,
  addHistory,
  findHistory,
  followUpsOf,
  getHistoryItem,
  languageOf,
  levelOf,
} from '../lib/historyStore.js'
import { getLanguage, setLanguage as storeLanguage } from '../lib/languageStore.js'
import { SAMPLES } from '../lib/samples.js'
import { flyStar } from '../lib/flyStar.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import { isFading } from '../lib/practice.js'
import { hasWord, listWords, saveWord } from '../lib/wordStore.js'
import { LANGUAGES } from '../../shared/languages.js'

const MAX_CHARS = 3000

const ERROR_MESSAGES = {
  busy: 'The service is busy. Please try again in a minute.',
  ai_failed: 'Something went wrong. Please try again.',
  empty: 'Something went wrong. Please try again.',
  too_long: 'Please shorten the text',
  offline: 'No connection',
  bad_level: 'Something went wrong. Please try again.',
  bad_language: 'Something went wrong. Please try again.',
}

// What to do next, under the message. Every error keeps the pasted text.
const ERROR_HINTS = {
  offline: 'Your text is still here. Check your internet, then try again.',
  ai_failed: 'Your text is still here. The AI sent an answer we could not use.',
}

const LEVEL_NOTES = { simpler: 'Simpler version', detail: 'More detailed version' }

const LIMIT_TITLES = {
  minute: 'The free AI limit is used up for this minute.',
  day: 'The free AI limit is used up for today.',
  visitor: 'You have asked many times in a short time. The free AI is shared by everyone.',
  unknown: 'The free AI limit is used up.',
}

const wordKey = (word) => word.trim().toLowerCase()

const savedKeys = (words) => new Set(words.filter((w) => hasWord(w.word)).map((w) => wordKey(w.word)))

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// On a phone the answer column sits below the paste box, often off screen.
// Bring it up when it changes, unless its top is already in the upper part of the screen.
function reveal(el) {
  if (!el?.scrollIntoView) return
  const { top } = el.getBoundingClientRect()
  if (top >= 0 && top < window.innerHeight * 0.6) return
  el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
}

export default function ExplainPage() {
  usePageTitle(null)
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  // A History entry on screen (opened from the History page, or found for the same text):
  // shown as it was saved, with no AI call.
  const [opened, setOpened] = useState(() => getHistoryItem(params.get('item')) ?? null)
  const [text, setText] = useState(opened?.text ?? '')
  const [status, setStatus] = useState(opened ? 'done' : 'idle') // idle | loading | done | error
  const [result, setResult] = useState(opened?.result ?? null)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(() => (opened ? savedKeys(opened.result.words) : new Set()))
  // The text, level and language that the answer (or error) on screen belongs to.
  const [request, setRequest] = useState(
    opened ? { text: opened.text, level: levelOf(opened), language: languageOf(opened) } : null,
  )
  // "Help in my language", used for every new question to the AI. null is English only.
  const [language, setLanguage] = useState(getLanguage)
  // The History entry the answer on screen is kept in (none for an example), so follow-up
  // questions and saved words can point back to it.
  const [entryId, setEntryId] = useState(opened?.id ?? null)
  // For a returning visitor: how many words they have, and how many are fading.
  const [mine] = useState(() => {
    const words = listWords()
    const today = dayKey()
    return { saved: words.length, fading: words.filter((w) => isFading(w, today)).length }
  })
  const [followUps, setFollowUps] = useState(() => (opened ? followUpsOf(opened) : []))
  // Set when the free AI limit is used up: { until (ms), total (seconds), limit }.
  const [wait, setWait] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  // True while the answer on screen is a sample written in advance, not from the AI.
  const [isSample, setIsSample] = useState(false)
  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  // Only move the screen and focus after the user asks for something, not on page load.
  const userAsked = useRef(false)
  // The answer on screen, so a follow-up that comes back after a new answer is dropped.
  const resultRef = useRef(result)
  useEffect(() => {
    resultRef.current = result
  }, [result])

  const remaining = wait ? Math.max(0, Math.ceil((wait.until - now) / 1000)) : 0
  const waiting = remaining > 0
  const tooLong = text.length > MAX_CHARS
  const loading = status === 'loading'
  const canExplain = text.trim() !== '' && !tooLong && !loading && !waiting

  useEffect(() => {
    if (!waiting) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [waiting])

  // Show the skeleton when loading starts. When the answer or error arrives, move focus
  // to the Explanation heading: screen readers then read from there, and the buttons
  // under the old answer (now gone) do not leave focus lost.
  useEffect(() => {
    if (!userAsked.current) return
    reveal(sectionRef.current)
    if (status !== 'loading') headingRef.current?.focus({ preventScroll: true })
  }, [status, result])

  function explain() {
    if (!canExplain) return
    run({ text: text.trim(), level: null })
  }

  function chooseLanguage(code) {
    setLanguage(code)
    storeLanguage(code)
  }

  function startWait(answer) {
    const start = Date.now()
    setWait({ until: start + answer.retryAfter * 1000, total: answer.retryAfter, limit: answer.limit ?? null })
    setNow(start)
  }

  function onPasteKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      explain()
    }
  }

  function leaveHistoryEntry() {
    setOpened(null)
    if (params.has('item')) setParams({}, { replace: true })
  }

  function showSample(sample) {
    if (loading) return
    userAsked.current = true
    leaveHistoryEntry()
    setText(sample.text)
    setRequest({ text: sample.text, level: null, language: null })
    setEntryId(null)
    setFollowUps([])
    setResult(sample.result)
    setSaved(savedKeys(sample.result.words))
    setError(null)
    setWait(null)
    setIsSample(true)
    setStatus('done')
  }

  // The same text at the same level was explained before: show that answer and save an AI call.
  function showKept(item, req) {
    userAsked.current = true
    setOpened(item)
    setParams({ item: item.id }, { replace: true })
    setRequest(req)
    setEntryId(item.id)
    setFollowUps(followUpsOf(item))
    setResult(item.result)
    setSaved(savedKeys(item.result.words))
    setError(null)
    setIsSample(false)
    setStatus('done')
  }

  // The chosen language is added to { text, level } here.
  // fresh: ask the AI even when History has an answer ("Ask the AI again").
  async function run({ text: reqText, level }, { fresh = false } = {}) {
    if (loading || waiting) return
    const req = { text: reqText, level, language }
    if (!fresh) {
      const kept = findHistory(req.text, req.level, req.language)
      // Pressing Explain on the entry already on screen asks again, as before.
      if (kept && kept.id !== opened?.id) {
        showKept(kept, req)
        return
      }
    }
    userAsked.current = true
    setRequest(req)
    setStatus('loading')
    setResult(null)
    setError(null)
    setWait(null)
    setIsSample(false)
    leaveHistoryEntry()
    setFollowUps([])
    setEntryId(null)
    const answer = await explainText(req.text, req.level, req.language)
    if (answer.ok) {
      const kept = addHistory({ text: req.text, result: answer.data, level: req.level, language: req.language })
      setEntryId(kept?.id ?? null)
      setSaved(savedKeys(answer.data.words))
      setResult(answer.data)
      setStatus('done')
    } else {
      if (answer.error === 'busy' && answer.retryAfter) startWait(answer)
      setError(answer.error)
      setStatus('error')
    }
  }

  // "Ask about this". The answer is kept with the History entry, so it is there when reopened.
  async function askMore(question) {
    const about = result
    const answer = await askAbout({
      text: request.text,
      explanation: about.explanation,
      question,
      earlier: followUps,
      language,
    })
    if (resultRef.current !== about) return { ok: true }
    if (!answer.ok) {
      const waits = answer.error === 'busy' && Boolean(answer.retryAfter)
      if (waits) startWait(answer)
      return { ...answer, waiting: waits }
    }
    const item = { question, answer: answer.data.answer, ...(answer.data.help && { help: answer.data.help }) }
    setFollowUps((prev) => [...prev, item])
    if (entryId) addFollowUp(entryId, item)
    return { ok: true }
  }

  // el: the Save button, where the star starts its flight to My Words.
  function save(w, el) {
    const r = saveWord({ ...w, source: entryId ?? undefined })
    if (!r.ok && r.reason === 'storage') {
      toast('Your browser could not save this word.')
      return
    }
    setSaved((prev) => new Set(prev).add(wordKey(w.word)))
    if (r.ok) {
      toast('Saved to My Words')
      flyStar(el)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatExplanation(result, request.text))
      toast('Copied')
    } catch {
      toast('Could not copy')
    }
  }

  return (
    <main className="page explain-layout">
      <section className="explain-left" aria-label="Paste area">
        <div className="stack-sm">
          {mine.fading > 0 && (
            <Link className="welcome-chip" to="/practice">
              <span className="welcome-dot" aria-hidden="true" />
              Welcome back · {mine.fading} {mine.fading === 1 ? 'word is' : 'words are'} fading. Review them
            </Link>
          )}
          <h1 className="home-title">
            Paste what you don’t understand. <span className="highlight">Read it line by line</span> in plain English.
          </h1>
        </div>

        <div className="stack-xs">
          <div className="input-panel">
            <label htmlFor="paste" className="visually-hidden">
              Your text
            </label>
            <textarea
              id="paste"
              className="paste-box"
              rows={8}
              placeholder="Paste an error message or a paragraph from the docs…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onPasteKeyDown}
            />
            <div className="input-bar">
              {describeText(text) && <span className="type-chip">{describeText(text)}</span>}
              <span className={`input-count${tooLong ? ' count-over' : ''}`}>
                {text.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')}
              </span>
              <span className="input-actions">
                <p className="soft key-hint" aria-hidden="true">
                  <kbd>{IS_MAC ? '⌘' : 'Ctrl'}</kbd> + <kbd>Enter</kbd>
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canExplain}
                  onClick={explain}
                  aria-keyshortcuts="Control+Enter Meta+Enter"
                >
                  Explain
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
          <p className="soft privacy-note">
            Do not paste passwords or secret keys. Explanations are kept in History in this browser.
          </p>
          {tooLong && (
            <div className="too-long">
              <span className="too-long-bar" aria-hidden="true" />
              <p className="count-over">
                <span>Please shorten the text</span>{' '}
                <span className="too-long-hint">
                  Remove {(text.length - MAX_CHARS).toLocaleString('en-US')} characters. The last lines of a long
                  stack trace are usually not needed.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="samples" role="group" aria-labelledby="samples-label">
          <span id="samples-label" className="samples-label">
            Nothing to paste? Try an example:
          </span>
          <div className="samples-buttons">
            {SAMPLES.map((s) => (
              <button key={s.id} type="button" className="btn sample-btn" disabled={loading} onClick={() => showSample(s)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* A setting chosen once, so it sits below Explain and the examples: on a phone and on a
            small laptop the Explain button stays on the first screen. */}
        <div className="language-row">
          <label htmlFor="language" className="field-label">
            Help in my language
          </label>
          <select
            id="language"
            className="search-box language-select"
            value={language ?? ''}
            aria-describedby="language-hint"
            onChange={(e) => chooseLanguage(e.target.value || null)}
          >
            <option value="">No, English only</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <p id="language-hint" className="soft field-hint">
            Adds a translation under the English.
          </p>
        </div>
      </section>

      <section ref={sectionRef} className="explain-right" aria-labelledby="answer-heading">
        <div className="results-head">
          <h2 id="answer-heading" ref={headingRef} tabIndex={-1}>
            {status === 'idle' ? 'What you will get' : 'Explanation'}
          </h2>
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

        {request && status !== 'idle' && (
          <LevelSlider
            value={request.level}
            disabled={loading || waiting}
            onChange={(level) => run({ text: request.text, level })}
          />
        )}

        {opened && (
          <div className="history-row">
            <p className="soft history-note">
              From your history · <time dateTime={opened.savedAt}>{formatDate(opened.savedAt)}</time>
            </p>
            <button type="button" className="btn btn-quiet" onClick={() => run(request, { fresh: true })}>
              Ask the AI again
            </button>
          </div>
        )}

        {isSample && (
          <p className="soft history-note">Example answer, written in advance. Press Explain to ask the AI yourself.</p>
        )}

        {result && request?.level && <p className="soft history-note">{LEVEL_NOTES[request.level]}</p>}

        {status === 'idle' && <ExplainPreview savedCount={mine.saved} />}

        {error && (
          <div className={`error-box${error === 'busy' && wait ? ' error-wait' : ''}`} role="alert">
            {error === 'busy' && wait && waiting && <CountdownRing remaining={remaining} total={wait.total} />}
            {error === 'busy' && wait ? (
              <div className="wait-text">
                <span>{LIMIT_TITLES[wait.limit ?? 'unknown']}</span>
                {waiting ? (
                  <>
                    {/* Screen readers hear the wait once; the visible line counts down. */}
                    <span className="visually-hidden">You can try again in {formatWait(wait.total)}.</span>
                    <span aria-hidden="true">You can try again in {formatWait(remaining)}.</span>
                    <Link className="wait-link" to="/practice">
                      Practise your saved words while you wait
                    </Link>
                  </>
                ) : (
                  <span>You can try again now.</span>
                )}
              </div>
            ) : (
              <div className="error-text">
                <span className="error-title">{ERROR_MESSAGES[error]}</span>
                {ERROR_HINTS[error] && <span className="error-hint">{ERROR_HINTS[error]}</span>}
              </div>
            )}
            {(error === 'offline' || error === 'ai_failed' || (error === 'busy' && wait && !waiting)) && (
              <button type="button" className="btn btn-outline" onClick={() => run(request)}>
                Try again
              </button>
            )}
          </div>
        )}

        {loading && <Loading text={request.text} />}

        {result && (
          <>
            <ResultCard title="In simple words" raised>
              <p className="result-lead">{result.explanation}</p>
              <HelpLine help={result.help} field="explanation" />
            </ResultCard>
            {result.lines?.length > 0 && (
              <LineByLine
                text={request.text}
                lines={result.lines}
                words={result.words}
                isSaved={(w) => saved.has(wordKey(w.word))}
                onSave={save}
              />
            )}
            <ResultCard title="Why this happens">
              <p>{result.why}</p>
              <HelpLine help={result.help} field="why" />
            </ResultCard>
            {result.steps.length > 0 && (
              <ResultCard title="What to try next">
                <ol className="steps">
                  {result.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </ResultCard>
            )}
            {result.example && (
              <ResultCard title="Practical example">
                {/* Folded: useful, but long, and not what most readers need first. */}
                <details className="fold">
                  <summary>Show the example</summary>
                  <pre className="code-block">{result.example}</pre>
                </details>
              </ResultCard>
            )}
            {result.words.length > 0 && (
              <ResultCard title="Hard words">
                {/* With line by line the words are already dotted in the table above, so here
                    they are only a row of chips. Older answers keep the full list. */}
                {result.lines?.length > 0 ? (
                  <WordChips words={result.words} isSaved={(w) => saved.has(wordKey(w.word))} onSave={save} />
                ) : (
                  <>
                  <MarkedText
                    text={request.text}
                    words={result.words}
                    isSaved={(w) => saved.has(wordKey(w.word))}
                    onSave={save}
                  />
                  <ul className="word-rows">
                    {result.words.map((w) => {
                      const isSaved = saved.has(wordKey(w.word))
                      return (
                        <li key={w.word} className="word-row">
                          <div className="word-row-text">
                            <div className="word-name-row">
                              <span className={`word-name${isSaved ? ' word-name-saved' : ''}`}>{w.word}</span>
                              <ListenButton text={w.word} />
                            </div>
                            <p>{w.meaning}</p>
                            <HelpLine help={w.help} field="meaning" />
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={isSaved}
                            aria-label={`${isSaved ? 'Saved' : 'Save'} ${w.word}`}
                            onClick={(e) => save(w, e.currentTarget)}
                          >
                            {isSaved ? 'Saved' : 'Save'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  </>
                )}
              </ResultCard>
            )}
            <FollowUp
              key={`${entryId ?? 'none'}-${request.text}-${request.level}`}
              items={followUps}
              onAsk={askMore}
              waitText={
                waiting
                  ? `${LIMIT_TITLES[wait.limit ?? 'unknown']} You can ask again in ${formatWait(remaining)}.`
                  : null
              }
            />
          </>
        )}
      </section>
    </main>
  )
}
