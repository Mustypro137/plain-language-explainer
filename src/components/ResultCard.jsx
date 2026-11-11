export default function ResultCard({ tone, title, raised = false, children }) {
  return (
    <article className={`card result-card${raised ? ' card-raised' : ''}`}>
      <h3 className={`label-chip tone-${tone}`}>{title}</h3>
      {children}
    </article>
  )
}
