import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../components/Toast.jsx'
import { explainText } from '../lib/explainText.js'
import { formatExplanation } from '../lib/formatExplanation.js'
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

function setup() {
  const user = userEvent.setup()
  render(
    <ToastProvider>
      <ExplainPage />
    </ToastProvider>,
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
  expect(screen.getByText('Do not paste passwords or secret keys.')).toBeInTheDocument()
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
  expect(explainText).toHaveBeenCalledWith('some text')
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
