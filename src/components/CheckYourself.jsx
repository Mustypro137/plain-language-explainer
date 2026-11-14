import { useEffect, useMemo, useRef, useState } from 'react'
import { buildCheck } from '../lib/checkQuestions.js'
import ChoiceList from './ChoiceList.jsx'

const num = (n) => String(n).padStart(2, '0')

// Scrolls a row of the line-by-line table into view and lights it up for a moment.
function flashLine(line, { scroll = false } = {}) {
  const row = document.querySelector(`[data-line="${line}"]`)
  if (!row) return
  if (scroll) {
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    row.scrollIntoView?.({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
  }
  row.classList.remove('line-row-flash')
  void row.offsetWidth // restart the animation if it is already running
  row.classList.add('line-row-flash')
  setTimeout(() => row.classList.remove('line-row-flash'), 1200)
}

// "Check yourself": a few questions about the answer above, made from its own lines and words,
// with no AI call. onDone gets { right, total } at the end of each round.
export default function CheckYourself({ rows, words, onDone, random = Math.random }) {
  const [round, setRound] = useState(0)
  // null: not started; a number: the question on screen; 'done': the result.
  const [step, setStep] = useState(null)
  const [picked, setPicked] = useState(null)
  const [answers, setAnswers] = useState([])
  const nextRef = useRef(null)
  // Where focus goes when the card changes: the new question, or the result. Without it,
  // focus would fall back to the page when the pressed button goes away.
  const headRef = useRef(null)
  // rows and words must keep their identity between renders (the page memoises them);
  // round is a dependency so "Check again" mixes the choices anew.
  const questions = useMemo(() => buildCheck(rows, words, random), [rows, words, round])

  useEffect(() => {
    if (step !== null) headRef.current?.focus()
  }, [step, round])

  useEffect(() => {
    if (picked !== null) nextRef.current?.focus()
  }, [picked])

  if (questions.length === 0) return null
  const total = questions.length
  const right = answers.filter(Boolean).length

  function start() {
    setAnswers([])
    setPicked(null)
    setStep(0)
  }

  function pick(i) {
    if (picked !== null) return
    const q = questions[step]
    const correct = q.choices[i].correct
    setPicked(i)
    setAnswers((a) => [...a, correct])
    if (correct && q.line !== null) flashLine(q.line)
  }

  function next() {
    setPicked(null)
    if (step + 1 < total) {
      setStep(step + 1)
      return
    }
    setStep('done')
    onDone({ right, total })
  }

  function again() {
    setRound((r) => r + 1)
    start()
  }

  const q = typeof step === 'number' ? questions[step] : null
  const missed = step === 'done' ? questions.find((x, i) => x.line !== null && !answers[i]) : null
  // One status line for the whole card, always there, so screen readers say each change.
  const status =
    step === 'done'
      ? `You got ${right} of ${total} right.`
      : q && picked !== null
        ? q.choices[picked].correct
          ? 'Correct!'
          : 'Not quite. The right answer is marked Correct.'
        : ''

  return (
    <section className="card check-card" aria-label="Check yourself">
      {step === null && (
        <button type="button" className="btn btn-outline check-start" onClick={start}>
          Check yourself · {total} {total === 1 ? 'question' : 'questions'}
        </button>
      )}

      {q && (
        <>
          {/* Keyed, so each question is a new element and its entrance plays. */}
          <div key={`q-${round}-${step}`} className="check-question" data-testid="check-question" tabIndex={-1} ref={headRef}>
            <p className="check-count">
              Question {step + 1} of {total}
            </p>
            {q.kind === 'line' ? (
              <>
                <code className="check-line" data-testid="check-prompt">
                  {q.prompt}
                </code>
                <p className="choice-prompt">Which sentence says what this line means?</p>
              </>
            ) : (
              <>
                <p className="flashcard-word" data-testid="check-prompt">
                  {q.prompt}
                </p>
                <p className="choice-prompt">Which meaning is right?</p>
              </>
            )}
          </div>
          <ChoiceList key={`c-${round}-${step}`} choices={q.choices} picked={picked} onPick={pick} />
        </>
      )}

      {/* The score shows big below, so the status line only speaks it then. */}
      <p role="status" className={`choice-result${step === 'done' ? ' visually-hidden' : ''}`}>
        {status}
      </p>

      {q && picked !== null && (
        <button ref={nextRef} type="button" className="btn btn-primary" onClick={next}>
          {step + 1 < total ? 'Next' : 'See the result'}
        </button>
      )}

      {step === 'done' && (
        <div className="check-result">
          <p className="check-score" tabIndex={-1} ref={headRef}>
            <strong>
              {right} of {total}
            </strong>
            {/* The score as stars, like the progress in Practice; they light up one after another. */}
            <span className="check-stars" aria-hidden="true">
              {answers.map((ok, i) => (
                <span
                  key={i}
                  className={`sp${ok ? ' sp-right' : ''}${right === total && i === total - 1 ? ' sp-pop' : ''}`}
                  style={{ '--i': i }}
                />
              ))}
            </span>
          </p>
          <div className="check-actions">
            {missed && (
              <button type="button" className="btn btn-outline" onClick={() => flashLine(missed.line, { scroll: true })}>
                Read line {num(missed.line)} again
              </button>
            )}
            <button type="button" className="btn btn-quiet" onClick={again}>
              Check again
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
