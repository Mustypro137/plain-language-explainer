import { useId, useMemo, useState } from 'react'
import { segmentText } from '../../shared/segments.js'
import { dayKey, daysBetween } from '../lib/days.js'
import { markWords, wordsIn } from '../lib/markWords.js'
import HelpLine from './HelpLine.jsx'
import WordPanel from './WordPanel.jsx'

const num = (n) => String(n).padStart(2, '0')
const keyOf = (word) => word.trim().toLowerCase()

function savedWhen(savedAt) {
  const days = daysBetween(dayKey(new Date(savedAt)), dayKey())
  return `You saved this ${days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`
}

// One row per AI line (which may cover several parts, like a stack trace). Parts the AI
// skipped still get a row, without a plain version, so the user's text is always complete.
export function buildRows(parts, lines) {
  const rows = []
  let next = 1
  const plainRow = (i) => ({ from: i, to: i, text: parts[i - 1], plain: null })
  for (const l of lines) {
    if (l.from > parts.length) break
    for (; next < l.from; next++) rows.push(plainRow(next))
    const to = Math.min(l.to, parts.length)
    rows.push({ from: l.from, to, text: parts.slice(l.from - 1, to).join('\n'), plain: l.plain, help: l.help })
    next = to + 1
  }
  for (; next <= parts.length; next++) rows.push(plainRow(next))
  return rows
}

// "Line by line": the user's text, part by part, beside what each part means. Hard words
// are dotted; a tap opens the word below the table.
// known: the visitor's saved words. Those in the text get a star, and the line above the
// table says how many of them are here.
export default function LineByLine({ text, lines, words, known = [], isSaved, onSave }) {
  const [selected, setSelected] = useState(null)
  const id = useId()
  // Worked out once per answer, not on every keystroke: only the saved words that occur in this
  // text take part in the marking, so a long word list costs nothing extra per row.
  const { rows, marks, savedByKey, hardKeys, marked, knownCount } = useMemo(() => {
    const rows = buildRows(segmentText(text), lines)
    const savedByKey = new Map(known.map((w) => [keyOf(w.word), w]))
    const hardKeys = new Set(words.map((w) => keyOf(w.word)))
    const present = wordsIn(text, known).filter((w) => !hardKeys.has(keyOf(w.word)))
    const marked = [...words, ...present]
    const marks = rows.map((row) => markWords(row.text, marked))
    // Count the stars actually drawn: a saved word inside a longer hard word gets none.
    const starred = new Set()
    for (const pieces of marks) for (const p of pieces) if (p.word && savedByKey.has(keyOf(p.word.word))) starred.add(keyOf(p.word.word))
    return { rows, marks, savedByKey, hardKeys, marked, knownCount: starred.size }
  }, [text, lines, words, known])
  const current = marked.find((w) => keyOf(w.word) === selected) ?? null
  const currentSaved = current ? savedByKey.get(keyOf(current.word)) : null

  return (
    <section className="card lines" aria-labelledby={`${id}-title`}>
      <div className="lines-top">
        <h3 id={`${id}-title`} className="label-chip">
          Line by line
        </h3>
        {words.length > 0 && <p className="soft lines-hint">Tap a dotted word to see what it means.</p>}
        {knownCount > 0 && (
          <p className="known-count">
            <span className="mark-star" aria-hidden="true">★</span> You know {knownCount} {knownCount === 1 ? 'word' : 'words'} here
          </p>
        )}
      </div>
      <div className="lines-head" aria-hidden="true">
        <span>#</span>
        <span>Your text</span>
        <span>In plain English</span>
      </div>
      <ol className="lines-list">
        {rows.map((row, r) => (
          <li key={row.from} data-line={row.from} className={`line-row${row.plain ? '' : ' line-row-bare'}`}>
            <span className="line-num" aria-hidden="true">
              {row.to > row.from ? `${num(row.from)}–${num(row.to)}` : num(row.from)}
            </span>
            <code className="line-orig">
              <span className="visually-hidden">Your text: </span>
              {marks[r].map((p, i) => {
                if (!p.word) return <span key={i}>{p.text}</span>
                const key = keyOf(p.word.word)
                const isKnown = savedByKey.has(key)
                const on = selected === key
                return (
                  <button
                    key={i}
                    type="button"
                    className={`mark${isKnown ? ' mark-known' : ''}${hardKeys.has(key) ? '' : ' mark-plain'}${on ? ' mark-on' : ''}`}
                    aria-expanded={on}
                    aria-controls={`${id}-word`}
                    onClick={() => setSelected(on ? null : key)}
                  >
                    {p.text}
                    {isKnown && (
                      <>
                        <span className="mark-star" aria-hidden="true">★</span>
                        <span className="visually-hidden">, saved</span>
                      </>
                    )}
                  </button>
                )
              })}
            </code>
            <div className="line-plain">
              {row.plain ? (
                <>
                  <p>
                    <span className="visually-hidden">In plain English: </span>
                    {row.plain}
                  </p>
                  <HelpLine help={row.help} field="plain" />
                </>
              ) : (
                <p className="soft">
                  <span aria-hidden="true">—</span>
                  <span className="visually-hidden">No plain version for this part.</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div id={`${id}-word`} className="word-panel-slot" aria-live="polite">
        {current && (
          <WordPanel
            word={current}
            isSaved={currentSaved ? () => true : isSaved}
            onSave={onSave}
            note={currentSaved ? savedWhen(currentSaved.savedAt) : null}
          />
        )}
      </div>
    </section>
  )
}
