import { buildMessages } from './aiProvider.js'

test('sends the system prompt and the text, with no level note by default', () => {
  const [system, user] = buildMessages('some text', null)
  expect(system.role).toBe('system')
  expect(system.content).toMatch(/Reply with one JSON object/)
  expect(system.content).not.toMatch(/this version/i)
  expect(user).toEqual({ role: 'user', content: 'some text' })
})

test('the simpler level asks for an even simpler version', () => {
  const [system] = buildMessages('t', 'simpler')
  expect(system.content).toMatch(/even simpler/i)
})

test('the detail level asks for more detail in simple words', () => {
  const [system] = buildMessages('t', 'detail')
  expect(system.content).toMatch(/more detail/i)
  expect(system.content).toMatch(/simple words/i)
})

test('the JSON keys stay the same at every level', () => {
  for (const level of [null, 'simpler', 'detail']) {
    const [system] = buildMessages('t', level)
    for (const key of ['"kind"', '"explanation"', '"why"', '"steps"', '"example"', '"words"']) expect(system.content).toContain(key)
  }
})
