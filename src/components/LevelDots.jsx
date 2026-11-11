const LABELS = { 1: 'New', 2: 'Learning', 3: 'Known' }

export default function LevelDots({ box }) {
  return (
    <span className="level">
      <span className="level-dots" role="img" aria-label={`Level ${box} of 3`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`level-dot${n <= box ? ' level-dot-on' : ''}`} />
        ))}
      </span>
      {LABELS[box]}
    </span>
  )
}
