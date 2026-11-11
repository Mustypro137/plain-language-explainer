export default function Skeleton() {
  return (
    <div className="skeleton-stack" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div className="card skeleton-card" key={i}>
          <span className="skeleton-line skeleton-chip" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-short" />
        </div>
      ))}
    </div>
  )
}
