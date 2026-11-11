const unit = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const join = (a, b) => (b ? `${a} ${b}` : a)

// How long until the free AI limit opens again, in plain words.
export function formatWait(seconds) {
  if (seconds < 60) return unit(seconds, 'second')
  if (seconds < 3600) {
    const s = seconds % 60
    return join(unit(Math.floor(seconds / 60), 'minute'), s && unit(s, 'second'))
  }
  // Over an hour, seconds do not matter; round up to the next minute.
  const minutes = Math.ceil(seconds / 60)
  const m = minutes % 60
  return join(unit(Math.floor(minutes / 60), 'hour'), m && unit(m, 'minute'))
}
