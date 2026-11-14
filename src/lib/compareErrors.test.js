import { compareErrors } from './compareErrors.js'

const eresolve = 'npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE could not resolve\nnpm ERR! While resolving: app@1.0.0'
const eacces = 'npm ERR! code EACCES\nnpm ERR! syscall mkdir\nnpm ERR! Error: EACCES: permission denied'

test('names the error that went away and the one that is new', () => {
  const r = compareErrors(eresolve, eacces)
  expect(r.gone).toContain('npm ERR! code ERESOLVE')
  expect(r.added).toContain('npm ERR! code EACCES')
  expect(r.added).toContain('npm ERR! Error: EACCES: permission denied')
})

test('the same error at another place in a file counts as the same', () => {
  const a = "TypeError: Cannot read properties of undefined (reading 'map')\n    at App (App.jsx:14:22)"
  const b = "TypeError: Cannot read properties of undefined (reading 'map')\n    at App (App.jsx:18:9)"
  expect(compareErrors(a, b)).toEqual({ gone: [], added: [] })
})

test('one kind of JavaScript error replaced by another', () => {
  const r = compareErrors("TypeError: Cannot read properties of undefined (reading 'map')", 'ReferenceError: items is not defined')
  expect(r).toEqual({
    gone: ["TypeError: Cannot read properties of undefined (reading 'map')"],
    added: ['ReferenceError: items is not defined'],
  })
})

test('spaces and letter case do not make a line different', () => {
  expect(compareErrors('Error:   Build   failed', 'error: build failed')).toEqual({ gone: [], added: [] })
})

test('texts without error lines have nothing to compare', () => {
  expect(compareErrors('useEffect lets you sync a component.', 'A promise is a value that arrives later.')).toBeNull()
})

test('at most five lines on each side', () => {
  const many = (p) => Array.from({ length: 9 }, (_, i) => `${p}Error: problem ${i}`).join('\n')
  const r = compareErrors(many('Type'), many('Range'))
  expect(r.gone).toHaveLength(5)
  expect(r.added).toHaveLength(5)
})

test('a fatal git message and a failed build line count as error lines', () => {
  const r = compareErrors('fatal: not a git repository', 'Build failed with 2 errors')
  expect(r.gone).toEqual(['fatal: not a git repository'])
  expect(r.added).toEqual(['Build failed with 2 errors'])
})

test('the browser console form ("Uncaught …") is compared too', () => {
  expect(compareErrors("Uncaught TypeError: x.map is not a function", 'Uncaught ReferenceError: items is not defined')).toEqual({
    gone: ['Uncaught TypeError: x.map is not a function'],
    added: ['Uncaught ReferenceError: items is not defined'],
  })
})

test('newer npm, which starts every line with "npm error", gives the same error as the same', () => {
  const run = (log) => `npm error code ERESOLVE\nnpm error ERESOLVE could not resolve\nnpm error A complete log of this run can be found in: C:/npm-cache/_logs/${log}-debug-0.log`
  expect(compareErrors(run('2026-11-14T10_00'), run('2026-11-14T10_05'))).toEqual({ gone: [], added: [] })
  expect(compareErrors(run('a'), 'npm error code EACCES')).toEqual({ gone: ['npm error code ERESOLVE'], added: ['npm error code EACCES'] })
})

test('stack lines are never error lines, even with "error" in them', () => {
  expect(compareErrors('    at console.error (index.js:3:1)', '    at handleError (/src/error/handler.js:9:2)')).toBeNull()
})

test('a different port is a different error', () => {
  const r = compareErrors('Error: listen EADDRINUSE: address already in use :::3000', 'Error: listen EADDRINUSE: address already in use :::5173')
  expect(r.gone).toHaveLength(1)
  expect(r.added).toHaveLength(1)
})
