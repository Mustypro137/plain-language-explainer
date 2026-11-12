import { Link, NavLink } from 'react-router-dom'
import { useDueCount, useWordCount } from '../lib/useDueCount.js'
import { APP_NAME } from '../lib/usePageTitle.js'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header() {
  const due = useDueCount()
  const saved = useWordCount()
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            Aa
          </span>
          <span>{APP_NAME}</span>
        </Link>
        <nav className="main-nav" aria-label="Main">
          <NavLink to="/" end>
            Explain
          </NavLink>
          {/* The save-a-star animation flies here (data-star-target). */}
          <NavLink to="/words" data-star-target="" aria-label={saved > 0 ? `My Words, ${saved} saved` : undefined}>
            My Words
            {saved > 0 && (
              <span className="nav-stars" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
                </svg>
                {saved}
              </span>
            )}
          </NavLink>
          <NavLink to="/practice" aria-label={due > 0 ? `Practice, ${due} due` : undefined}>
            Practice
            {due > 0 && (
              <span className="nav-count" aria-hidden="true">
                {due}
              </span>
            )}
          </NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
