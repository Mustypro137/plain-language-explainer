import { explainText } from './explainText.js'

const data = { kind: 'docs', explanation: 'e', why: 'w', steps: [], example: '', words: [] }

function stubFetch(status, body) {
  const fn = vi.fn().mockResolvedValue({ status, ok: status >= 200 && status < 300, json: async () => body })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

test('returns data on 200 and posts the text as JSON', async () => {
  const fetchFn = stubFetch(200, data)
  expect(await explainText('hello')).toEqual({ ok: true, data })
  const [url, init] = fetchFn.mock.calls[0]
  expect(url).toBe('/api/explain')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body)).toEqual({ text: 'hello' })
})

test.each([
  [400, { error: 'too_long' }, 'too_long'],
  [400, { error: 'empty' }, 'empty'],
  [429, { error: 'busy' }, 'busy'],
  [502, { error: 'ai_failed' }, 'ai_failed'],
  [500, {}, 'ai_failed'],
])('status %i with body %o gives %s', async (status, body, error) => {
  stubFetch(status, body)
  expect(await explainText('x')).toEqual({ ok: false, error })
})

test('a network failure is offline', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  expect(await explainText('x')).toEqual({ ok: false, error: 'offline' })
})

test('an unreadable error body still gives ai_failed', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      json: async () => {
        throw new Error('not json')
      },
    }),
  )
  expect(await explainText('x')).toEqual({ ok: false, error: 'ai_failed' })
})

test('sends a level when one is given', async () => {
  const fetchFn = stubFetch(200, data)
  await explainText('hello', 'simpler')
  expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ text: 'hello', level: 'simpler' })
})

test('a rejected level is reported', async () => {
  stubFetch(400, { error: 'bad_level' })
  expect(await explainText('x', 'detail')).toEqual({ ok: false, error: 'bad_level' })
})

test('busy passes on the wait time and the limit', async () => {
  stubFetch(429, { error: 'busy', retryAfter: 8, limit: 'minute' })
  expect(await explainText('x')).toEqual({ ok: false, error: 'busy', retryAfter: 8, limit: 'minute' })
})

test('busy without a usable wait time stays plain busy', async () => {
  stubFetch(429, { error: 'busy', retryAfter: 'soon', limit: 'week' })
  expect(await explainText('x')).toEqual({ ok: false, error: 'busy' })
})
