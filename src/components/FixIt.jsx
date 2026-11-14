import { useEffect, useId, useRef, useState } from 'react'

// Fix-it loop: the steps of "What to try next" as tick boxes, and the two ways a try ends.
// canTrack: the answer is kept in History (not an example), so ticks, links and "solved" can be kept.
export default function FixIt({ steps, done, onToggle, canTrack, solved, onStillBroken, onSolved }) {
  const id = useId()
  // After "It works now" the button goes away, so focus moves to the note that replaces it.
  const [justSolved, setJustSolved] = useState(false)
  const solvedRef = useRef(null)
  useEffect(() => {
    if (solved && justSolved) solvedRef.current?.focus()
  }, [solved, justSolved])

  return (
    <div className="fix-it">
      <ul className="steps steps-check" aria-describedby={`${id}-hint`}>
        {steps.map((s, i) => (
          <li key={i}>
            <label className="step-check">
              <input type="checkbox" checked={done.includes(i)} onChange={() => onToggle(i)} />
              <span>{s}</span>
            </label>
          </li>
        ))}
      </ul>
      <p id={`${id}-hint`} className="soft fix-it-hint">
        Tick what you have tried.
      </p>
      {canTrack &&
        (solved ? (
          <p className="fix-it-solved" role="status" tabIndex={-1} ref={solvedRef}>
            Solved. The steps you ticked are kept with this answer.
          </p>
        ) : (
          <div className="fix-it-actions">
            <button type="button" className="btn btn-outline" onClick={onStillBroken}>
              Still broken? Paste the new message
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setJustSolved(true)
                onSolved()
              }}
            >
              It works now
            </button>
          </div>
        ))}
    </div>
  )
}

// What changed between the last try's error and this one (from compareErrors).
export function ChangedStrip({ changes }) {
  const id = useId()
  const same = changes.gone.length === 0 && changes.added.length === 0
  return (
    <section className="card changed-strip" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="label-chip">
        What changed since the last try
      </h3>
      {same ? (
        <p>The error looks the same as last time.</p>
      ) : (
        <dl className="changed-list">
          {changes.gone.length > 0 && (
            <div>
              <dt>Gone</dt>
              {changes.gone.map((l) => (
                <dd key={l} className="changed-gone">
                  <code>{l}</code>
                </dd>
              ))}
            </div>
          )}
          {changes.added.length > 0 && (
            <div>
              <dt>New</dt>
              {changes.added.map((l) => (
                <dd key={l} className="changed-new">
                  <code>{l}</code>
                </dd>
              ))}
            </div>
          )}
        </dl>
      )}
    </section>
  )
}
