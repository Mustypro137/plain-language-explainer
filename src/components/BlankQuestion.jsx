import { useEffect, useId, useRef, useState } from 'react'
import ListenButton from './ListenButton.jsx'

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ')

// "Fill the blank": the saved sentence with the word hidden, and its meaning as the clue.
// pieces come from blankOut(). Give it a new `key` for each card so the answer resets.
export default function BlankQuestion({ card, pieces, onAnswer, onNext }) {
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState(null) // null | 'right' | 'wrong'
  const inputId = useId()
  const inputRef = useRef(null)
  const nextRef = useRef(null)
  const answered = result !== null

  useEffect(() => {
    if (answered) nextRef.current?.focus()
    else inputRef.current?.focus({ preventScroll: true })
  }, [answered])

  function finish(right) {
    setResult(right ? 'right' : 'wrong')
    onAnswer(right)
  }

  function check(e) {
    e.preventDefault()
    if (answered || typed.trim() === '') return
    const t = norm(typed)
    // The form used in the sentence ("dependencies") and the saved word ("dependency") both count.
    finish(norm(card.word) === t || pieces.some((p) => p.blank && norm(p.text) === t))
  }

  return (
    <>
      <section className="choice-card blank-card" aria-label="Question">
        <p className="blank-sentence">
          {pieces.map((p, i) =>
            !p.blank ? (
              <span key={i}>{p.text}</span>
            ) : answered ? (
              <strong key={i} className="blank-filled">
                {p.text}
              </strong>
            ) : (
              <span key={i} className="blank">
                <span className="visually-hidden">blank</span>
              </span>
            ),
          )}
        </p>
        <p className="choice-prompt">
          <span className="blank-clue">Meaning:</span> {card.meaning}
        </p>
      </section>

      <form className="blank-form" onSubmit={check}>
        <label htmlFor={inputId} className="field-label">
          The missing word
        </label>
        <div className="blank-row">
          <input
            ref={inputRef}
            id={inputId}
            className="search-box"
            value={typed}
            readOnly={answered}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setTyped(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={answered || typed.trim() === ''}>
            Check
          </button>
        </div>
        {!answered && (
          <button type="button" className="btn btn-quiet" onClick={() => finish(false)}>
            Show the word
          </button>
        )}
      </form>

      <p role="status" className="choice-result">
        {result === 'right' ? 'Correct!' : result === 'wrong' ? `The word is “${card.word}”.` : ''}
      </p>

      {answered && (
        <div className="choice-after">
          <div className="word-name-row">
            <span className="flashcard-word">{card.word}</span>
            <ListenButton text={card.word} />
          </div>
          <button ref={nextRef} type="button" className="btn btn-primary" onClick={onNext}>
            Next
          </button>
        </div>
      )}
    </>
  )
}
