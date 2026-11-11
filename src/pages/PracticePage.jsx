import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { buildRound, nextBox } from '../lib/practice.js'
import { listWords, setBox } from '../lib/wordStore.js'

const noun = (n) => (n === 1 ? 'word' : 'words')

export default function PracticePage() {
  // The round is built once, so box changes during it do not reorder the cards.
  const [round, setRound] = useState(() => buildRound(listWords()))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answers, setAnswers] = useState([])

  const finished = round.length > 0 && index >= round.length
  const card = round[index]

  function answer(knew) {
    if (!flipped || !card) return
    setBox(card.id, nextBox(card.box, knew))
    setAnswers((prev) => [...prev, { word: card, knew }])
    setIndex(index + 1)
    setFlipped(false)
  }

  function restart() {
    setRound(buildRound(listWords()))
    setIndex(0)
    setFlipped(false)
    setAnswers([])
  }

  useEffect(() => {
    if (!card) return undefined
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

  if (round.length === 0) {
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
              ? 'Every word was one you knew.'
              : `${forgotten.length} ${noun(forgotten.length)} will come back sooner.`}
          </p>
        </section>

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
          <button type="button" className="btn btn-primary" onClick={restart}>
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
        <h1>Practice</h1>
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
    </main>
  )
}
