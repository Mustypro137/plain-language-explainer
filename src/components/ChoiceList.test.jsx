import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChoiceList from './ChoiceList.jsx'

const choices = [
  { text: 'first', correct: false },
  { text: 'second', correct: true },
  { text: 'third', correct: false },
]

test('clicking a choice picks it', async () => {
  const onPick = vi.fn()
  render(<ChoiceList choices={choices} picked={null} onPick={onPick} />)
  await userEvent.click(screen.getByRole('button', { name: /second/ }))
  expect(onPick).toHaveBeenCalledWith(1)
})

test('a number key picks that choice', async () => {
  const onPick = vi.fn()
  render(<ChoiceList choices={choices} picked={null} onPick={onPick} />)
  await userEvent.keyboard('2')
  expect(onPick).toHaveBeenCalledWith(1)
})

test('a number typed into a text box does not pick anything', async () => {
  const onPick = vi.fn()
  render(
    <>
      <textarea aria-label="Your question" />
      <ChoiceList choices={choices} picked={null} onPick={onPick} />
    </>,
  )
  await userEvent.click(screen.getByLabelText('Your question'))
  await userEvent.keyboard('2')
  expect(onPick).not.toHaveBeenCalled()
})

test('after a wrong pick, it marks the pick and the right choice', async () => {
  const onPick = vi.fn()
  render(<ChoiceList choices={choices} picked={0} onPick={onPick} />)
  expect(within(screen.getByRole('button', { name: /first/ })).getByText('Not this one')).toBeInTheDocument()
  expect(within(screen.getByRole('button', { name: /second/ })).getByText('Correct')).toBeInTheDocument()
  await userEvent.keyboard('3')
  expect(onPick).not.toHaveBeenCalled()
})
