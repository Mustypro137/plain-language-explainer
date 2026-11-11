export const ROUND_SIZE = 10

export function buildRound(words, size = ROUND_SIZE) {
  return [...words]
    .sort((a, b) => a.box - b.box || a.savedAt.localeCompare(b.savedAt))
    .slice(0, size)
}

export function nextBox(box, knew) {
  return knew ? Math.min(box + 1, 3) : 1
}
