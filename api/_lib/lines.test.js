import { buildMessages } from './aiProvider.js'
import { parseAiAnswer } from './validate.js'

const answer = (lines) =>
  JSON.stringify({ kind: 'error', explanation: 'e', why: 'w', steps: [], example: '', words: [], lines })

const linesOf = (lines, parts, language) => parseAiAnswer(answer(lines), language, parts).lines

test('keeps each line as from–to with its plain text', () => {
  expect(linesOf([{ n: 1, plain: ' One. ' }, { n: 2, to: 4, plain: 'Where it happened.' }], 4)).toEqual([
    { from: 1, to: 1, plain: 'One.' },
    { from: 2, to: 4, plain: 'Where it happened.' },
  ])
})

test('puts lines in order, and drops ones out of range, overlapping or without text', () => {
  const lines = [
    { n: 3, plain: 'Three.' },
    { n: 1, to: 2, plain: 'One and two.' },
    { n: 2, plain: 'Two again.' },
    { n: 9, plain: 'Too far.' },
    { n: 4, plain: '' },
    { n: '5', plain: 'Not a number.' },
  ]
  expect(linesOf(lines, 5)).toEqual([
    { from: 1, to: 2, plain: 'One and two.' },
    { from: 3, to: 3, plain: 'Three.' },
  ])
})

test('a group that runs past the end stops at the last part', () => {
  expect(linesOf([{ n: 2, to: 99, plain: 'Stack.' }], 3)).toEqual([{ from: 2, to: 3, plain: 'Stack.' }])
})

test('missing or broken lines give an empty list, and the answer still works', () => {
  expect(linesOf(undefined, 3)).toEqual([])
  expect(linesOf('nope', 3)).toEqual([])
  expect(linesOf([{ n: 1, plain: 'x' }], 0)).toEqual([])
})

test('keeps the translation of a line only when a language was asked for', () => {
  const lines = [{ n: 1, plain: 'One.', plain_help: 'Uno.' }]
  expect(linesOf(lines, 1, 'es')).toEqual([{ from: 1, to: 1, plain: 'One.', help: { lang: 'es', plain: 'Uno.' } }])
  expect(linesOf(lines, 1)).toEqual([{ from: 1, to: 1, plain: 'One.' }])
})

test('the prompt asks for line translations with a language, and groups stack traces', () => {
  const [system] = buildMessages('t', null, 'es')
  expect(system.content).toContain('"plain_help"')
  expect(system.content).toContain('"at ..." lines of a stack trace are ONE entry')
})
