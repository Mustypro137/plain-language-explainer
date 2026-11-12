// "Reading level": three stops on a track. Real radio buttons underneath, so arrow keys,
// screen readers and forms work as usual. null is the normal level.
const STOPS = [
  ['simpler', 'Simpler'],
  [null, 'Normal'],
  ['detail', 'More detail'],
]

export default function LevelSlider({ value, onChange, disabled }) {
  const at = STOPS.findIndex(([v]) => v === value)
  return (
    <fieldset className="level-slider" disabled={disabled} style={{ '--at': at }}>
      <legend className="mono-label">Reading level</legend>
      <div className="level-track">
        <span className="level-rail" aria-hidden="true">
          <span className="level-rail-fill" />
        </span>
        {STOPS.map(([v, label]) => (
          <label key={label} className={`level-stop${v === value ? ' level-stop-on' : ''}`}>
            <input
              type="radio"
              name="reading-level"
              className="visually-hidden"
              checked={v === value}
              onChange={() => onChange(v)}
            />
            <span className="stop-dot" aria-hidden="true" />
            <span className="stop-label">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
