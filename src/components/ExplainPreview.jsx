import { Link } from 'react-router-dom'

// The answer column before the first answer: one real line pair to show what "line by line"
// means, what else comes with it, and (for someone who has saved words) their sky.
export default function ExplainPreview({ savedCount = 0 }) {
  return (
    <div className="preview">
      <div className="card preview-card">
        <div className="demo-pair">
          <span className="visually-hidden">For example, the line </span>
          <span className="line-num" aria-hidden="true">
            02
          </span>
          <code className="line-orig">npm ERR! could not resolve</code>
          <p className="demo-plain">
            <span className="visually-hidden">becomes: </span>npm could not find package versions that fit together.
          </p>
        </div>
        <ol className="preview-points">
          <li>
            <span className="preview-num" aria-hidden="true">
              1
            </span>
            Each line of your text, in plain English
          </li>
          <li>
            <span className="preview-num" aria-hidden="true">
              2
            </span>
            Why it happens and what to try next
          </li>
          <li>
            <span className="preview-num" aria-hidden="true">
              3
            </span>
            Hard words you can keep: each one becomes a star in your sky
          </li>
        </ol>
      </div>
      {savedCount > 0 && (
        <Link className="sky-card" to="/words">
          <span className="sky-card-stars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>
              {savedCount} {savedCount === 1 ? 'word' : 'words'} in your sky.
            </strong>{' '}
            Brighter means better known.
          </span>
        </Link>
      )}
    </div>
  )
}
