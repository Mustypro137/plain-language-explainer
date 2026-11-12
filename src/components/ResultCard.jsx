export default function ResultCard({ title, raised = false, children }) {
  return (
    <article className={`card result-card${raised ? ' card-raised' : ''}`}>
      <h3 className="label-chip">{title}</h3>
      {children}
    </article>
  )
}
