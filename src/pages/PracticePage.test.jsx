import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { listWords } from '../lib/wordStore.js'
import PracticePage from './PracticePage.jsx'

const mk = (word, box, savedAt) => ({
  id: word,
  word,
  meaning: `${word} means`,
  sentence: `${word} in a sentence`,
  savedAt,
  box,
})

function put(words) {
  localStorage.setItem('ple.words.v1', JSON.stringify(words))
}

const two = () => put([mk('beta', 1, '2026-01-02T00:00:00Z'), mk('alpha', 1, '2026-01-01T00:00:00Z')])

function setup() {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter>
      <PracticePage />
    </MemoryRouter>,
  )
  return { user, ...view }
}

const boxOf = (id) => listWords().find((w) => w.id === id).box
const forgot = () => screen.getByRole('button', { name: /I forgot/ })
const knew = () => screen.getByRole('button', { name: /I knew it/ })

beforeEach(() => localStorage.clear())

test('shows the empty state when no words are saved', () => {
  setup()
  expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Explain something' })).toHaveAttribute('href', '/')
})

test('shows only the word first, and the answer buttons are disabled', () => {
  two()
  setup()
  expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Show meaning of alpha' })).toHaveTextContent('alpha')
  expect(screen.queryByText('alpha means')).not.toBeInTheDocument()
  expect(forgot()).toBeDisabled()
  expect(knew()).toBeDisabled()
})

test('Show meaning reveals the meaning and sentence and enables the buttons', async () => {
  two()
  const { user } = setup()
  await user.click(screen.getByRole('button', { name: /^Show meaning of / }))
  expect(screen.getByText('alpha means')).toBeInTheDocument()
  expect(screen.getByText('alpha in a sentence')).toBeInTheDocument()
  expect(forgot()).toBeEnabled()
  expect(knew()).toBeEnabled()
})

test('Space flips the card; 2 after the flip records "knew"; 1 records "forgot"', async () => {
  two()
  const { user } = setup()
  await user.keyboard(' ')
  expect(screen.getByText('alpha means')).toBeInTheDocument()
  await user.keyboard('2')
  expect(boxOf('alpha')).toBe(2)
  expect(screen.getByText('Card 2 of 2')).toBeInTheDocument()
  await user.keyboard(' ')
  await user.keyboard('1')
  expect(boxOf('beta')).toBe(1)
  expect(screen.getByRole('heading', { level: 1, name: 'You knew 1 of 2 words' })).toBeInTheDocument()
})

test('1 and 2 do nothing before the flip', async () => {
  two()
  const { user } = setup()
  await user.keyboard('2')
  await user.keyboard('1')
  expect(boxOf('alpha')).toBe(1)
  expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
})

test('Space on the focused card flips it once and keeps it flipped', async () => {
  two()
  const { user } = setup()
  screen.getByRole('button', { name: /^Show meaning of / }).focus()
  await user.keyboard(' ')
  expect(screen.getByText('alpha means')).toBeInTheDocument()
  expect(knew()).toBeEnabled()
})

test('I knew it moves the word up a box in storage and shows the next card', async () => {
  two()
  const { user } = setup()
  await user.click(screen.getByRole('button', { name: /^Show meaning of / }))
  await user.click(knew())
  expect(boxOf('alpha')).toBe(2)
  expect(screen.getByText('Card 2 of 2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Show meaning of / })).toHaveTextContent('beta')
})

test('the progress bar follows the answers', async () => {
  two()
  const { user } = setup()
  const bar = screen.getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuemin', '0')
  expect(bar).toHaveAttribute('aria-valuemax', '2')
  expect(bar).toHaveAttribute('aria-valuenow', '0')
  await user.keyboard(' ')
  await user.keyboard('2')
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
})

test('after the last card the results show the score and the forgotten words', async () => {
  two()
  const { user } = setup()
  await user.keyboard(' ')
  await user.keyboard('2')
  await user.keyboard(' ')
  await user.keyboard('1')
  expect(screen.getByRole('heading', { level: 1, name: 'You knew 1 of 2 words' })).toBeInTheDocument()
  const review = screen.getByRole('heading', { name: 'Word to review' }).closest('section')
  expect(within(review).getByText('beta')).toBeInTheDocument()
  expect(within(review).queryByText('alpha')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to My Words' })).toHaveAttribute('href', '/words')
})

test('the review list heading is plural for more than one word', async () => {
  two()
  const { user } = setup()
  await user.keyboard(' ')
  await user.keyboard('1')
  await user.keyboard(' ')
  await user.keyboard('1')
  expect(screen.getByRole('heading', { name: 'Words to review' })).toBeInTheDocument()
})

test('says Nothing to review when every word was known', async () => {
  put([mk('alpha', 1, '2026-01-01T00:00:00Z')])
  const { user } = setup()
  await user.keyboard(' ')
  await user.keyboard('2')
  expect(screen.getByRole('heading', { level: 1, name: 'You knew 1 of 1 word' })).toBeInTheDocument()
  expect(screen.getByText('Nothing to review')).toBeInTheDocument()
})

test('Practise again starts a new round', async () => {
  two()
  const { user } = setup()
  await user.keyboard(' ')
  await user.keyboard('2')
  await user.keyboard(' ')
  await user.keyboard('1')
  await user.click(screen.getByRole('button', { name: 'Practise again' }))
  expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
  // alpha moved up to box 2, so the lowest box (beta) now comes first
  expect(screen.getByRole('button', { name: /^Show meaning of / })).toHaveTextContent('beta')
})

test('a round shows at most ten cards', () => {
  put(Array.from({ length: 12 }, (_, i) => mk(`w${i}`, 1, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)))
  setup()
  expect(screen.getByText('Card 1 of 10')).toBeInTheDocument()
})

test('stops listening for keys after it is closed', async () => {
  two()
  const { user, unmount } = setup()
  unmount()
  await user.keyboard(' ')
  await user.keyboard('2')
  expect(boxOf('alpha')).toBe(1)
})
