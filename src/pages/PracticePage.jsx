import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ChoiceQuestion from '../components/ChoiceQuestion.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ListenButton from '../components/ListenButton.jsx'
import Streak from '../components/Streak.jsx'
import { listPracticeDays, recordPracticeDay } from '../lib/activityStore.js'
import { dayKey, whenDue } from '../lib/days.js'
import { buildChoices, buildRound, canUseChoices, isDue, nextReview, schedule } from '../lib/practice.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import { listWords, setProgress } from '../lib/wordStore.js'

const noun = (n) => (n === 1 ? 'word' : 'words')

// A normal round holds the words due today. "Practise anyway" (extra) uses every word.
const makeRound = (words, today, extra) => buildRound(extra ? words : words.filter((w) => isDue(w, today)))

export default function PracticePage() {
  usePageTitle('Practice')
  // The day is fixed while the page is open, so a round that runs past midnight stays one round.
  const [today] = useState(() => dayKey())
  const [extra, setExtra] = useState(false)
  // The round is built once, so level changes during it do not reorder the cards.
  const [pool, setPool] = useState(listWords)
  const [round, setRound] = useState(() => makeRound(pool, today, false))
  const [mode, setMode] = useState('cards') // cards | choice
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answers, setAnswers] = useState([])
  const [practiceDays, setPracticeDays] = useState(listPracticeDays)

  const finished = round.length > 0 && index >= round.length
  const card = round[index]
  const choicesAllowed = canUseChoices(pool)
  const choices = useMemo(
    () => (mode === 'choice' && card ? buildChoices(card, pool) : null),
    [mode, card, pool],
  )

  function record(knew) {
    setProgress(card.id, schedule(card, knew, today))
    setAnswers((prev) => [...prev, { word: card, knew }])
  }

  function next() {
    setIndex((i) => i + 1)
    setFlipped(false)
  }

  function answer(knew) {
    if (!flipped || !card) return
    record(knew)
    next()
  }

  function restart(useAll = extra) {
    const words = listWords()
    setExtra(useAll)
    setPool(words)
    setRound(makeRound(words, today, useAll))
    setIndex(0)
    setFlipped(false)
    setAnswers([])
  }

  // A finished round counts for the streak.
  useEffect(() => {
    if (!finished) return
    recordPracticeDay(today)
    setPracticeDays(listPracticeDays())
  }, [finished, today])

  function changeMode(nextMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    restart()
  }

  useEffect(() => {
    if (!card || mode !== 'cards') return undefined
    function onKeyDown(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === ' ') {
        // Let Space press other buttons and links as usual.
        if (target?.closest('a, button') && !target.closest('.flashcard')) return
        e.preventDefault()
        setFlipped(true)
      } else if (flipped && (e.key === '1' || e.key === '2')) {
        answer(e.key === '2')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  if (pool.length === 0) {
    return (
      <main className="page narrow-page">
        <h1>Practice</h1>
        <EmptyState
          title="No words to practise yet"
          text="Save some hard words first. Then they come back here as flashcards."
          linkTo="/"
          linkLabel="Explain something"
        />
      </main>
    )
  }

  if (round.length === 0) {
    const upcoming = nextReview(pool, today)
    return (
      <main className="page narrow-page">
        <h1>Practice</h1>
        <section className="card all-done" aria-labelledby="all-done">
          <h2 id="all-done">Nothing to review today</h2>
          <p className="soft">
            {upcoming
              ? `Next review: ${whenDue(upcoming.day, today)}, ${upcoming.count} ${noun(upcoming.count)}.`
              : 'Your words come back here on the day they are due.'}{' '}
            Each word comes back later every time you know it.
          </p>
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => restart(true)}>
              Practise anyway
            </button>
            <Link className="btn btn-outline" to="/">
              Explain something new
            </Link>
          </div>
        </section>
        <Streak days={practiceDays} today={today} />
      </main>
    )
  }

  if (finished) {
    const known = answers.filter((a) => a.knew).length
    const forgotten = answers.filter((a) => !a.knew).map((a) => a.word)
    return (
      <main className="page narrow-page">
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`confetti-piece confetti-${i % 4}`} style={{ '--n': i }} />
          ))}
        </div>
        <section className="score-card" aria-label="Your result">
          <p className="score-kicker">Round finished</p>
          <h1>
            You knew {known} of {answers.length} {noun(answers.length)}
          </h1>
          <div className="score-bars" role="img" aria-label={`${known} ${noun(known)} known, ${forgotten.length} to review`}>
            {answers.map((a, i) => (
              <span key={i} className={`score-bar${a.knew ? ' score-bar-on' : ''}`} />
            ))}
          </div>
          <p>
            {forgotten.length === 0
              ? 'Every word was one you knew. They come back in a few days.'
              : `${forgotten.length} ${noun(forgotten.length)} to practise again today. The words you knew come back later.`}
          </p>
        </section>

        <Streak days={practiceDays} today={today} />

        <section className="stack-xs" aria-labelledby="review">
          {forgotten.length === 0 ? (
            <h2 id="review">Nothing to review</h2>
          ) : (
            <>
              <h2 id="review">{forgotten.length === 1 ? 'Word to review' : 'Words to review'}</h2>
              {forgotten.map((w) => (
                <div className="card review-card" key={w.id}>
                  <span className="review-word">{w.word}</span>
                  <p>{w.meaning}</p>
                </div>
              ))}
            </>
          )}
        </section>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => restart()}>
            Practise again
          </button>
          <Link className="btn btn-outline" to="/words">
            Back to My Words
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page narrow-page">
      <div className="stack-sm">
        <div className="page-head">
          <h1>Practice</h1>
          <div className="mode-switch" role="group" aria-label="Practice mode">
            <button
              type="button"
              className="btn"
              aria-pressed={mode === 'cards'}
              onClick={() => changeMode('cards')}
            >
              Flashcards
            </button>
            <button
              type="button"
              className="btn"
              aria-pressed={mode === 'choice'}
              disabled={!choicesAllowed}
              aria-describedby={choicesAllowed ? undefined : 'choice-hint'}
              onClick={() => changeMode('choice')}
            >
              Multiple choice
            </button>
          </div>
        </div>
        {!choicesAllowed && (
          <p id="choice-hint" className="soft">
            Save at least 4 words to use multiple choice.
          </p>
        )}
        {extra && <p className="soft">Extra practice: these words are not due yet.</p>}
        <div className="progress-row">
          <span className="progress-label">
            Card {index + 1} of {round.length}
          </span>
          <div
            className="progress"
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={round.length}
            aria-valuenow={index}
          >
            <div className="progress-fill" style={{ width: `${(index / round.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {mode === 'choice' ? (
        <>
          <ChoiceQuestion key={card.id} card={card} choices={choices} onAnswer={record} onNext={next} />
          <p className="soft hint">
            Press <kbd>1</kbd> to <kbd>4</kbd> to choose, then <kbd>Enter</kbd> for the next word
          </p>
        </>
      ) : (
        <>
          {/* The Listen button sits on the card's corner, beside it in the page, not inside the card button. */}
          <div className="flashcard-wrap">
            {flipped ? (
              <section className="flashcard flashcard-back" aria-label="Flashcard">
                <span className="flashcard-word">{card.word}</span>
                <p className="flashcard-meaning">{card.meaning}</p>
                <p className="flashcard-sentence">{card.sentence}</p>
              </section>
            ) : (
              <button
                type="button"
                className="flashcard flashcard-front"
                aria-label={`Show meaning of ${card.word}`}
                onClick={() => setFlipped(true)}
              >
                <span className="flashcard-word">{card.word}</span>
              </button>
            )}
            <ListenButton text={card.word} className="flashcard-listen" />
          </div>

      <div className="answer-row">
        <button type="button" className="btn btn-answer btn-forgot" disabled={!flipped} onClick={() => answer(false)}>
          I forgot <kbd>1</kbd>
        </button>
        <button type="button" className="btn btn-answer btn-knew" disabled={!flipped} onClick={() => answer(true)}>
          I knew it <kbd>2</kbd>
        </button>
      </div>

      <p className="soft hint">
        Press <kbd>Space</kbd> to flip the card
      </p>
        </>
      )}
    </main>
  )
}
