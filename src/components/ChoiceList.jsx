import { useEffect } from 'react'

// Keys typed into a field belong to the field, and shortcuts with Ctrl, ⌘ or Alt belong to the browser.
export function isPlainKey(e) {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return false
  const target = e.target instanceof Element ? e.target : null
  return !target?.closest('input, textarea, select, [contenteditable]')
}

// A numbered list of answers to pick from, used by multiple choice in Practice and by
// "Check yourself" under an answer. Keys 1 to n pick until something is picked; then the
// pick and the right answer are marked.
export default function ChoiceList({ choices, picked, onPick, label = 'Choices' }) {
  const answered = picked !== null

  useEffect(() => {
    if (answered) return undefined
    function onKeyDown(e) {
      if (!isPlainKey(e)) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= choices.length) onPick(n - 1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [answered, choices.length, onPick])

  const stateOf = (c, i) => (!answered ? '' : c.correct ? 'correct' : i === picked ? 'wrong' : 'other')

  return (
    <ol className="choice-list" aria-label={label}>
      {choices.map((c, i) => {
        const state = stateOf(c, i)
        return (
          <li key={i}>
            <button
              type="button"
              className={`btn choice${state ? ` choice-${state}` : ''}`}
              aria-disabled={answered || undefined}
              onClick={() => !answered && onPick(i)}
            >
              <kbd>{i + 1}</kbd>
              <span className="choice-text">
                {state === 'correct' && <strong className="choice-tag">Correct</strong>}
                {state === 'wrong' && <strong className="choice-tag">Not this one</strong>}
                {c.text}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
