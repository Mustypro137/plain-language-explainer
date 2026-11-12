const R = 22
const LENGTH = 2 * Math.PI * R

// "0:37" under an hour, "2h" above it: short enough for the middle of the ring.
export function shortWait(seconds) {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`
  const m = Math.floor(seconds / 60)
  return `${m}:${String(seconds % 60).padStart(2, '0')}`
}

// How much of the wait is left, as a ring that empties. The text beside it says the same in
// words for screen readers, so the ring itself is hidden from them.
export default function CountdownRing({ remaining, total }) {
  const left = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0
  return (
    <svg className="countdown-ring" aria-hidden="true" width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={R} fill="none" stroke="var(--line-strong)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={R}
        fill="none"
        stroke="var(--star)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={LENGTH}
        strokeDashoffset={LENGTH * (1 - left)}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32.5" textAnchor="middle" className="countdown-text">
        {shortWait(remaining)}
      </text>
    </svg>
  )
}
