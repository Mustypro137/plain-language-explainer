import { act, render, screen } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast.jsx'

function Trigger({ message = 'Saved to My Words' }) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast(message)}>
      show
    </button>
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('a toast is announced and disappears after 3 seconds', () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  )
  act(() => screen.getByRole('button', { name: 'show' }).click())
  expect(screen.getByRole('status')).toHaveTextContent('Saved to My Words')
  act(() => vi.advanceTimersByTime(2999))
  expect(screen.getByRole('status')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('a second toast restarts the 3 second timer', () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  )
  const button = screen.getByRole('button', { name: 'show' })
  act(() => button.click())
  act(() => vi.advanceTimersByTime(2000))
  act(() => button.click())
  act(() => vi.advanceTimersByTime(2000))
  expect(screen.getByRole('status')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1000))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
