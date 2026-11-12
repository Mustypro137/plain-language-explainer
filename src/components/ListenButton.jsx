import { canSpeak, speak } from '../lib/speech.js'

export default function ListenButton({ text, className = '' }) {
  if (!canSpeak()) return null
  return (
    <button
      type="button"
      className={`btn listen-btn ${className}`.trim()}
      aria-label={`Listen to ${text}`}
      title="Listen"
      onClick={() => speak(text)}
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  )
}
