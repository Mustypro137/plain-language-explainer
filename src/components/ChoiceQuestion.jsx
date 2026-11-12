import { useEffect, useRef, useState } from 'react'
import ListenButton from './ListenButton.jsx'

// One multiple-choice question. Give it a new `key` for each card so the pick resets.
export default function ChoiceQuestion({ card, choices, onAnswer, onNext }) {
  const [picked, setPicked] = useState(null)
  const nextRef = useRef(null)
  const answered = picked !== null

  function pick(i) {
    if (answered) return
    setPicked(i)
    onAnswer(choices[i].correct)
  }

  useEffect(() => {
    if (answered) nextRef.current?.focus()
  }, [answered])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable]')) return
      if (!answered) {
        const n = Number(e.key)
        if (Number.isInteger(n) && n >= 1 && n <= choices.length) pick(n - 1)
      } else if (e.key === 'Enter' && !target?.closest('a, button')) {
        e.preventDefault()
        onNext()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  const stateOf = (c, i) => (!answered ? '' : c.correct ? 'correct' : i === picked ? 'wrong' : 'other')
  const result = !answered ? '' : choices[picked].correct ? 'Correct!' : 'Not quite. The right meaning is marked Correct.'

  return (
    <>
      <section className="choice-card" aria-label="Question">
        <div className="word-name-row">
          <span className="flashcard-word">{card.word}</span>
          <ListenButton text={card.word} />
        </div>
        <p className="choice-prompt">Which meaning is right?</p>
      </section>

      <ol className="choice-list" aria-label="Choices">
        {choices.map((c, i) => {
          const state = stateOf(c, i)
          return (
            <li key={i}>
              <button
                type="button"
                className={`btn choice${state ? ` choice-${state}` : ''}`}
                aria-disabled={answered || undefined}
                onClick={() => pick(i)}
              >
                <kbd>{i + 1}</kbd>
                <span className="choice-text">
                  {state === 'correct' && <strong className="choice-tag">Correct</strong>}
                  {state === 'wrong' && <strong className="choice-tag">Not this one</strong>}
                  {c.meaning}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <p role="status" className="choice-result">
        {result}
      </p>

      {answered && (
        <div className="choice-after">
          <p className="flashcard-sentence">{card.sentence}</p>
          <button ref={nextRef} type="button" className="btn btn-primary" onClick={onNext}>
            Next
          </button>
        </div>
      )}
    </>
  )
}
