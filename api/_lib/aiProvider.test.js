import { askAi, buildMessages, readRateLimit } from './aiProvider.js'

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

test('asks for at most 5 words to learn, with no file or code names', () => {
  const [system] = buildMessages('t', null)
  expect(system.content).toMatch(/up to 5 hard words/)
  expect(system.content).toMatch(/Never include file names, paths, line numbers/)
  expect(system.content).toMatch(/names from the user's own code/)
})

test('asks for a topic from the fixed list on each word', () => {
  const [system] = buildMessages('t', null)
  expect(system.content).toContain('"topic"')
  for (const topic of ['JavaScript', 'React', 'CSS', 'HTML', 'Node and npm', 'Git', 'Web and HTTP', 'General']) {
    expect(system.content).toContain(topic)
  }
})

const TPM = 'Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` service tier `on_demand` on tokens per minute (TPM): Limit 8000, Used 7078, Requested 1570. Please try again in 4.86s. Need more tokens?'
const RPD = 'Rate limit reached for model `m` on requests per day (RPD): Limit 1000, Used 1000, Requested 1. Please try again in 2h13m20.5s.'

test.each([
  [TPM, null, { retryAfter: 5, limit: 'minute' }],
  [RPD, null, { retryAfter: 8001, limit: 'day' }],
  ['... on tokens per minute (TPM) ... Please try again in 825ms.', null, { retryAfter: 1, limit: 'minute' }],
  ['... on tokens per day (TPD) ... Please try again in 7m12s.', null, { retryAfter: 432, limit: 'day' }],
  ['Too many requests', '12', { retryAfter: 12, limit: null }],
  ['Too many requests', null, { retryAfter: null, limit: null }],
  [undefined, 'soon', { retryAfter: null, limit: null }],
])('readRateLimit(%#) reads the wait and the limit', (message, header, expected) => {
  expect(readRateLimit(message, header)).toEqual(expected)
})

test('askAi reports the wait time when Groq says the limit is reached', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '5' }),
      json: async () => ({ error: { message: TPM, code: 'rate_limit_exceeded' } }),
    }),
  )
  try {
    await expect(askAi('hi')).rejects.toMatchObject({ status: 429, retryAfter: 5, limit: 'minute' })
  } finally {
    vi.unstubAllGlobals()
  }
})

test('askAi still reports other errors by status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, headers: new Headers(), json: async () => ({}) }))
  try {
    await expect(askAi('hi')).rejects.toMatchObject({ status: 500 })
  } finally {
    vi.unstubAllGlobals()
  }
})
