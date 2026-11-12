import { Link, NavLink } from 'react-router-dom'
import { APP_NAME } from '../lib/usePageTitle.js'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header() {
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
          <NavLink to="/words">My Words</NavLink>
          <NavLink to="/practice">Practice</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
