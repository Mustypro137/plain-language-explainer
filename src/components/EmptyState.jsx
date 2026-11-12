import { Link } from 'react-router-dom'

// A few faint stars and one dashed one: the place where something will appear.
export default function EmptyState({ title, text, linkTo, linkLabel, children }) {
  return (
    <section className="empty-state card">
      <svg aria-hidden="true" width="150" height="76" viewBox="0 0 150 76" fill="none">
        <path d="M24 52 L75 20 L124 50" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="3 5" />
        <circle cx="24" cy="52" r="5" fill="var(--line-strong)" />
        <circle cx="124" cy="50" r="4" fill="var(--line-strong)" />
        <circle cx="75" cy="20" r="11" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="4 4" />
      </svg>
      <h2>{title}</h2>
      <p className="soft">{text}</p>
      <div className="page-actions empty-actions">
        <Link className="btn btn-primary" to={linkTo}>
          {linkLabel}
        </Link>
        {children}
      </div>
    </section>
  )
}
