import HelpLine from './HelpLine.jsx'
import ListenButton from './ListenButton.jsx'

// A hard word opened from the user's text: its meaning, Listen and Save.
export default function WordPanel({ word, isSaved, onSave }) {
  const saved = isSaved(word)
  return (
    <div className="word-panel">
      <div className="word-panel-head">
        <span className="word-name">{word.word}</span>
        <ListenButton text={word.word} />
      </div>
      <p>{word.meaning}</p>
      <HelpLine help={word.help} field="meaning" />
      <button
        type="button"
        className="btn btn-outline"
        disabled={saved}
        aria-label={`${saved ? 'Saved' : 'Save'} ${word.word} to My Words`}
        onClick={() => onSave(word)}
      >
        {saved ? 'Saved' : 'Save to My Words'}
      </button>
    </div>
  )
}
