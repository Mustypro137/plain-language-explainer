import EmptyState from '../components/EmptyState.jsx'
import { usePageTitle } from '../lib/usePageTitle.js'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <main className="page narrow-page">
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
