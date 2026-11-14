import HelpLine from './HelpLine.jsx'
import ListenButton from './ListenButton.jsx'

// A hard word opened from the user's text: its meaning, Listen and Save.
// note: an extra line for a word already saved ("You saved this 9 days ago").
export default function WordPanel({ word, isSaved, onSave, note = null }) {
  const saved = isSaved(word)
  return (
    <div className="word-panel">
      <div className="word-panel-head">
        <span className="word-name">{word.word}</span>
        <ListenButton text={word.word} />
      </div>
      <p>{word.meaning}</p>
      <HelpLine help={word.help} field="meaning" />
      {note && <p className="soft">{note}</p>}
      <button
        type="button"
        className="btn btn-outline"
        disabled={saved}
        aria-label={`${saved ? 'Saved' : 'Save'} ${word.word} to My Words`}
        onClick={(e) => onSave(word, e.currentTarget)}
      >
        {saved ? 'Saved' : 'Save to My Words'}
      </button>
    </div>
  )
}
