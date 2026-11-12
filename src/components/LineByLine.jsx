import { useId, useState } from 'react'
import { segmentText } from '../../shared/segments.js'
import { markWords } from '../lib/markWords.js'
import HelpLine from './HelpLine.jsx'
import WordPanel from './WordPanel.jsx'

const num = (n) => String(n).padStart(2, '0')

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
export default function LineByLine({ text, lines, words, isSaved, onSave }) {
  const [selected, setSelected] = useState(null)
  const id = useId()
  const rows = buildRows(segmentText(text), lines)
  const current = words.find((w) => w.word === selected) ?? null

  return (
    <section className="card lines" aria-labelledby={`${id}-title`}>
      <div className="lines-top">
        <h3 id={`${id}-title`} className="label-chip">
          Line by line
        </h3>
        {words.length > 0 && <p className="soft lines-hint">Tap a dotted word to see what it means.</p>}
      </div>
      <div className="lines-head" aria-hidden="true">
        <span>#</span>
        <span>Your text</span>
        <span>In plain English</span>
      </div>
      <ol className="lines-list">
        {rows.map((row) => (
          <li key={row.from} className={`line-row${row.plain ? '' : ' line-row-bare'}`}>
            <span className="line-num" aria-hidden="true">
              {row.to > row.from ? `${num(row.from)}–${num(row.to)}` : num(row.from)}
            </span>
            <code className="line-orig">
              <span className="visually-hidden">Your text: </span>
              {markWords(row.text, words).map((p, i) =>
                p.word ? (
                  <button
                    key={i}
                    type="button"
                    className={`mark${current === p.word ? ' mark-on' : ''}`}
                    aria-expanded={current === p.word}
                    aria-controls={`${id}-word`}
                    onClick={() => setSelected(current === p.word ? null : p.word.word)}
                  >
                    {p.text}
                  </button>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
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
        {current && <WordPanel word={current} isSaved={isSaved} onSave={onSave} />}
      </div>
    </section>
  )
}
