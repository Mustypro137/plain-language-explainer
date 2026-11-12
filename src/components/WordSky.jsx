import { isDue } from '../lib/practice.js'
import { LEVEL_NAMES, skyLayout } from '../lib/sky.js'

// My Words as a sky: a constellation per topic, a star per word. The bigger and fuller the
// star, the better the word is known; a dashed ring means it is fading (due for review).
// Every star is a real button, in reading order, so the sky works with a keyboard and a
// screen reader; the List view shows the same words as text.
const isNarrow = () => window.matchMedia?.('(max-width: 479px)').matches ?? false

export default function WordSky({ words, today, selectedId, onSelect }) {
  const clusters = skyLayout(words, isNarrow() ? 2 : undefined)
  return (
    <div className="sky">
      {clusters.map((c) => (
        <section key={c.topic} className={`sky-cluster topic-${c.index}`} aria-label={`${c.topic}, ${c.stars.length}`}>
          <h3 className="sky-topic" aria-hidden="true">
            {c.topic} <span className="sky-count">{c.stars.length}</span>
          </h3>
          <div className="sky-field" style={{ width: c.width, height: c.height }}>
            <svg className="sky-lines" aria-hidden="true" width={c.width} height={c.height}>
              <polyline points={c.stars.map((s) => `${s.x},${s.y}`).join(' ')} />
            </svg>
            {c.stars.map(({ word: w, x, y }) => {
              const due = isDue(w, today)
              const on = w.id === selectedId
              return (
                <button
                  key={w.id}
                  type="button"
                  data-star={w.id}
                  className={`star star-${w.box}${due ? ' star-due' : ''}${on ? ' star-on' : ''}`}
                  style={{ left: x, top: y }}
                  aria-pressed={on}
                  aria-label={`${w.word}, ${LEVEL_NAMES[w.box]}${due ? ', due today' : ''}`}
                  onClick={() => onSelect(on ? null : w.id)}
                >
                  <span className="star-dot" aria-hidden="true" />
                  <span className="star-label">{w.word}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
      <ul className="sky-legend" aria-hidden="true">
        <li>
          <span className="star-dot legend-3" />
          known
        </li>
        <li>
          <span className="star-dot legend-2" />
          learning
        </li>
        <li>
          <span className="star-dot legend-1" />
          new
        </li>
        <li>
          <span className="star-dot legend-due" />
          fading, due today
        </li>
      </ul>
    </div>
  )
}
