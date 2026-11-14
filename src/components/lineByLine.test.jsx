import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addHistory, listHistory } from '../lib/historyStore.js'
import { formatExplanation } from '../lib/formatExplanation.js'
import LevelSlider from './LevelSlider.jsx'
import LineByLine, { buildRows } from './LineByLine.jsx'

const text = 'TypeError: x is undefined\nat App (App.jsx:3:1)\nat render (react-dom.js:9:1)\nnpm ERR! peer react'
const lines = [
  { from: 1, to: 1, plain: 'Your code used a value that is not set.', help: { lang: 'es', plain: 'Un valor sin definir.' } },
  { from: 2, to: 3, plain: 'It happened in App.jsx at line 3.' },
]
const words = [{ word: 'undefined', meaning: 'A value that is not set.', sentence: 'x is undefined' }]

describe('buildRows', () => {
  const parts = ['a', 'b', 'c', 'd', 'e']

  test('one row per line, groups joined, parts without a line get a bare row', () => {
    expect(buildRows(parts, [{ from: 2, to: 3, plain: 'B and C.' }, { from: 5, to: 5, plain: 'E.' }])).toEqual([
      { from: 1, to: 1, text: 'a', plain: null },
      { from: 2, to: 3, text: 'b\nc', plain: 'B and C.', help: undefined },
      { from: 4, to: 4, text: 'd', plain: null },
      { from: 5, to: 5, text: 'e', plain: 'E.', help: undefined },
    ])
  })

  test('lines past the text are ignored', () => {
    expect(buildRows(['a'], [{ from: 3, to: 3, plain: 'x' }])).toEqual([{ from: 1, to: 1, text: 'a', plain: null }])
  })
})

describe('LineByLine', () => {
  function show(onSave = vi.fn(), isSaved = () => false) {
    render(<LineByLine text={text} lines={lines} words={words} isSaved={isSaved} onSave={onSave} />)
    return { user: userEvent.setup(), onSave }
  }
  const rows = () => within(screen.getByRole('region', { name: 'Line by line' })).getAllByRole('listitem')

  test('shows each part of the text beside its plain version, numbered', () => {
    show()
    expect(rows()).toHaveLength(3)
    expect(rows()[0]).toHaveTextContent('01')
    expect(rows()[0]).toHaveTextContent('Your code used a value that is not set.')
    expect(within(rows()[0]).getByText('Un valor sin definir.')).toHaveAttribute('lang', 'es')
    expect(rows()[1]).toHaveTextContent('02–03')
    expect(rows()[1]).toHaveTextContent('at App (App.jsx:3:1)')
    expect(rows()[1]).toHaveTextContent('It happened in App.jsx at line 3.')
    expect(rows()[2]).toHaveTextContent('No plain version for this part.')
  })

  test('a dotted hard word opens its meaning and can be saved', async () => {
    const { user, onSave } = show()
    const mark = screen.getByRole('button', { name: 'undefined' })
    expect(mark).toHaveAttribute('aria-expanded', 'false')
    await user.click(mark)
    expect(mark).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('A value that is not set.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save undefined to My Words' }))
    // The button comes too: the star flies from it to My Words.
    expect(onSave).toHaveBeenCalledWith(words[0], expect.any(HTMLButtonElement))
    await user.click(mark)
    expect(screen.queryByText('A value that is not set.')).not.toBeInTheDocument()
  })
})

describe('LevelSlider', () => {
  test('three radio stops, the current one checked', async () => {
    const onChange = vi.fn()
    render(<LevelSlider value={null} onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Reading level' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Normal' })).toBeChecked()
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Simpler' }))
    expect(onChange).toHaveBeenCalledWith('simpler')
  })

  test('is off while an answer is loading', () => {
    render(<LevelSlider value="detail" onChange={vi.fn()} disabled />)
    expect(screen.getByRole('radio', { name: 'More detail' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Simpler' })).toBeDisabled()
  })
})

test('copying an answer includes each part and what it means', () => {
  const result = { kind: 'error', explanation: 'E.', why: 'W.', steps: [], example: '', words: [], lines }
  expect(formatExplanation(result, text)).toContain(
    'Line by line\nTypeError: x is undefined\n→ Your code used a value that is not set.\nUn valor sin definir.\n\nat App (App.jsx:3:1)\nat render (react-dom.js:9:1)\n→ It happened in App.jsx at line 3.',
  )
})

describe('History keeps line-by-line answers', () => {
  beforeEach(() => localStorage.clear())
  const result = (l) => ({ kind: 'error', explanation: 'E.', why: 'W.', steps: [], example: '', words: [], lines: l })

  test('valid lines are kept, and answers without lines still count', () => {
    addHistory({ text: 'a', result: result(lines) })
    addHistory({ text: 'b', result: { ...result(lines), lines: undefined } })
    expect(listHistory()).toHaveLength(2)
  })

  test('an entry with a broken line is dropped on read', () => {
    addHistory({ text: 'a', result: result([{ from: 2, to: 1, plain: 'x' }]) })
    expect(listHistory()).toHaveLength(0)
  })
})

describe('stars in your text', () => {
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
  const starText = 'The Callback ran.\nx is undefined'
  const starLines = [
    { from: 1, to: 1, plain: 'A function ran.' },
    { from: 2, to: 2, plain: 'x is not set.' },
  ]
  const callback = { id: 'c', word: 'callback', meaning: 'A function you pass in.', sentence: '', savedAt: daysAgo(9), box: 1 }
  const undef = { id: 'u', word: 'undefined', meaning: 'Not set.', sentence: '', savedAt: daysAgo(1), box: 1 }

  function showStars(known) {
    render(<LineByLine text={starText} lines={starLines} words={words} known={known} isSaved={() => true} onSave={vi.fn()} />)
    return userEvent.setup()
  }

  test('a saved word in the text gets a star and the count line says how many are known', () => {
    showStars([callback])
    expect(screen.getByRole('button', { name: /^Callback, saved$/ })).toBeInTheDocument()
    expect(screen.getByText('You know 1 word here')).toBeInTheDocument()
  })

  test('a saved hard word is marked once, with the star', () => {
    showStars([callback, undef])
    expect(screen.getAllByRole('button', { name: /undefined/ })).toHaveLength(1)
    expect(screen.getByRole('button', { name: /^undefined, saved$/ })).toBeInTheDocument()
    expect(screen.getByText('You know 2 words here')).toBeInTheDocument()
  })

  test('tapping a saved word shows its own meaning and when it was saved', async () => {
    const user = showStars([callback])
    await user.click(screen.getByRole('button', { name: /^Callback, saved$/ }))
    expect(screen.getByText('A function you pass in.')).toBeInTheDocument()
    expect(screen.getByText('You saved this 9 days ago')).toBeInTheDocument()
  })

  test('a word saved yesterday says yesterday', async () => {
    const user = showStars([undef])
    await user.click(screen.getByRole('button', { name: /^undefined, saved$/ }))
    expect(screen.getByText('You saved this yesterday')).toBeInTheDocument()
  })

  test('no saved words in the text, no count line', () => {
    showStars([])
    expect(screen.queryByText(/You know/)).not.toBeInTheDocument()
  })
})

describe('stars count', () => {
  test('a saved word inside a longer hard word is not counted, since it gets no star', () => {
    const hard = [{ word: 'peer dependency', meaning: 'A package you install yourself.', sentence: '' }]
    const saved = [{ id: 'd', word: 'dependency', meaning: 'm', sentence: '', savedAt: new Date().toISOString(), box: 1 }]
    render(<LineByLine text="npm ERR! peer dependency" lines={[{ from: 1, to: 1, plain: 'p' }]} words={hard} known={saved} isSaved={() => false} onSave={vi.fn()} />)
    expect(screen.queryByText(/You know/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /saved$/ })).not.toBeInTheDocument()
  })
})
