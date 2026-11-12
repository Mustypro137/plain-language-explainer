import EmptyState from '../components/EmptyState.jsx'
import { usePageTitle } from '../lib/usePageTitle.js'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <main className="page narrow-page">
      {/* The server answers every address with the app (status 200), so search engines are told here
          not to keep this one. React puts the tag in <head> and removes it when the page changes. */}
      <meta name="robots" content="noindex" />
      <h1>Page not found</h1>
      <EmptyState
        title="There is nothing at this address"
        text="Check the address for a typing mistake, or start again from the Explain page."
        linkTo="/"
        linkLabel="Go to Explain"
      />
    </main>
  )
}
