import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { segmentText } from '../../shared/segments.js'
import { dayKey, daysBetween } from '../lib/days.js'
import { markWords, wordsIn } from '../lib/markWords.js'
import HelpLine from './HelpLine.jsx'
import WordPanel from './WordPanel.jsx'

const num = (n) => String(n).padStart(2, '0')
const keyOf = (word) => word.trim().toLowerCase()

// "Ask about a word": the words of a piece of text, with what lies between. A word runs over letters,
// digits and _ ' ’ . - (so "node_modules" and "Node.js" stay whole); only those the server takes
// (Latin letters, 2 to 40 characters) become buttons, so "café" never asks about "caf".
const WORD = /[\p{L}\p{N}_][\p{L}\p{N}_'’.-]*[\p{L}\p{N}_]|[\p{L}\p{N}_]/gu
const ASKABLE = /^[A-Za-z][\w'’.-]{1,39}$/
const MAX_LINE = 500
function splitWords(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(WORD)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) })
    out.push({ text: m[0], at: m.index, word: ASKABLE.test(m[0]) })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

// The line of a row's text that holds position `at`: a grouped row (a stack trace) sends one line.
function lineAt(text, at) {
  return text.slice(text.lastIndexOf('\n', at - 1) + 1, text.indexOf('\n', at) === -1 ? undefined : text.indexOf('\n', at)).trim()
}

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
// reveal: a new answer, whose plain sentences arrive row by row (CSS reads --i for the order).
// onAskWord(word, line) -> Promise<{ ok } | { ok: false, message }>: "Ask about a word" (no switch
// without it); askLeft: how many words may still be asked about for this answer.
export default function LineByLine({ text, lines, words, known = [], isSaved, onSave, reveal = false, onAskWord, askLeft = 0 }) {
  const [selected, setSelected] = useState(null)
  const [askMode, setAskMode] = useState(false)
  // The word being looked up, or why it could not be: { key, word, message? }.
  const [asking, setAsking] = useState(null)
  const askId = useRef(0)
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

  // Opening a word, or leaving word mode, outdates a lookup still on its way.
  function show(key) {
    askId.current++
    setAsking(null)
    setSelected(key)
  }

  async function ask(word, line) {
    const key = keyOf(word)
    if (marked.some((w) => keyOf(w.word) === key)) return show(key)
    const id = ++askId.current
    // The ask button is replaced by the word's mark when the answer comes; focus follows it there.
    const hadFocus = typeof document !== 'undefined' && document.activeElement?.dataset?.ask === key
    setSelected(null)
    setAsking({ key, word })
    const r = await onAskWord(word, line)
    if (id !== askId.current) return // another word was tapped meanwhile, or the mode was left
    if (r.ok) {
      setAsking(null)
      setSelected(key)
      if (hadFocus) focusKey.current = key
    } else {
      setAsking(r.message ? { key, word, message: r.message } : null)
    }
  }

  const sectionRef = useRef(null)
  const focusKey = useRef(null)
  useEffect(() => {
    if (!focusKey.current) return
    sectionRef.current?.querySelector(`[data-mark="${CSS.escape(focusKey.current)}"]`)?.focus()
    focusKey.current = null
  })

  // A plain piece of the text, starting at `at` in the row: in word mode, each word becomes a
  // button that asks about it within its own line (none for a line too long to send).
  function plainPiece(piece, i, rowText, at) {
    if (!askMode || askLeft <= 0) return <span key={i}>{piece.text}</span>
    return (
      <span key={i}>
        {splitWords(piece.text).map((part, j) => {
          const line = part.word ? lineAt(rowText, at + part.at) : ''
          return part.word && line.length <= MAX_LINE ? (
            <button key={j} type="button" className="mark mark-ask" data-ask={keyOf(part.text)} onClick={() => ask(part.text, line)}>
              {part.text}
            </button>
          ) : (
            <span key={j}>{part.text}</span>
          )
        })}
      </span>
    )
  }
  const currentSaved = current ? savedByKey.get(keyOf(current.word)) : null

  return (
    <section ref={sectionRef} className={`card lines${reveal ? ' lines-reveal' : ''}`} aria-labelledby={`${id}-title`}>
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
        {onAskWord && (
          <button
            type="button"
            className="btn btn-quiet ask-toggle"
            aria-pressed={askMode}
            onClick={() => {
              setAskMode(!askMode)
              show(selected)
            }}
          >
            Ask about a word
          </button>
        )}
        {/* Always there, so screen readers hear the hint when word mode turns on. */}
        {onAskWord && (
          <p className="soft ask-hint" aria-live="polite" hidden={!askMode}>
            {askMode &&
              (askLeft > 0
                ? `Tap any word in your text. ${askLeft} of 5 left.`
                : 'You have asked about 5 words for this answer.')}
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
          <li
            key={row.from}
            data-line={row.from}
            className={`line-row${row.plain ? '' : ' line-row-bare'}`}
            style={{ '--i': r }}
          >
            <span className="line-num" aria-hidden="true">
              {row.to > row.from ? `${num(row.from)}–${num(row.to)}` : num(row.from)}
            </span>
            <code className="line-orig">
              <span className="visually-hidden">Your text: </span>
              {marks[r].map((p, i, all) => {
                if (!p.word) return plainPiece(p, i, row.text, all.slice(0, i).reduce((n, q) => n + q.text.length, 0))
                const key = keyOf(p.word.word)
                const isKnown = savedByKey.has(key)
                const on = selected === key
                return (
                  <button
                    key={i}
                    type="button"
                    className={`mark${isKnown ? ' mark-known' : ''}${hardKeys.has(key) ? '' : ' mark-plain'}${on ? ' mark-on' : ''}`}
                    data-mark={key}
                    aria-expanded={on}
                    aria-controls={`${id}-word`}
                    onClick={() => show(on ? null : key)}
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
        {asking && (
          <p className={`word-asking${asking.message ? ' word-asking-error' : ''}`}>
            {asking.message ?? `Looking up “${asking.word}”…`}
          </p>
        )}
        {!asking && current && (
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
