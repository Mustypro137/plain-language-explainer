import { useEffect, useRef, useState } from 'react'
import ChoiceList, { isPlainKey } from './ChoiceList.jsx'
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

  // Enter goes on to the next card once this one is answered.
  useEffect(() => {
    if (!answered) return undefined
    function onKeyDown(e) {
      if (!isPlainKey(e) || e.key !== 'Enter') return
      if (e.target instanceof Element && e.target.closest('a, button')) return
      e.preventDefault()
      onNext()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [answered, onNext])

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

      <ChoiceList choices={choices.map((c) => ({ text: c.meaning, correct: c.correct }))} picked={picked} onPick={pick} />

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
