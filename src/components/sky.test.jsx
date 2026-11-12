import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header.jsx'
import WordSky from './WordSky.jsx'
import { flyStar } from '../lib/flyStar.js'
import { CELL_H, CELL_W, skyLayout } from '../lib/sky.js'
import { saveWord } from '../lib/wordStore.js'

const word = (id, topic, box = 1, extra = {}) => ({
  id,
  word: id,
  meaning: `${id} means`,
  sentence: '',
  topic,
  box,
  savedAt: `2026-01-0${(id.length % 9) + 1}T00:00:00Z`,
  ...extra,
})

describe('skyLayout', () => {
  const words = [
    word('hook', 'React'),
    word('prop', 'React'),
    word('callback', 'JavaScript'),
    word('state', 'React'),
    word('render', 'React'),
  ]

  test('one constellation per topic, the biggest first', () => {
    expect(skyLayout(words).map((c) => [c.topic, c.stars.length])).toEqual([
      ['React', 4],
      ['JavaScript', 1],
    ])
  })

  test('every star has its own cell, so no two labels overlap', () => {
    const [react] = skyLayout(words)
    const cells = react.stars.map((s) => `${Math.floor(s.x / CELL_W)}:${Math.round((s.y - 26) / CELL_H)}`)
    expect(new Set(cells).size).toBe(react.stars.length)
    for (const s of react.stars) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(react.width)
    }
  })

  test('stars stay in the same place every time', () => {
    expect(skyLayout(words)).toEqual(skyLayout([...words].reverse()))
  })

  test('a narrow screen uses at most two stars a row', () => {
    expect(skyLayout(words, 2)[0].width).toBe(2 * CELL_W)
    expect(skyLayout(words)[0].width).toBe(3 * CELL_W)
  })
})

describe('WordSky', () => {
  const today = '2026-02-01'
  const words = [
    word('hook', 'React', 3, { due: '2026-03-01' }),
    word('prop', 'React', 2, { due: '2026-01-15' }),
    word('callback', 'JavaScript', 1),
  ]

  test('every word is a button that says its level, and fading only when practised and due again', () => {
    render(<WordSky words={words} today={today} selectedId={null} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'hook, known' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'prop, learning, fading, due today' })).toBeInTheDocument()
    // Never practised: due for a first round, but not fading.
    expect(screen.getByRole('button', { name: 'callback, new' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'callback, new' })).not.toHaveClass('star-due')
    expect(screen.getByRole('region', { name: 'React, 2' })).toBeInTheDocument()
  })

  test('a tap chooses the star, a second tap lets it go', async () => {
    const onSelect = vi.fn()
    const { rerender } = render(<WordSky words={words} today={today} selectedId={null} onSelect={onSelect} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^hook/ }))
    expect(onSelect).toHaveBeenLastCalledWith('hook')
    rerender(<WordSky words={words} today={today} selectedId="hook" onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: /^hook/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /^hook/ }))
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })
})

describe('the save-a-star moment', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  test('does nothing where the browser cannot animate', () => {
    document.body.innerHTML = '<a data-star-target>My Words</a><button>Save</button>'
    expect(flyStar(document.querySelector('button'))).toBe(false)
    expect(document.querySelector('.fly-star')).toBeNull()
  })

  test('sends a star from the button towards My Words, then removes it', () => {
    document.body.innerHTML = '<a data-star-target>My Words</a><button>Save</button>'
    const flight = {}
    Element.prototype.animate = vi.fn(() => flight)
    expect(flyStar(document.querySelector('button'))).toBe(true)
    expect(document.querySelector('.fly-star')).toHaveAttribute('aria-hidden', 'true')
    flight.onfinish()
    expect(document.querySelector('.fly-star')).toBeNull()
    delete Element.prototype.animate
  })

  test('is skipped for people who ask for less motion', () => {
    document.body.innerHTML = '<a data-star-target>My Words</a><button>Save</button>'
    Element.prototype.animate = vi.fn()
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(flyStar(document.querySelector('button'))).toBe(false)
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    delete Element.prototype.animate
    vi.unstubAllGlobals()
  })
})

describe('My Words in the top bar', () => {
  beforeEach(() => localStorage.clear())

  test('shows how many words are saved, and is where the star lands', () => {
    saveWord({ word: 'callback', meaning: 'm', sentence: 's' })
    saveWord({ word: 'promise', meaning: 'm', sentence: 's' })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    const link = within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'My Words, 2 saved' })
    expect(link).toHaveAttribute('data-star-target')
  })
})
