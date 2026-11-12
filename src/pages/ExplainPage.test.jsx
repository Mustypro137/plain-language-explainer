import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
import { askAbout, explainText } from '../lib/explainText.js'
import { formatExplanation } from '../lib/formatExplanation.js'
import { addHistory, getHistoryItem, listHistory } from '../lib/historyStore.js'
import { SAMPLES } from '../lib/samples.js'
import { hasWord, listWords, saveWord } from '../lib/wordStore.js'
import ExplainPage from './ExplainPage.jsx'

vi.mock('../lib/explainText.js')

const errorData = {
  kind: 'error',
  explanation: 'Your code used .map() on nothing.',
  why: 'The list was not ready.',
  steps: ['Open line 14', 'Add an empty list'],
  example: 'const [a] = useState([])',
  words: [
    { word: 'undefined', meaning: 'A value that is not set.', sentence: 'x is undefined' },
    { word: 'property', meaning: 'A named value.', sentence: 'reading a property' },
  ],
}
const docsData = { ...errorData, kind: 'docs', steps: [] }

function Address() {
  const { pathname, search } = useLocation()
  return <span data-testid="address">{pathname + search}</span>
}

function setup(path = '/') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <ExplainPage />
        <Address />
      </ToastProvider>
    </MemoryRouter>,
  )
  return user
}

const explainButton = () => screen.getByRole('button', { name: 'Explain' })

async function submit(user, text = 'some text') {
  await user.type(screen.getByLabelText('Your text'), text)
  await user.click(explainButton())
}

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
})
afterEach(() => vi.restoreAllMocks())

test('Explain is disabled until text is typed', async () => {
  const user = setup()
  expect(explainButton()).toBeDisabled()
  await user.type(screen.getByLabelText('Your text'), 'a')
  expect(explainButton()).toBeEnabled()
})

test('shows the secret-key note and the count', async () => {
  const user = setup()
  expect(
    screen.getByText('Do not paste passwords or secret keys. Explanations are kept in History in this browser.'),
  ).toBeInTheDocument()
  expect(screen.getByText('0 / 3,000')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Your text'), 'hello')
  expect(screen.getByText('5 / 3,000')).toBeInTheDocument()
})

test('shows the count and blocks text over 3,000 characters', async () => {
  const user = setup()
  await user.click(screen.getByLabelText('Your text'))
  await user.paste('a'.repeat(3001))
  expect(screen.getByText('3,001 / 3,000')).toBeInTheDocument()
  expect(screen.getByText('Please shorten the text')).toBeInTheDocument()
  expect(explainButton()).toBeDisabled()
})

test('shows five parts for an error answer', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user)
  for (const name of ['In simple words', 'Why this happens', 'What to try next', 'Practical example', 'Hard words']) {
    expect(await screen.findByRole('heading', { level: 3, name })).toBeInTheDocument()
  }
  expect(explainText).toHaveBeenCalledWith('some text', null, null)
})

test('hides What to try next for a docs answer', async () => {
  explainText.mockResolvedValue({ ok: true, data: docsData })
  const user = setup()
  await submit(user)
  expect(await screen.findByRole('heading', { name: 'In simple words' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'What to try next' })).not.toBeInTheDocument()
})

test('a double click sends one request', async () => {
  explainText.mockReturnValue(new Promise(() => {}))
  const user = setup()
  await user.type(screen.getByLabelText('Your text'), 'x')
  await user.dblClick(explainButton())
  expect(explainText).toHaveBeenCalledTimes(1)
})

test('shows a busy skeleton while waiting', async () => {
  explainText.mockReturnValue(new Promise(() => {}))
  const user = setup()
  await submit(user)
  expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('shows HTML in the answer as plain text', async () => {
  const html = '<img src=x onerror=alert(1)>'
  explainText.mockResolvedValue({ ok: true, data: { ...errorData, explanation: html } })
  const user = setup()
  await submit(user)
  expect(await screen.findByText(html)).toBeInTheDocument()
  expect(document.querySelector('img')).toBeNull()
})

test.each([
  ['busy', 'The service is busy. Please try again in a minute.'],
  ['ai_failed', 'Something went wrong. Please try again.'],
  ['offline', 'No connection'],
])('error %s shows its message and keeps the pasted text', async (error, message) => {
  explainText.mockResolvedValue({ ok: false, error })
  const user = setup()
  await submit(user, 'keep me')
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(screen.getByLabelText('Your text')).toHaveValue('keep me')
})

test('Try again after offline sends the request again', async () => {
  explainText.mockResolvedValueOnce({ ok: false, error: 'offline' }).mockResolvedValueOnce({ ok: true, data: docsData })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'Try again' }))
  expect(explainText).toHaveBeenCalledTimes(2)
  expect(await screen.findByRole('heading', { name: 'In simple words' })).toBeInTheDocument()
})

test('Save stores the word, shows the toast and becomes Saved', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'Save undefined' }))
  expect(listWords()[0]).toMatchObject({ word: 'undefined', meaning: 'A value that is not set.', sentence: 'x is undefined' })
  expect(screen.getByRole('status')).toHaveTextContent('Saved to My Words')
  expect(screen.getByRole('button', { name: 'Saved undefined' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Save property' })).toBeEnabled()
})

test('a word already in My Words starts as Saved', async () => {
  saveWord({ word: 'Undefined', meaning: 'm', sentence: 's' })
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user)
  expect(await screen.findByRole('button', { name: 'Saved undefined' })).toBeDisabled()
  expect(hasWord('property')).toBe(false)
})

test('shows the storage message when saving fails', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user)
  const save = await screen.findByRole('button', { name: 'Save undefined' })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  await user.click(save)
  expect(screen.getByRole('status')).toHaveTextContent('Your browser could not save this word.')
  expect(screen.getByRole('button', { name: 'Save undefined' })).toBeEnabled()
})

test('Copy explanation writes the formatted text to the clipboard', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'Copy explanation' }))
  expect(await navigator.clipboard.readText()).toBe(formatExplanation(errorData))
  expect(screen.getByRole('status')).toHaveTextContent('Copied')
})

test('a successful explanation is kept in History', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user, '  some text  ')
  await screen.findByRole('heading', { level: 3, name: 'In simple words' })
  const list = listHistory()
  expect(list).toHaveLength(1)
  expect(list[0].text).toBe('some text')
  expect(list[0].result).toEqual(errorData)
})

test('a failed explanation is not kept in History', async () => {
  explainText.mockResolvedValue({ ok: false, error: 'busy' })
  const user = setup()
  await submit(user)
  await screen.findByRole('alert')
  expect(listHistory()).toEqual([])
})

test('still shows the explanation when History cannot be saved', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  const user = setup()
  await submit(user)
  expect(await screen.findByText(errorData.explanation)).toBeInTheDocument()
})

test('opens a History entry without asking the AI', () => {
  const item = addHistory({ text: 'old pasted text', result: errorData })
  setup(`/?item=${item.id}`)
  expect(screen.getByLabelText('Your text')).toHaveValue('old pasted text')
  expect(screen.getByText(errorData.explanation)).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: 'What to try next' })).toBeInTheDocument()
  expect(screen.getByText(/From your history/)).toBeInTheDocument()
  expect(screen.getByText(/From your history/).querySelector('time')).toHaveAttribute('datetime', item.savedAt)
  expect(explainText).not.toHaveBeenCalled()
})

test('a History entry shows words already in My Words as Saved', () => {
  saveWord(errorData.words[0])
  const item = addHistory({ text: 'old pasted text', result: errorData })
  setup(`/?item=${item.id}`)
  expect(screen.getByRole('button', { name: 'Saved undefined' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Save property' })).toBeEnabled()
})

test('an unknown History entry shows the empty Explain page', () => {
  setup('/?item=missing')
  expect(screen.getByLabelText('Your text')).toHaveValue('')
  expect(screen.queryByRole('heading', { level: 2, name: 'Explanation' })).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('explaining again leaves the History entry and clears it from the address', async () => {
  const item = addHistory({ text: 'old pasted text', result: errorData })
  explainText.mockResolvedValue({ ok: true, data: { ...docsData, explanation: 'A fresh answer.' } })
  const user = setup(`/?item=${item.id}`)
  expect(screen.getByTestId('address')).toHaveTextContent(`/?item=${item.id}`)
  await user.click(explainButton())
  expect(await screen.findByText('A fresh answer.')).toBeInTheDocument()
  expect(screen.queryByText(/From your history/)).not.toBeInTheDocument()
  expect(screen.getByTestId('address')).toHaveTextContent(/^\/$/)
  expect(explainText).toHaveBeenCalledWith('old pasted text', null, null)
})

const simpler = () => screen.getByRole('button', { name: 'Make it simpler' })
const detail = () => screen.getByRole('button', { name: 'More detail' })

test('no "explain differently" buttons before an answer', () => {
  setup()
  expect(screen.queryByRole('button', { name: 'Make it simpler' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'More detail' })).not.toBeInTheDocument()
})

test('Make it simpler asks again at the simpler level and says so', async () => {
  explainText
    .mockResolvedValueOnce({ ok: true, data: errorData })
    .mockResolvedValueOnce({ ok: true, data: { ...errorData, explanation: 'Even simpler words.' } })
  const user = setup()
  await submit(user)
  expect(screen.getByText('Not clear?')).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Make it simpler' }))
  expect(await screen.findByText('Even simpler words.')).toBeInTheDocument()
  expect(explainText).toHaveBeenLastCalledWith('some text', 'simpler', null)
  expect(screen.getByText('Simpler version')).toBeInTheDocument()
})

test('More detail asks again at the detail level and says so', async () => {
  explainText
    .mockResolvedValueOnce({ ok: true, data: errorData })
    .mockResolvedValueOnce({ ok: true, data: { ...errorData, explanation: 'A longer answer.' } })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'More detail' }))
  expect(await screen.findByText('A longer answer.')).toBeInTheDocument()
  expect(explainText).toHaveBeenLastCalledWith('some text', 'detail', null)
  expect(screen.getByText('More detailed version')).toBeInTheDocument()
})

test('explaining differently uses the explained text, not later edits in the box', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user, 'first text')
  await user.type(screen.getByLabelText('Your text'), ' and more')
  await user.click(await screen.findByRole('button', { name: 'Make it simpler' }))
  expect(explainText).toHaveBeenLastCalledWith('first text', 'simpler', null)
})

test('a new Explain goes back to the normal level', async () => {
  explainText.mockResolvedValue({ ok: true, data: errorData })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'More detail' }))
  await screen.findByText('More detailed version')
  await user.click(explainButton())
  await screen.findByRole('button', { name: 'More detail' })
  expect(explainText).toHaveBeenLastCalledWith('some text', null, null)
  expect(screen.queryByText('More detailed version')).not.toBeInTheDocument()
})

test('Try again after going offline repeats the simpler request', async () => {
  explainText
    .mockResolvedValueOnce({ ok: true, data: errorData })
    .mockResolvedValueOnce({ ok: false, error: 'offline' })
    .mockResolvedValueOnce({ ok: true, data: { ...errorData, explanation: 'Back online.' } })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'Make it simpler' }))
  await user.click(await screen.findByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Back online.')).toBeInTheDocument()
  expect(explainText).toHaveBeenLastCalledWith('some text', 'simpler', null)
  expect(screen.getByText('Simpler version')).toBeInTheDocument()
})

test('the simpler version replaces the History entry for that text', async () => {
  explainText
    .mockResolvedValueOnce({ ok: true, data: errorData })
    .mockResolvedValueOnce({ ok: true, data: { ...errorData, explanation: 'Even simpler words.' } })
  const user = setup()
  await submit(user)
  await user.click(await screen.findByRole('button', { name: 'Make it simpler' }))
  await screen.findByText('Even simpler words.')
  expect(listHistory().map((h) => h.result.explanation)).toEqual(['Even simpler words.'])
})

test('an entry opened from History can be explained differently', async () => {
  const item = addHistory({ text: 'old pasted text', result: errorData })
  explainText.mockResolvedValue({ ok: true, data: { ...errorData, explanation: 'Simpler old.' } })
  const user = setup(`/?item=${item.id}`)
  await user.click(simpler())
  expect(await screen.findByText('Simpler old.')).toBeInTheDocument()
  expect(explainText).toHaveBeenLastCalledWith('old pasted text', 'simpler', null)
  expect(screen.queryByText(/From your history/)).not.toBeInTheDocument()
  expect(detail()).toBeEnabled()
})

describe('hard words marked in the pasted text', () => {
  const pasted = "TypeError: Cannot read properties of undefined (reading 'map')"

  async function answer(user) {
    explainText.mockResolvedValue({ ok: true, data: errorData })
    await submit(user, pasted)
    await screen.findByText(errorData.explanation)
  }

  test('the hard words in the text become buttons', async () => {
    const user = setup()
    await answer(user)
    expect(screen.getByText('Tap a marked word in your text to see what it means.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'undefined', expanded: false })).toBeInTheDocument()
  })

  test('a tap shows the meaning, and a second tap hides it', async () => {
    const user = setup()
    await answer(user)
    const mark = screen.getByRole('button', { name: 'undefined', expanded: false })
    await user.click(mark)
    expect(mark).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById(mark.getAttribute('aria-controls'))
    expect(panel).toHaveTextContent('A value that is not set.')
    await user.click(mark)
    expect(mark).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toBeEmptyDOMElement()
  })

  test('Save in the panel saves the word, and the list shows it as saved too', async () => {
    const user = setup()
    await answer(user)
    await user.click(screen.getByRole('button', { name: 'undefined', expanded: false }))
    await user.click(screen.getByRole('button', { name: 'Save undefined to My Words' }))
    expect(hasWord('undefined')).toBe(true)
    expect(screen.getByRole('button', { name: 'Saved undefined to My Words' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Saved undefined' })).toBeDisabled()
  })

  test('nothing is marked when no hard word is in the text', async () => {
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user, 'some text')
    await screen.findByText(errorData.explanation)
    expect(screen.queryByText(/^Tap a marked word/)).not.toBeInTheDocument()
  })
})

describe('reusing History to save AI calls', () => {
  test('the same text at the same level is shown from History without asking the AI', async () => {
    const item = addHistory({ text: 'kept text', result: errorData })
    const user = setup()
    await submit(user, '  kept text ')
    expect(screen.getByText(errorData.explanation)).toBeInTheDocument()
    expect(screen.getByText(/From your history/)).toBeInTheDocument()
    expect(screen.getByTestId('address')).toHaveTextContent(`/?item=${item.id}`)
    expect(explainText).not.toHaveBeenCalled()
  })

  test('a kept answer at another level is not used', async () => {
    addHistory({ text: 'kept text', result: errorData, level: 'simpler' })
    explainText.mockResolvedValue({ ok: true, data: docsData })
    const user = setup()
    await submit(user, 'kept text')
    expect(explainText).toHaveBeenCalledWith('kept text', null, null)
  })

  test('Make it simpler uses a kept simpler answer and says which version it is', async () => {
    addHistory({ text: 'kept text', result: { ...errorData, explanation: 'Kept simpler.' }, level: 'simpler' })
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user, 'kept text')
    await screen.findByText(errorData.explanation)
    // The normal answer just replaced the simpler one in History, so this asks the AI.
    explainText.mockResolvedValue({ ok: true, data: { ...errorData, explanation: 'New simpler.' } })
    await user.click(screen.getByRole('button', { name: 'Make it simpler' }))
    expect(await screen.findByText('New simpler.')).toBeInTheDocument()
    expect(listHistory()[0].level).toBe('simpler')
  })

  test('an opened simpler entry says Simpler version', () => {
    const item = addHistory({ text: 'kept text', result: errorData, level: 'simpler' })
    setup(`/?item=${item.id}`)
    expect(screen.getByText('Simpler version')).toBeInTheDocument()
  })

  test('Ask the AI again gets a fresh answer for a kept one', async () => {
    addHistory({ text: 'kept text', result: errorData })
    explainText.mockResolvedValue({ ok: true, data: { ...docsData, explanation: 'Fresh answer.' } })
    const user = setup()
    await submit(user, 'kept text')
    await user.click(screen.getByRole('button', { name: 'Ask the AI again' }))
    expect(await screen.findByText('Fresh answer.')).toBeInTheDocument()
    expect(explainText).toHaveBeenCalledWith('kept text', null, null)
    expect(screen.queryByText(/From your history/)).not.toBeInTheDocument()
    expect(listHistory().map((h) => h.result.explanation)).toEqual(['Fresh answer.'])
  })

  test('Ask the AI again keeps the level of the entry', async () => {
    const item = addHistory({ text: 'kept text', result: errorData, level: 'detail' })
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup(`/?item=${item.id}`)
    await user.click(screen.getByRole('button', { name: 'Ask the AI again' }))
    expect(explainText).toHaveBeenCalledWith('kept text', 'detail', null)
  })
})

describe('before the first answer', () => {
  test('the answer column shows what the five parts will be', () => {
    setup()
    const column = screen.getByRole('region', { name: 'What you will get' })
    for (const part of ['In simple words', 'Why this happens', 'What to try next', 'Practical example', 'Hard words']) {
      expect(within(column).getByText(part)).toBeInTheDocument()
    }
  })

  test('the preview goes away when an answer is on its way', async () => {
    explainText.mockReturnValue(new Promise(() => {}))
    const user = setup()
    await submit(user)
    expect(screen.queryByRole('region', { name: 'What you will get' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Explanation' })).toBeInTheDocument()
  })
})

describe('the keyboard shortcut', () => {
  test.each([['{Control>}{Enter}{/Control}'], ['{Meta>}{Enter}{/Meta}']])('%s in the text box explains', async (keys) => {
    explainText.mockResolvedValue({ ok: true, data: docsData })
    const user = setup()
    await user.type(screen.getByLabelText('Your text'), 'some text')
    await user.keyboard(keys)
    expect(explainText).toHaveBeenCalledWith('some text', null, null)
  })

  test('Enter alone adds a new line', async () => {
    const user = setup()
    await user.type(screen.getByLabelText('Your text'), 'one{Enter}two')
    expect(screen.getByLabelText('Your text')).toHaveValue('one\ntwo')
    expect(explainText).not.toHaveBeenCalled()
  })

  test('does nothing while the box is empty', async () => {
    const user = setup()
    await user.click(screen.getByLabelText('Your text'))
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(explainText).not.toHaveBeenCalled()
  })
})

describe('the examples', () => {
  const sample = SAMPLES[0]
  const example = () => screen.getByRole('button', { name: sample.label })

  test('there is a button for each example', () => {
    setup()
    const group = screen.getByRole('group', { name: 'Nothing to paste? Try an example:' })
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(SAMPLES.map((s) => s.label))
  })

  test('an example fills the box and shows its answer without asking the AI', async () => {
    const user = setup()
    await user.click(example())
    expect(screen.getByLabelText('Your text')).toHaveValue(sample.text)
    expect(screen.getByText(sample.result.explanation)).toBeInTheDocument()
    expect(screen.getByText(/^Example answer, written in advance/)).toBeInTheDocument()
    expect(explainText).not.toHaveBeenCalled()
  })

  test('an example is not kept in History', async () => {
    const user = setup()
    await user.click(example())
    expect(listHistory()).toEqual([])
  })

  test('words from an example can be saved', async () => {
    const user = setup()
    await user.click(example())
    await user.click(screen.getByRole('button', { name: 'Save undefined' }))
    expect(hasWord('undefined')).toBe(true)
  })

  test('Explain after an example asks the AI for real, and the example note goes', async () => {
    explainText.mockResolvedValue({ ok: true, data: { ...errorData, explanation: 'From the AI.' } })
    const user = setup()
    await user.click(example())
    await user.click(explainButton())
    expect(await screen.findByText('From the AI.')).toBeInTheDocument()
    expect(explainText).toHaveBeenCalledWith(sample.text, null, null)
    expect(screen.queryByText(/^Example answer/)).not.toBeInTheDocument()
  })

  test('an example replaces an entry opened from History', async () => {
    const item = addHistory({ text: 'old pasted text', result: errorData })
    const user = setup(`/?item=${item.id}`)
    await user.click(example())
    expect(screen.queryByText(/From your history/)).not.toBeInTheDocument()
    expect(screen.getByTestId('address')).toHaveTextContent(/^\/$/)
  })

  test('the examples are off while an answer is loading', async () => {
    explainText.mockReturnValue(new Promise(() => {}))
    const user = setup()
    await submit(user)
    expect(example()).toBeDisabled()
  })
})

describe('bringing the answer into view', () => {
  let scroll
  beforeEach(() => {
    scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
  })
  afterEach(() => {
    delete Element.prototype.scrollIntoView
    delete window.matchMedia
  })

  // jsdom has no layout, so say where the answer column is on the screen.
  const columnAt = (top) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top })

  test('scrolls the answer column up when it starts below the screen', async () => {
    columnAt(2000)
    explainText.mockReturnValue(new Promise(() => {}))
    const user = setup()
    await submit(user)
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
    expect(scroll.mock.contexts[0]).toBe(screen.getByRole('region', { name: 'Explanation' }))
  })

  test('does not scroll when the answer column is already in view', async () => {
    columnAt(150)
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user)
    await screen.findByText(errorData.explanation)
    expect(scroll).not.toHaveBeenCalled()
  })

  test('scrolls back up to a new answer when the user had read past the top', async () => {
    columnAt(-900)
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user)
    await screen.findByText(errorData.explanation)
    expect(scroll).toHaveBeenCalled()
  })

  test('jumps without the smooth scroll when the user asks for less motion', async () => {
    columnAt(2000)
    window.matchMedia = (q) => ({ matches: q === '(prefers-reduced-motion: reduce)' })
    explainText.mockReturnValue(new Promise(() => {}))
    const user = setup()
    await submit(user)
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' })
  })

  test('moves focus to the Explanation heading when the answer arrives', async () => {
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user)
    await screen.findByText(errorData.explanation)
    expect(screen.getByRole('heading', { level: 2, name: 'Explanation' })).toHaveFocus()
  })

  test('moves focus to the heading after an error too', async () => {
    explainText.mockResolvedValue({ ok: false, error: 'ai_failed' })
    const user = setup()
    await submit(user)
    await screen.findByRole('alert')
    expect(screen.getByRole('heading', { level: 2, name: 'Explanation' })).toHaveFocus()
  })

  test('focus is not lost after Make it simpler', async () => {
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user)
    await user.click(await screen.findByRole('button', { name: 'Make it simpler' }))
    await screen.findByText('Simpler version')
    expect(screen.getByRole('heading', { level: 2, name: 'Explanation' })).toHaveFocus()
  })

  test('opening a History entry does not move focus or scroll', () => {
    columnAt(2000)
    const item = addHistory({ text: 'old pasted text', result: errorData })
    setup(`/?item=${item.id}`)
    expect(screen.getByRole('heading', { level: 2, name: 'Explanation' })).not.toHaveFocus()
    expect(scroll).not.toHaveBeenCalled()
  })
})

describe('when the free AI limit is used up', () => {
  // Fake clock, so the countdown can be moved on without waiting.
  let user
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  })
  afterEach(() => vi.useRealTimers())

  function show() {
    render(
      <MemoryRouter>
        <ToastProvider>
          <ExplainPage />
        </ToastProvider>
      </MemoryRouter>,
    )
  }
  const tick = (ms) => act(() => vi.advanceTimersByTime(ms))

  test('shows which limit and counts down the wait', async () => {
    explainText.mockResolvedValue({ ok: false, error: 'busy', retryAfter: 8, limit: 'minute' })
    show()
    await submit(user)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The free AI limit is used up for this minute.')
    expect(screen.getByText('You can try again in 8 seconds.', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
    tick(3000)
    expect(screen.getByText('You can try again in 5 seconds.', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
  })

  test('tells screen readers the wait once, without reading every second', async () => {
    explainText.mockResolvedValue({ ok: false, error: 'busy', retryAfter: 8, limit: 'minute' })
    show()
    await submit(user)
    tick(3000)
    expect(screen.getByText('You can try again in 8 seconds.', { selector: '.visually-hidden' })).toBeInTheDocument()
  })

  test('keeps Explain off until the wait is over, then offers Try again', async () => {
    explainText.mockResolvedValueOnce({ ok: false, error: 'busy', retryAfter: 2, limit: 'minute' })
    show()
    await submit(user)
    await screen.findByRole('alert')
    expect(explainButton()).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    tick(2000)
    expect(screen.getByText('You can try again now.')).toBeInTheDocument()
    expect(explainButton()).toBeEnabled()
    explainText.mockResolvedValueOnce({ ok: true, data: errorData })
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(errorData.explanation)).toBeInTheDocument()
    expect(explainText).toHaveBeenCalledTimes(2)
  })

  test('says "for today" and uses hours for the daily limit', async () => {
    explainText.mockResolvedValue({ ok: false, error: 'busy', retryAfter: 8001, limit: 'day' })
    show()
    await submit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('The free AI limit is used up for today.')
    expect(screen.getByText('You can try again in 2 hours 14 minutes.', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
  })

  test('the visitor limit says so, counts down, and points to Practice', async () => {
    explainText.mockResolvedValue({ ok: false, error: 'busy', retryAfter: 60, limit: 'visitor' })
    show()
    await submit(user)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('You have asked many times in a short time.')
    expect(screen.getByText('You can try again in 1 minute.', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
    expect(within(alert).getByRole('link', { name: 'Practise your saved words while you wait' })).toHaveAttribute(
      'href',
      '/practice',
    )
  })

  test('without a wait time it shows the old busy message', async () => {
    explainText.mockResolvedValue({ ok: false, error: 'busy' })
    show()
    await submit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('The service is busy. Please try again in a minute.')
    expect(explainButton()).toBeEnabled()
  })
})

describe('help in my language', () => {
  const helped = {
    ...docsData,
    help: { lang: 'es', explanation: 'Tu código usó .map().', why: 'La lista no estaba lista.' },
    words: [{ ...docsData.words[0], help: { lang: 'es', meaning: 'Un valor sin definir.' } }],
  }

  test('is English only at first', () => {
    setup()
    expect(screen.getByLabelText('Help in my language')).toHaveValue('')
  })

  test('the chosen language goes with the request and is remembered', async () => {
    explainText.mockResolvedValue({ ok: true, data: helped })
    const user = setup()
    await user.selectOptions(screen.getByLabelText('Help in my language'), 'es')
    await submit(user)
    expect(explainText).toHaveBeenCalledWith('some text', null, 'es')
    expect(localStorage.getItem('ple.language.v1')).toBe('es')
    expect(listHistory()[0].language).toBe('es')
  })

  test('the translation shows under the English, marked with its language', async () => {
    explainText.mockResolvedValue({ ok: true, data: helped })
    const user = setup()
    await submit(user)
    const line = await screen.findByText('Tu código usó .map().')
    expect(line).toHaveAttribute('lang', 'es')
    expect(line).toHaveAttribute('dir', 'auto')
    expect(screen.getByText('La lista no estaba lista.')).toBeInTheDocument()
    expect(screen.getAllByText('Un valor sin definir.').length).toBeGreaterThan(0)
  })

  test('a saved word keeps its translated meaning', async () => {
    explainText.mockResolvedValue({ ok: true, data: helped })
    const user = setup()
    await submit(user)
    await user.click(await screen.findByRole('button', { name: 'Save undefined' }))
    expect(listWords()[0].help).toEqual({ lang: 'es', meaning: 'Un valor sin definir.' })
  })

  test('a kept English answer is not reused once a language is chosen', async () => {
    addHistory({ text: 'kept text', result: errorData })
    localStorage.setItem('ple.language.v1', 'es')
    explainText.mockResolvedValue({ ok: true, data: helped })
    const user = setup()
    await submit(user, 'kept text')
    expect(explainText).toHaveBeenCalledWith('kept text', null, 'es')
  })
})

describe('saved words point back to their explanation', () => {
  test('a word saved from an answer keeps the History entry id', async () => {
    explainText.mockResolvedValue({ ok: true, data: errorData })
    const user = setup()
    await submit(user)
    await user.click(await screen.findByRole('button', { name: 'Save undefined' }))
    expect(listWords()[0].source).toBe(listHistory()[0].id)
  })

  test('a word saved from an example has no source', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: SAMPLES[0].label }))
    await user.click(screen.getByRole('button', { name: `Save ${SAMPLES[0].result.words[0].word}` }))
    expect(listWords()[0].source).toBeUndefined()
  })
})

describe('ask about this', () => {
  const box = () => screen.getByLabelText(/Ask a question about this text|Ask another question/)

  async function answered(user) {
    explainText.mockResolvedValue({ ok: true, data: errorData })
    await submit(user)
    await screen.findByText(errorData.explanation)
  }

  test('sends the text, the explanation and the question, and shows the answer', async () => {
    askAbout.mockResolvedValue({ ok: true, data: { answer: 'A prop is an input.' } })
    const user = setup()
    await answered(user)
    await user.type(box(), 'What is a prop?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('A prop is an input.')).toBeInTheDocument()
    expect(screen.getByText('What is a prop?')).toBeInTheDocument()
    expect(askAbout).toHaveBeenCalledWith({
      text: 'some text',
      explanation: errorData.explanation,
      question: 'What is a prop?',
      earlier: [],
      language: null,
    })
    expect(box()).toHaveValue('')
    expect(screen.getByText('2 of 3 questions left for this text')).toBeInTheDocument()
  })

  test('the answer is kept with the History entry', async () => {
    askAbout.mockResolvedValue({ ok: true, data: { answer: 'Kept answer.' } })
    const user = setup()
    await answered(user)
    await user.type(box(), 'Why?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    await screen.findByText('Kept answer.')
    expect(getHistoryItem(listHistory()[0].id).followUps).toEqual([{ question: 'Why?', answer: 'Kept answer.' }])
  })

  test('an opened entry shows its questions', () => {
    const item = addHistory({ text: 'kept text', result: errorData })
    const raw = JSON.parse(localStorage.getItem('ple.history.v1'))
    raw[0].followUps = [{ question: 'Old question?', answer: 'Old answer.' }]
    localStorage.setItem('ple.history.v1', JSON.stringify(raw))
    setup(`/?item=${item.id}`)
    expect(screen.getByText('Old question?')).toBeInTheDocument()
    expect(screen.getByText('Old answer.')).toBeInTheDocument()
  })

  test('after three questions the box goes, with the reason', async () => {
    askAbout.mockResolvedValue({ ok: true, data: { answer: 'An answer.' } })
    const user = setup()
    await answered(user)
    for (const q of ['one', 'two', 'three']) {
      await user.type(box(), q)
      await user.click(screen.getByRole('button', { name: 'Ask' }))
      await screen.findByText(q)
    }
    expect(screen.queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument()
    expect(screen.getByText(/You asked 3 questions about this text/)).toBeInTheDocument()
    expect(askAbout).toHaveBeenLastCalledWith(
      expect.objectContaining({
        question: 'three',
        earlier: [
          { question: 'one', answer: 'An answer.' },
          { question: 'two', answer: 'An answer.' },
        ],
      }),
    )
  })

  test('Ask stays off until a question is typed', async () => {
    const user = setup()
    await answered(user)
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
  })

  test('offline keeps the question in the box and says so', async () => {
    askAbout.mockResolvedValue({ ok: false, error: 'offline' })
    const user = setup()
    await answered(user)
    await user.type(box(), 'Why?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No connection. Your question is still in the box.')
    expect(box()).toHaveValue('Why?')
  })

  test('a used-up limit shows the wait and turns off Explain too', async () => {
    askAbout.mockResolvedValue({ ok: false, error: 'busy', retryAfter: 30, limit: 'visitor' })
    const user = setup()
    await answered(user)
    await user.type(box(), 'Why?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText(/You can ask again in 30 seconds/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(explainButton()).toBeDisabled()
  })

  test('a new answer starts with no questions', async () => {
    askAbout.mockResolvedValue({ ok: true, data: { answer: 'First answer.' } })
    const user = setup()
    await answered(user)
    await user.type(box(), 'Why?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    await screen.findByText('First answer.')
    await user.click(screen.getByRole('button', { name: 'Make it simpler' }))
    await screen.findByText('Simpler version')
    expect(screen.queryByText('First answer.')).not.toBeInTheDocument()
    expect(screen.getByText('3 of 3 questions left for this text')).toBeInTheDocument()
  })

  test('the translated answer shows under the English one', async () => {
    askAbout.mockResolvedValue({ ok: true, data: { answer: 'English.', help: { lang: 'es', answer: 'Español.' } } })
    const user = setup()
    await answered(user)
    await user.type(box(), 'Why?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText('Español.')).toHaveAttribute('lang', 'es')
  })
})
