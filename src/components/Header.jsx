import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            Aa
          </span>
          <span>Plain-Language Explainer</span>
        </div>
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
