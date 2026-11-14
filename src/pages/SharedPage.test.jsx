import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/Toast.jsx'
import { listHistory } from '../lib/historyStore.js'
import { encodeShare } from '../lib/share.js'
import { listWords, saveWord } from '../lib/wordStore.js'
import SharedPage from './SharedPage.jsx'

const result = {
  kind: 'error',
  explanation: 'npm could not find versions that fit together.',
  why: 'Two packages want different React versions.',
  steps: ['Install with --legacy-peer-deps'],
  example: 'npm install --legacy-peer-deps',
  words: [
    { word: 'peer', meaning: 'Next to and equal.', sentence: 'peer react' },
    { word: 'resolve', meaning: 'Find an answer to.', sentence: 'could not resolve' },
  ],
  lines: [
    { from: 1, to: 1, plain: 'npm stopped while installing.' },
    { from: 2, to: 2, plain: 'A package wants another React.' },
  ],
}
const text = 'npm ERR! could not resolve\nnpm ERR! peer react'

function setup(hash) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[`/s${hash}`]}>
      <ToastProvider>
        <SharedPage />
      </ToastProvider>
    </MemoryRouter>,
  )
  return user
}

beforeEach(() => localStorage.clear())

const share = async () => `#d=${await encodeShare({ text, result, level: null, language: null })}`

test('a shared link shows the answer, read only', async () => {
  setup(await share())
  expect(await screen.findByRole('heading', { level: 1, name: 'Shared explanation · read only' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Explanation' })).toBeInTheDocument()
  expect(screen.getByText(result.explanation)).toBeInTheDocument()
  expect(screen.getByText('npm stopped while installing.')).toBeInTheDocument()
  expect(screen.getByText(result.why)).toBeInTheDocument()
  expect(screen.getByText('Install with --legacy-peer-deps')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Explain your own text' })).toHaveAttribute('href', '/')
  expect(document.title).toBe('Shared explanation · Plain-Language Explainer')
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
})

test('saving a word from a shared answer keeps it, with no link to History, and History stays empty', async () => {
  const user = setup(await share())
  await user.click((await screen.findAllByRole('button', { name: 'resolve' }))[0])
  const panel = screen.getAllByRole('button', { name: 'Save resolve to My Words' })[0]
  await user.click(panel)
  const saved = listWords()
  expect(saved.map((w) => w.word)).toEqual(['resolve'])
  expect(saved[0].source).toBeUndefined()
  expect(listHistory()).toEqual([])
})

test('a word the opener already saved shows as saved, with its star in the text', async () => {
  saveWord({ word: 'peer', meaning: 'My meaning.', sentence: '' })
  setup(await share())
  expect((await screen.findAllByRole('button', { name: /^peer, saved$/ })).length).toBeGreaterThan(0)
})

test.each([[''], ['#d=zzzz'], ['#other']])('a broken link (%s) says so and offers the Explain page', async (hash) => {
  setup(hash)
  expect(await screen.findByRole('heading', { level: 1, name: 'This link is broken or cut short' })).toBeInTheDocument()
  expect(within(screen.getByRole('main')).getByRole('link', { name: /Explain/ })).toHaveAttribute('href', '/')
})
