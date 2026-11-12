import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CountdownRing, { shortWait } from './CountdownRing.jsx'
import EmptyState from './EmptyState.jsx'
import Loading, { SLOW_AFTER_MS } from './Loading.jsx'

describe('Loading', () => {
  afterEach(() => vi.useRealTimers())

  test('shows the user’s own lines at once, numbered, and says how many', () => {
    render(<Loading text={'npm ERR! code ERESOLVE\n\n  npm ERR! could not resolve  \n'} />)
    expect(screen.getByRole('status')).toHaveTextContent('Reading your 2 lines…')
    expect(screen.getByText('npm ERR! code ERESOLVE')).toBeInTheDocument()
    expect(screen.getByText('npm ERR! could not resolve')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  test('one line is "your text"', () => {
    render(<Loading text="useEffect is a React Hook." />)
    expect(screen.getByRole('status')).toHaveTextContent('Reading your text…')
  })

  test('shows six lines and counts the rest', () => {
    render(<Loading text={Array.from({ length: 9 }, (_, i) => `line ${i}`).join('\n')} />)
    expect(screen.getByText('line 5')).toBeInTheDocument()
    expect(screen.queryByText('line 6')).not.toBeInTheDocument()
    expect(screen.getByText('and 3 more lines')).toBeInTheDocument()
  })

  test('says why after eight seconds', () => {
    vi.useFakeTimers()
    render(<Loading text="x" />)
    expect(screen.queryByText(/Still working/)).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(SLOW_AFTER_MS))
    expect(screen.getByText('Still working. The free AI is busy right now.')).toBeInTheDocument()
  })
})

describe('CountdownRing', () => {
  test.each([
    [37, '0:37'],
    [65, '1:05'],
    [3599, '59:59'],
    [8001, '2h'],
  ])('%i seconds is %s', (seconds, text) => expect(shortWait(seconds)).toBe(text))

  test('the ring empties as the wait runs out, and is hidden from screen readers', () => {
    const { container, rerender } = render(<CountdownRing remaining={30} total={60} />)
    const ring = () => container.querySelectorAll('circle')[1]
    const length = Number(ring().getAttribute('stroke-dasharray'))
    expect(Number(ring().getAttribute('stroke-dashoffset'))).toBeCloseTo(length / 2)
    rerender(<CountdownRing remaining={0} total={60} />)
    expect(Number(ring().getAttribute('stroke-dashoffset'))).toBeCloseTo(length)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

test('EmptyState has its main link and room for more actions', () => {
  render(
    <MemoryRouter>
      <EmptyState title="Nothing yet" text="Some help." linkTo="/" linkLabel="Explain something">
        <button type="button">Import a backup</button>
      </EmptyState>
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: 'Nothing yet' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Explain something' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('button', { name: 'Import a backup' })).toBeInTheDocument()
})
