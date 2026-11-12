import { useId, useState } from 'react'
import { TOPICS } from '../../shared/topics.js'
import { MAX_MEANING, MAX_NOTE, MAX_SENTENCE, MAX_WORD } from '../lib/wordStore.js'

// Add a word by hand (withWord) or edit a saved one: meaning, topic and your own note.
// onSubmit(values) returns an error message to show, or null when it is saved.
export default function WordForm({ initial = {}, withWord = false, title, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    word: initial.word ?? '',
    meaning: initial.meaning ?? '',
    sentence: initial.sentence ?? '',
    topic: initial.topic ?? 'General',
    note: initial.note ?? '',
  })
  const [error, setError] = useState(null)
  const id = useId()
  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setError(null)
  }

  function submit(e) {
    e.preventDefault()
    if (withWord && values.word.trim() === '') return setError('Please type the word.')
    if (values.meaning.trim() === '') return setError('Please write what the word means.')
    setError(onSubmit(values))
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <form className="word-form stack-sm" aria-labelledby={`${id}-title`} onSubmit={submit} onKeyDown={onKeyDown}>
      <h2 id={`${id}-title`} className="word-form-title">
        {title}
      </h2>
      {withWord && (
        <div className="stack-xs">
          <label htmlFor={`${id}-word`} className="field-label">
            Word
          </label>
          <input
            id={`${id}-word`}
            className="search-box"
            maxLength={MAX_WORD}
            autoComplete="off"
            value={values.word}
            onChange={set('word')}
            autoFocus
          />
        </div>
      )}
      <div className="stack-xs">
        <label htmlFor={`${id}-meaning`} className="field-label">
          Meaning
        </label>
        <textarea
          id={`${id}-meaning`}
          className="search-box"
          rows={2}
          maxLength={MAX_MEANING}
          value={values.meaning}
          onChange={set('meaning')}
          autoFocus={!withWord}
        />
      </div>
      {withWord && (
        <div className="stack-xs">
          <label htmlFor={`${id}-sentence`} className="field-label">
            A sentence that uses it <span className="soft">(optional)</span>
          </label>
          <textarea
            id={`${id}-sentence`}
            className="search-box"
            rows={2}
            maxLength={MAX_SENTENCE}
            value={values.sentence}
            onChange={set('sentence')}
          />
        </div>
      )}
      <div className="stack-xs">
        <label htmlFor={`${id}-topic`} className="field-label">
          Topic
        </label>
        <select id={`${id}-topic`} className="search-box" value={values.topic} onChange={set('topic')}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="stack-xs">
        <label htmlFor={`${id}-note`} className="field-label">
          My note <span className="soft">(optional)</span>
        </label>
        <textarea
          id={`${id}-note`}
          className="search-box"
          rows={2}
          maxLength={MAX_NOTE}
          placeholder="Anything that helps you remember it"
          value={values.note}
          onChange={set('note')}
        />
      </div>
      {error && (
        <p className="count-over" role="alert">
          {error}
        </p>
      )}
      <div className="page-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
