import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ListenButton from './ListenButton.jsx'

function fakeSpeech() {
  const synth = { speak: vi.fn(), cancel: vi.fn() }
  vi.stubGlobal('speechSynthesis', synth)
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(text) {
        this.text = text
      }
    },
  )
  return synth
}

afterEach(() => vi.unstubAllGlobals())

test('reads the word aloud in English, a little slowly', async () => {
  const synth = fakeSpeech()
  render(<ListenButton text="callback" />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Listen to callback' }))
  expect(synth.cancel).toHaveBeenCalled()
  const [utterance] = synth.speak.mock.calls[0]
  expect(utterance).toMatchObject({ text: 'callback', lang: 'en-US', rate: 0.9 })
})

test('shows nothing when the browser cannot speak', () => {
  const { container } = render(<ListenButton text="callback" />)
  expect(container).toBeEmptyDOMElement()
})
