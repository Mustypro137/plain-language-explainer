import { act, fireEvent, render, screen } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast.jsx'

function Trigger({ message = 'Saved to My Words', options }) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast(message, options)}>
      show
    </button>
  )
}

function setup(props) {
  render(
    <ToastProvider>
      <Trigger {...props} />
    </ToastProvider>,
  )
  return screen.getByRole('button', { name: 'show' })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('the live region is on the page before any message', () => {
  setup()
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
})

test('a toast is announced and disappears after 3 seconds', () => {
  const button = setup()
  act(() => button.click())
  expect(screen.getByRole('status')).toHaveTextContent('Saved to My Words')
  act(() => vi.advanceTimersByTime(2999))
  expect(screen.getByRole('status')).toHaveTextContent('Saved to My Words')
  act(() => vi.advanceTimersByTime(1))
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
})

test('a second toast restarts the 3 second timer', () => {
  const button = setup()
  act(() => button.click())
  act(() => vi.advanceTimersByTime(2000))
  act(() => button.click())
  act(() => vi.advanceTimersByTime(2000))
  expect(screen.getByRole('status')).toHaveTextContent('Saved to My Words')
  act(() => vi.advanceTimersByTime(1000))
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
})

describe('a toast with an action', () => {
  const onClick = vi.fn()
  const options = { action: { label: 'Undo', onClick } }
  beforeEach(() => onClick.mockReset())

  test('shows the button, which runs the action and closes the toast', () => {
    const button = setup({ message: 'Deleted', options })
    act(() => button.click())
    expect(screen.getByRole('status')).toHaveTextContent('Deleted')
    act(() => screen.getByRole('button', { name: 'Undo' }).click())
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  test('stays for 6 seconds', () => {
    const button = setup({ message: 'Deleted', options })
    act(() => button.click())
    act(() => vi.advanceTimersByTime(5999))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  test('does not close while the keyboard is on it', () => {
    const button = setup({ message: 'Deleted', options })
    act(() => button.click())
    const undo = screen.getByRole('button', { name: 'Undo' })
    act(() => undo.focus())
    act(() => vi.advanceTimersByTime(10000))
    expect(undo).toBeInTheDocument()
    act(() => undo.blur())
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  test('does not close while the pointer is on it', () => {
    const button = setup({ message: 'Deleted', options })
    act(() => button.click())
    const toast = screen.getByRole('status').firstChild
    fireEvent.mouseEnter(toast)
    act(() => vi.advanceTimersByTime(10000))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    fireEvent.mouseLeave(toast)
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })
})
