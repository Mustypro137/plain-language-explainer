import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckYourself from './CheckYourself.jsx'

const rows = [
  { from: 1, to: 1, text: 'npm ERR! code ERESOLVE', plain: 'npm stopped while installing.' },
  { from: 2, to: 2, text: 'npm ERR! could not resolve', plain: 'npm could not find versions that fit.' },
  { from: 3, to: 3, text: 'npm ERR! peer react', plain: 'A package wants another React.' },
]
const answers = Object.fromEntries(rows.map((r) => [r.text, r.plain]))

function show({ words = [], onDone = vi.fn(), useRows = rows } = {}) {
  render(<CheckYourself rows={useRows} words={words} onDone={onDone} random={() => 0} />)
  return { user: userEvent.setup(), onDone }
}

const card = () => screen.getByRole('region', { name: 'Check yourself' })
const shownLine = () => within(card()).getByTestId('check-prompt').textContent

async function pickRight(user) {
  await user.click(within(card()).getByRole('button', { name: new RegExp(answers[shownLine()].replace('.', '\\.')) }))
}

async function pickWrong(user) {
  const right = answers[shownLine()]
  const wrong = within(within(card()).getByRole('list', { name: 'Choices' }))
    .getAllByRole('button')
    .find((b) => !b.textContent.includes(right))
  await user.click(wrong)
}

test('offers three questions when the answer has three lines', () => {
  show()
  expect(screen.getByRole('button', { name: 'Check yourself · 3 questions' })).toBeInTheDocument()
})

test('shows nothing when there is too little to ask about', () => {
  const { container } = render(<CheckYourself rows={rows.slice(0, 2)} words={[{ word: 'peer', meaning: 'm' }]} onDone={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})

test('all right ends in 3 of 3 and reports the score once', async () => {
  const { user, onDone } = show()
  await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
  expect(within(card()).getByText('Question 1 of 3')).toBeInTheDocument()
  for (let i = 0; i < 3; i++) {
    await pickRight(user)
    expect(within(card()).getByRole('status')).toHaveTextContent('Correct!')
    await user.click(within(card()).getByRole('button', { name: i < 2 ? 'Next' : 'See the result' }))
  }
  expect(within(card()).getByText('3 of 3')).toBeInTheDocument()
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(onDone).toHaveBeenCalledWith({ right: 3, total: 3 })
  expect(within(card()).queryByRole('button', { name: /Read line/ })).not.toBeInTheDocument()
})

test('a missed line is offered for reading again', async () => {
  const { user, onDone } = show()
  await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
  const missed = rows.find((r) => r.text === shownLine())
  await pickWrong(user)
  expect(within(card()).getByRole('status')).toHaveTextContent('Not quite')
  await user.click(within(card()).getByRole('button', { name: 'Next' }))
  await pickRight(user)
  await user.click(within(card()).getByRole('button', { name: 'Next' }))
  await pickRight(user)
  await user.click(within(card()).getByRole('button', { name: 'See the result' }))
  expect(within(card()).getByText('2 of 3')).toBeInTheDocument()
  expect(within(card()).getByRole('button', { name: `Read line 0${missed.from} again` })).toBeInTheDocument()
  expect(onDone).toHaveBeenCalledWith({ right: 2, total: 3 })
})

test('check again starts a new round', async () => {
  const { user } = show()
  await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
  for (let i = 0; i < 3; i++) {
    await pickRight(user)
    await user.click(within(card()).getByRole('button', { name: i < 2 ? 'Next' : 'See the result' }))
  }
  await user.click(within(card()).getByRole('button', { name: 'Check again' }))
  expect(within(card()).getByText('Question 1 of 3')).toBeInTheDocument()
})

test('a word question shows the word and asks for its meaning', async () => {
  const words = [
    { word: 'peer', meaning: 'Next to and equal.' },
    { word: 'resolve', meaning: 'Find an answer.' },
    { word: 'install', meaning: 'Put on your computer.' },
  ]
  const { user } = show({ words, useRows: [] })
  await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
  expect(within(card()).getByText('Which meaning is right?')).toBeInTheDocument()
  expect(words.map((w) => w.word)).toContain(within(card()).getByTestId('check-prompt').textContent)
})

test('focus moves to each new question and then to the result', async () => {
  const { user } = show()
  await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
  expect(within(card()).getByTestId('check-question')).toHaveFocus()
  await pickRight(user)
  await user.click(within(card()).getByRole('button', { name: 'Next' }))
  expect(within(card()).getByTestId('check-question')).toHaveFocus()
  await pickRight(user)
  await user.click(within(card()).getByRole('button', { name: 'Next' }))
  await pickRight(user)
  await user.click(within(card()).getByRole('button', { name: 'See the result' }))
  expect(within(card()).getByText('3 of 3').closest('[tabindex]')).toHaveFocus()
})

test('the result is said in the same status line that gave each answer', async () => {
  const { user } = show()
  await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
  const status = within(card()).getByRole('status')
  for (let i = 0; i < 3; i++) {
    await pickRight(user)
    await user.click(within(card()).getByRole('button', { name: i < 2 ? 'Next' : 'See the result' }))
  }
  expect(within(card()).getByRole('status')).toBe(status)
  expect(status).toHaveTextContent('You got 3 of 3 right.')
})

describe('motion hooks', () => {
  async function finish(user, rightAnswers) {
    for (let i = 0; i < 3; i++) {
      if (rightAnswers[i]) await pickRight(user)
      else await pickWrong(user)
      await user.click(within(card()).getByRole('button', { name: i < 2 ? 'Next' : 'See the result' }))
    }
  }
  const stars = () => card().querySelectorAll('.check-stars .sp')

  test('each question is a new element, so its entrance plays', async () => {
    const { user } = show()
    await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
    const first = within(card()).getByTestId('check-question')
    await pickRight(user)
    await user.click(within(card()).getByRole('button', { name: 'Next' }))
    expect(within(card()).getByTestId('check-question')).not.toBe(first)
  })

  test('the result has one star per question, gold for the right ones', async () => {
    const { user } = show()
    await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
    await finish(user, [true, false, true])
    expect(stars()).toHaveLength(3)
    expect([...stars()].map((s) => s.classList.contains('sp-right'))).toEqual([true, false, true])
    expect(card().querySelector('.sp-pop')).toBeNull()
    expect(card().querySelector('.check-stars')).toHaveAttribute('aria-hidden', 'true')
  })

  test('a full score makes the last star pop, and Check again clears the stars', async () => {
    const { user } = show()
    await user.click(screen.getByRole('button', { name: 'Check yourself · 3 questions' }))
    await finish(user, [true, true, true])
    expect(stars()[2]).toHaveClass('sp-pop')
    await user.click(within(card()).getByRole('button', { name: 'Check again' }))
    expect(stars()).toHaveLength(0)
  })
})
