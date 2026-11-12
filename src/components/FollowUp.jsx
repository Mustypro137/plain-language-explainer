import { useId, useState } from 'react'
import { MAX_FOLLOW_UPS } from '../lib/historyStore.js'
import HelpLine from './HelpLine.jsx'

export const MAX_QUESTION = 300

const ERRORS = {
  offline: 'No connection. Your question is still in the box.',
  busy: 'The service is busy. Please try again in a minute.',
}

// "Ask about this": a question about the explanation on screen, answered by the AI.
// onAsk(question) resolves to { ok } or { ok: false, error, waiting }. Give it a new `key` for each answer.
export default function FollowUp({ items, onAsk, waitText }) {
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState(null)
  const fieldId = useId()
  const headingId = useId()
  const left = MAX_FOLLOW_UPS - items.length
  const canAsk = question.trim() !== '' && !asking && !waitText && left > 0

  async function submit(e) {
    e?.preventDefault()
    if (!canAsk) return
    setAsking(true)
    setError(null)
    const r = await onAsk(question.trim())
    setAsking(false)
    if (r.ok) setQuestion('')
    // A used-up limit shows its countdown (waitText) instead of an error.
    else if (!r.waiting) setError(r.error)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e)
  }

  return (
    <section className="card follow-up" aria-labelledby={headingId}>
      <h3 id={headingId} className="label-chip tone-teal">
        Ask about this
      </h3>

      {/* Present from the start, so a new answer is read out when it arrives. */}
      <div aria-live="polite">
        {items.length > 0 && (
          <ol className="follow-up-list">
            {items.map((f, i) => (
              <li key={i} className="follow-up-item">
                <p className="follow-up-question">{f.question}</p>
                <p>{f.answer}</p>
                <HelpLine help={f.help} field="answer" />
              </li>
            ))}
          </ol>
        )}
      </div>

      {left > 0 ? (
        <form className="stack-xs" onSubmit={submit}>
          <label htmlFor={fieldId} className="field-label">
            {items.length === 0 ? 'Still a doubt? Ask a question about this text' : 'Ask another question'}
          </label>
          <textarea
            id={fieldId}
            className="follow-up-box"
            rows={2}
            maxLength={MAX_QUESTION}
            placeholder="For example: what is a prop?"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value)
              setError(null)
            }}
            onKeyDown={onKeyDown}
          />
          <div className="follow-up-actions">
            <button type="submit" className="btn btn-primary" disabled={!canAsk}>
              {asking ? 'Asking…' : 'Ask'}
            </button>
            <span className="soft">
              {left} of {MAX_FOLLOW_UPS} questions left for this text
            </span>
          </div>
        </form>
      ) : (
        <p className="soft">
          You asked {MAX_FOLLOW_UPS} questions about this text. Explain a new text to ask more. This keeps the shared
          free AI working for everyone.
        </p>
      )}

      {waitText && <p className="follow-up-error">{waitText}</p>}
      {error && (
        <p className="follow-up-error" role="alert">
          {ERRORS[error] ?? 'Something went wrong. Please try again.'}
        </p>
      )}
    </section>
  )
}
