// "Line by line": the pasted text split into numbered parts. Used by the server (to number
// the parts for the AI) and by the app (to show each original part beside its plain
// version), so both always count the same way.
//
// A part is a line; a long line of prose (a docs paragraph) becomes one part per sentence.
// Short lines stay whole, so "npm ERR! ERESOLVE could not resolve" is one part, not two.
// Empty lines are skipped.

export const MAX_SEGMENTS = 40
const PROSE_LENGTH = 120

// A sentence ends with . ! or ? followed by a space and a capital, digit or quote.
// Error lines like "Found: react@19.0.0" or "at App (App.jsx:3:1)" stay whole.
const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z0-9"'`(])/

export function segmentText(text) {
  const parts = String(text)
    .split('\n')
    .map((line) => line.trim())
    .flatMap((line) => (line.length > PROSE_LENGTH ? line.split(SENTENCE_END) : [line]))
    .map((p) => p.trim())
    .filter(Boolean)
  // A very long stack trace: the tail becomes one last part, so the AI answer stays short.
  if (parts.length <= MAX_SEGMENTS) return parts
  return [...parts.slice(0, MAX_SEGMENTS - 1), parts.slice(MAX_SEGMENTS - 1).join('\n')]
}

// The numbered text the AI reads: "1| first part".
export const numberSegments = (parts) => parts.map((p, i) => `${i + 1}| ${p}`).join('\n')
