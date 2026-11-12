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

test('Practise again brings back only the words forgotten today', async () => {
  two()
  const { user } = setup()
  await user.keyboard(' ')
  await user.keyboard('2')
  await user.keyboard(' ')
  await user.keyboard('1')
  await user.click(screen.getByRole('button', { name: 'Practise again' }))
  // alpha was known, so it is due tomorrow; beta was forgotten, so it is due again today
  expect(screen.getByText('Card 1 of 1')).toBeInTheDocument()
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

const four = () =>
  put([
    mk('alpha', 1, '2026-01-01T00:00:00Z'),
    mk('beta', 1, '2026-01-02T00:00:00Z'),
    mk('gamma', 2, '2026-01-03T00:00:00Z'),
    mk('delta', 3, '2026-01-04T00:00:00Z'),
  ])
const modeButton = (name) => screen.getByRole('button', { name })
const choiceButtons = () => within(screen.getByRole('list', { name: 'Choices' })).getAllByRole('button')
const rightChoice = (word) => screen.getByRole('button', { name: new RegExp(`${word} means$`) })

async function chooseMode(user) {
  await user.click(modeButton('Multiple choice'))
}

test('Flashcards is the default mode', () => {
  four()
  setup()
  expect(modeButton('Flashcards')).toHaveAttribute('aria-pressed', 'true')
  expect(modeButton('Multiple choice')).toHaveAttribute('aria-pressed', 'false')
})

test('multiple choice is off with a hint when fewer than four meanings are saved', () => {
  two()
  setup()
  expect(modeButton('Multiple choice')).toBeDisabled()
  expect(screen.getByText('Save at least 4 words to use multiple choice.')).toBeInTheDocument()
})

test('multiple choice shows the word and four meanings, one of them right', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  expect(modeButton('Multiple choice')).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Question' })).toHaveTextContent('alpha')
  expect(choiceButtons()).toHaveLength(4)
  expect(rightChoice('alpha')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
})

test('the right answer moves the word up, says Correct and shows the sentence', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  await user.click(rightChoice('alpha'))
  expect(boxOf('alpha')).toBe(2)
  expect(screen.getByRole('status')).toHaveTextContent('Correct!')
  expect(rightChoice('alpha')).toHaveTextContent('Correct')
  expect(screen.getByText('alpha in a sentence')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
})

test('a wrong answer sends the word back and marks both answers', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  const wrong = choiceButtons().find((b) => !b.textContent.endsWith('alpha means'))
  await user.click(wrong)
  expect(boxOf('alpha')).toBe(1)
  expect(wrong).toHaveTextContent('Not this one')
  expect(rightChoice('alpha')).toHaveTextContent('Correct')
  expect(screen.getByRole('status')).toHaveTextContent('Not quite.')
})

test('only the first pick counts', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  const wrong = choiceButtons().find((b) => !b.textContent.endsWith('alpha means'))
  await user.click(wrong)
  await user.click(rightChoice('alpha'))
  expect(boxOf('alpha')).toBe(1)
  expect(wrong).toHaveTextContent('Not this one')
})

test('keys 1 to 4 pick an answer and Enter goes to the next word', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  const place = choiceButtons().findIndex((b) => b.textContent.endsWith('alpha means'))
  await user.keyboard(String(place + 1))
  expect(screen.getByRole('status')).toHaveTextContent('Correct!')
  await user.keyboard('{Enter}')
  expect(screen.getByText('Card 2 of 4')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Question' })).toHaveTextContent('beta')
})

test('a full multiple-choice round ends on the results screen', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  for (const word of ['alpha', 'beta', 'gamma', 'delta']) {
    expect(screen.getByRole('region', { name: 'Question' })).toHaveTextContent(word)
    await user.click(rightChoice(word))
    await user.click(screen.getByRole('button', { name: 'Next' }))
  }
  expect(screen.getByRole('heading', { level: 1, name: 'You knew 4 of 4 words' })).toBeInTheDocument()
  // Every word was known, so none is due: Practise anyway starts a round in the same mode.
  await user.click(screen.getByRole('button', { name: 'Practise again' }))
  await user.click(screen.getByRole('button', { name: 'Practise anyway' }))
  expect(screen.getByRole('region', { name: 'Question' })).toBeInTheDocument()
})

test('flashcard keys do nothing in multiple-choice mode', async () => {
  four()
  const { user } = setup()
  await chooseMode(user)
  await user.keyboard(' ')
  expect(screen.queryByText('alpha means', { selector: '.flashcard-meaning' })).not.toBeInTheDocument()
  expect(boxOf('alpha')).toBe(1)
})

test('switching mode starts a new round with the words still due', async () => {
  four()
  const { user } = setup()
  await user.keyboard(' ')
  await user.keyboard('2')
  expect(screen.getByText('Card 2 of 4')).toBeInTheDocument()
  await chooseMode(user)
  expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
  await user.click(modeButton('Flashcards'))
  expect(screen.getByRole('button', { name: /^Show meaning of / })).toBeInTheDocument()
})

describe('reviews on the day they are due', () => {
  // A fixed "today" so the due days in the tests are stable.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 10, 12))
  })
  afterEach(() => vi.useRealTimers())

  const at = (word, box, due, interval) => ({ ...mk(word, box, '2026-01-01T00:00:00Z'), due, interval })
  const stored = (id) => JSON.parse(localStorage.getItem('ple.words.v1')).find((w) => w.id === id)

  test('a round holds only the words due today or earlier', () => {
    put([at('late', 1, '2026-01-09', 1), at('now', 1, '2026-01-10', 1), at('later', 1, '2026-01-12', 3)])
    setup()
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Show meaning of / })).toHaveTextContent('late')
  })

  test('"I knew it" schedules the word further out; "I forgot" makes it due today', async () => {
    put([at('alpha', 2, '2026-01-10', 3), at('beta', 3, '2026-01-10', 16)])
    const { user } = setup()
    await user.keyboard(' ')
    await user.keyboard('2')
    expect(stored('alpha')).toMatchObject({ box: 3, interval: 7, due: '2026-01-17' })
    await user.keyboard(' ')
    await user.keyboard('1')
    expect(stored('beta')).toMatchObject({ box: 1, interval: 0, due: '2026-01-10' })
  })

  test('with nothing due it says when the next review is, and offers extra practice', async () => {
    put([at('alpha', 2, '2026-01-11', 1), at('beta', 2, '2026-01-11', 1), at('gamma', 3, '2026-01-20', 7)])
    const { user } = setup()
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing to review today' })).toBeInTheDocument()
    expect(screen.getByText(/^Next review: tomorrow, 2 words\./)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Practise anyway' }))
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Extra practice: these words are not due yet.')).toBeInTheDocument()
  })

  test('a finished round counts for the streak, which shows on the results', async () => {
    localStorage.setItem('ple.practice-days.v1', JSON.stringify(['2026-01-09', '2026-01-08']))
    put([at('alpha', 1, '2026-01-10', 0)])
    const { user } = setup()
    await user.keyboard(' ')
    await user.keyboard('2')
    expect(JSON.parse(localStorage.getItem('ple.practice-days.v1'))).toEqual(['2026-01-10', '2026-01-09', '2026-01-08'])
    expect(screen.getByRole('heading', { level: 2, name: '3-day streak' })).toBeInTheDocument()
    expect(screen.getByText('You practised today.')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Practised on 3 of the last 7 days' })).toBeInTheDocument()
  })

  test('leaving a round half done does not count for the streak', async () => {
    put([at('alpha', 1, '2026-01-10', 0), at('beta', 1, '2026-01-10', 0)])
    const { user, unmount } = setup()
    await user.keyboard(' ')
    await user.keyboard('2')
    unmount()
    expect(localStorage.getItem('ple.practice-days.v1')).toBeNull()
  })
})

describe('focused practice', () => {
  const word = (w, topic, over = {}) => ({ ...mk(w, 1, '2026-01-01T00:00:00Z'), topic, ...over })

  function setupAt(path) {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[path]}>
        <PracticePage />
      </MemoryRouter>,
    )
    return user
  }

  const cardWord = () => screen.getByRole('button', { name: /^Show meaning of / })

  test('?topic=React practises only the React words, due or not', () => {
    put([
      word('hook', 'React', { due: '2999-01-01', interval: 7 }),
      word('promise', 'JavaScript'),
      word('prop', 'React'),
    ])
    setupAt('/practice?topic=React')
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    expect(screen.getByText(/Only React words, due today or not/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Practise all topics' })).toHaveAttribute('href', '/practice')
    expect(cardWord()).not.toHaveAccessibleName('Show meaning of promise')
  })

  test('a topic with no words says so', () => {
    put([word('promise', 'JavaScript')])
    setupAt('/practice?topic=CSS')
    expect(screen.getByRole('heading', { name: 'No CSS words yet' })).toBeInTheDocument()
  })

  test('an unknown topic practises everything', () => {
    put([word('promise', 'JavaScript'), word('prop', 'React')])
    setupAt('/practice?topic=Cooking')
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    expect(screen.queryByText(/Only .* words/)).not.toBeInTheDocument()
  })

  describe('fill the blank', () => {
    const blankable = () =>
      put([
        word('callback', 'JavaScript', { sentence: 'Pass a callback to the function.' }),
        word('property', 'JavaScript', { sentence: 'Cannot read properties of undefined.' }),
      ])

    test('asks only for words whose sentence uses them, with the word hidden', async () => {
      blankable()
      const user = setupAt('/practice')
      await user.click(screen.getByRole('button', { name: 'Fill the blank' }))
      expect(screen.getByText('Card 1 of 1')).toBeInTheDocument()
      const question = screen.getByRole('region', { name: 'Question' })
      // Screen readers hear "blank" where the word was.
      expect(question.querySelector('.blank-sentence')).toHaveTextContent('Pass a blank to the function.')
      expect(question).toHaveTextContent('Meaning: callback means')
      expect(screen.getByLabelText('The missing word')).toHaveFocus()
    })

    test('the right word is correct and moves the word on', async () => {
      blankable()
      const user = setupAt('/practice')
      await user.click(screen.getByRole('button', { name: 'Fill the blank' }))
      await user.type(screen.getByLabelText('The missing word'), '  CallBack {Enter}')
      expect(screen.getByRole('status')).toHaveTextContent('Correct!')
      expect(listWords().find((w) => w.word === 'callback').box).toBe(2)
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(screen.getByText(/You knew 1 of 1 word/)).toBeInTheDocument()
    })

    test('a wrong word shows the right one and counts as forgotten', async () => {
      blankable()
      const user = setupAt('/practice')
      await user.click(screen.getByRole('button', { name: 'Fill the blank' }))
      await user.type(screen.getByLabelText('The missing word'), 'function')
      await user.click(screen.getByRole('button', { name: 'Check' }))
      expect(screen.getByRole('status')).toHaveTextContent('The word is “callback”.')
      expect(screen.getByRole('region', { name: 'Question' })).toHaveTextContent('Pass a callback to the function.')
      expect(listWords().find((w) => w.word === 'callback').box).toBe(1)
    })

    test('Show the word counts as forgotten', async () => {
      blankable()
      const user = setupAt('/practice')
      await user.click(screen.getByRole('button', { name: 'Fill the blank' }))
      await user.click(screen.getByRole('button', { name: 'Show the word' }))
      expect(screen.getByRole('status')).toHaveTextContent('The word is “callback”.')
      expect(screen.getByLabelText('The missing word')).toHaveAttribute('readonly')
    })

    test('is off, with a reason, when no sentence uses its word', () => {
      put([word('property', 'JavaScript', { sentence: 'Cannot read properties.' })])
      setupAt('/practice')
      const button = screen.getByRole('button', { name: 'Fill the blank' })
      expect(button).toBeDisabled()
      expect(button).toHaveAccessibleDescription('Fill the blank needs words whose saved sentence uses the word.')
    })
  })

  test('the back of a flashcard shows the translation and the note', async () => {
    put([word('callback', 'JavaScript', { note: 'Like a phone call back.', help: { lang: 'es', meaning: 'Una función.' } })])
    const user = setupAt('/practice')
    await user.click(cardWord())
    expect(screen.getByText('Una función.')).toHaveAttribute('lang', 'es')
    expect(screen.getByText('My note: Like a phone call back.')).toBeInTheDocument()
  })
})

describe('confetti', () => {
  const confetti = (container) => container.querySelector('.confetti')

  async function finish(user, answers) {
    for (const knew of answers) {
      await user.keyboard(' ')
      await user.keyboard(knew ? '2' : '1')
    }
  }

  test('plays when every word was known', async () => {
    two()
    const { user, container } = setup()
    await finish(user, [true, true])
    expect(screen.getByRole('heading', { level: 1, name: 'You knew 2 of 2 words' })).toBeInTheDocument()
    expect(confetti(container)).toBeInTheDocument()
  })

  test('does not play for a weak round', async () => {
    two()
    const { user, container } = setup()
    await finish(user, [true, false])
    expect(screen.getByRole('heading', { level: 1, name: 'You knew 1 of 2 words' })).toBeInTheDocument()
    expect(confetti(container)).toBeNull()
  })
})

describe('focus mode and star progress', () => {
  afterEach(() => {
    delete document.body.dataset.focus
  })

  test('the top bar goes away during a round and comes back on the results', async () => {
    two()
    const { user } = setup()
    expect(document.body.dataset.focus).toBe('practice')
    expect(screen.getByRole('link', { name: 'Leave practice' })).toHaveAttribute('href', '/words')
    for (let i = 0; i < 2; i++) {
      await user.keyboard(' ')
      await user.keyboard('2')
    }
    expect(screen.getByRole('heading', { level: 1, name: /You knew/ })).toBeInTheDocument()
    expect(document.body.dataset.focus).toBeUndefined()
  })

  test('a star per card shows what was known and what comes back today', async () => {
    two()
    const { user, container } = setup()
    const stars = () => [...container.querySelectorAll('.sp')].map((s) => s.className.replace('sp ', ''))
    expect(stars()).toEqual(['sp-now', 'sp-next'])
    await user.keyboard(' ')
    await user.keyboard('1')
    expect(stars()).toEqual(['sp-again sp-just', 'sp-now'])
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '0 known, 1 to review, 1 to go')
  })

  test.each([
    ['2', '“alpha” is brighter now. Back tomorrow.'],
    ['1', '“alpha” comes back today.'],
  ])('after answering %s, a line says when the word comes back', async (key, line) => {
    two()
    const { user } = setup()
    expect(screen.getByRole('button', { name: 'Show meaning of alpha' })).toBeInTheDocument()
    await user.keyboard(' ')
    await user.keyboard(key)
    expect(screen.getByText(line)).toBeInTheDocument()
  })
})
