import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { segmentText } from '../../shared/segments.js'
import CheckYourself from '../components/CheckYourself.jsx'
import HelpLine from '../components/HelpLine.jsx'
import LineByLine, { buildRows } from '../components/LineByLine.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { useToast } from '../components/Toast.jsx'
import WordChips from '../components/WordChips.jsx'
import { flyStar } from '../lib/flyStar.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import { decodeShare, readShareHash } from '../lib/share.js'
import { listWords, saveWord } from '../lib/wordStore.js'

const keyOf = (word) => word.trim().toLowerCase()

// "Share": an explanation someone sent as a link. Everything comes from the link itself, is
// checked like a History entry, and is shown read only. Nothing is added to History and the
// AI is never asked; the opener can still save the hard words into their own sky.
export default function SharedPage() {
  usePageTitle('Shared explanation')
  const { hash } = useLocation()
  const toast = useToast()
  // undefined while the link is being unpacked, null when it is broken.
  const [shared, setShared] = useState(undefined)
  const [myWords, setMyWords] = useState(listWords)

  useEffect(() => {
    let live = true
    const data = readShareHash(hash)
    if (!data) {
      setShared(null)
      return undefined
    }
    setShared(undefined)
    decodeShare(data).then((s) => live && setShared(s))
    return () => {
      live = false
    }
  }, [hash])

  const rows = useMemo(
    () => (shared?.result.lines?.length > 0 ? buildRows(segmentText(shared.text), shared.result.lines) : []),
    [shared],
  )
  const savedKeys = new Set(myWords.map((w) => keyOf(w.word)))
  const isSaved = (w) => savedKeys.has(keyOf(w.word))

  // el: the Save button, where the star starts its flight to My Words.
  function save(w, el) {
    // No source: the explanation it came from is not in this browser's History.
    const r = saveWord({ word: w.word, meaning: w.meaning, sentence: w.sentence, topic: w.topic, help: w.help })
    if (!r.ok && r.reason === 'storage') {
      toast('Your browser could not save this word.')
      return
    }
    setMyWords(listWords())
    if (r.ok) {
      toast('Saved to My Words')
      flyStar(el)
    }
  }

  if (shared === undefined) {
    return (
      <main className="page narrow-page">
        <meta name="robots" content="noindex" />
        <p className="soft" role="status">
          Opening the shared explanation…
        </p>
      </main>
    )
  }

  if (shared === null) {
    return (
      <main className="page narrow-page">
        <meta name="robots" content="noindex" />
        <h1>This link is broken or cut short</h1>
        <p className="soft">
          Some chat apps cut long links. Ask for the link again, or explain the text yourself.
        </p>
        <p>
          <Link className="btn btn-primary" to="/">
            Go to Explain
          </Link>
        </p>
      </main>
    )
  }

  const { text, result } = shared
  return (
    <main className="page narrow-page shared-page">
      <meta name="robots" content="noindex" />
      <div className="shared-banner">
        <h1>Shared explanation · read only</h1>
        <Link className="btn btn-primary" to="/">
          Explain your own text
        </Link>
      </div>
      {/* The answer cards use h3 titles, as on the Explain page, under an h2. */}
      <h2 className="visually-hidden">Explanation</h2>

      <ResultCard title="In simple words" raised>
        <p className="result-lead">{result.explanation}</p>
        <HelpLine help={result.help} field="explanation" />
      </ResultCard>
      {rows.length > 0 ? (
        <LineByLine text={text} lines={result.lines} words={result.words} known={myWords} isSaved={isSaved} onSave={save} />
      ) : (
        <ResultCard title="The text">
          <pre className="code-block">{text}</pre>
        </ResultCard>
      )}
      <ResultCard title="Why this happens">
        <p>{result.why}</p>
        <HelpLine help={result.help} field="why" />
      </ResultCard>
      {result.steps.length > 0 && (
        <ResultCard title="What to try next">
          <ol className="steps">
            {result.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </ResultCard>
      )}
      {result.example && (
        <ResultCard title="Practical example">
          <details className="fold">
            <summary>Show the example</summary>
            <pre className="code-block">{result.example}</pre>
          </details>
        </ResultCard>
      )}
      {result.words.length > 0 && (
        <ResultCard title="Hard words">
          <WordChips words={result.words} isSaved={isSaved} onSave={save} />
        </ResultCard>
      )}
      <CheckYourself rows={rows} words={result.words} onDone={() => {}} />
    </main>
  )
}
