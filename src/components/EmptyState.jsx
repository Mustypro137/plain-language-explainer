import { Link } from 'react-router-dom'

export default function EmptyState({ title, text, linkTo, linkLabel }) {
  return (
    <section className="empty-state">
      <svg aria-hidden="true" width="160" height="120" viewBox="0 0 160 120" fill="none">
        <rect x="30" y="22" width="100" height="76" rx="8" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
        <rect x="42" y="38" width="52" height="14" rx="4" fill="var(--sunshine)" stroke="var(--ink)" strokeWidth="2" />
        <rect x="42" y="62" width="76" height="8" rx="4" fill="var(--line)" />
        <rect x="42" y="78" width="48" height="8" rx="4" fill="var(--line)" />
        <circle cx="128" cy="26" r="12" fill="var(--violet)" stroke="var(--ink)" strokeWidth="2" />
        <path d="M122 26h12M128 20v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2>{title}</h2>
      <p className="soft">{text}</p>
      <Link className="btn btn-outline" to={linkTo}>
        {linkLabel}
      </Link>
    </section>
  )
}
