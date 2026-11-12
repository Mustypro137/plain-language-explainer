import { handleExplain } from './handleExplain.js'

const good = {
  kind: 'error',
  explanation: 'e',
  why: 'w',
  steps: ['1'],
  example: 'x',
  words: [{ word: 'undefined', meaning: 'm', sentence: 's', topic: 'JavaScript' }],
}

test('400 for empty text, AI not called', async () => {
  const askAi = vi.fn()
  const r = await handleExplain({ text: '   ' }, askAi)
  expect(r).toEqual({ status: 400, body: { error: 'empty' } })
  expect(askAi).not.toHaveBeenCalled()
})

test('400 for a missing body, AI not called', async () => {
  const askAi = vi.fn()
  const r = await handleExplain(undefined, askAi)
  expect(r).toEqual({ status: 400, body: { error: 'empty' } })
  expect(askAi).not.toHaveBeenCalled()
})

test('400 too_long for 3,001 characters, AI not called', async () => {
  const askAi = vi.fn()
  const r = await handleExplain({ text: 'a'.repeat(3001) }, askAi)
  expect(r).toEqual({ status: 400, body: { error: 'too_long' } })
  expect(askAi).not.toHaveBeenCalled()
})

test('200 with the parsed answer', async () => {
  const askAi = vi.fn().mockResolvedValue(JSON.stringify(good))
  const r = await handleExplain({ text: 'hi' }, askAi)
  expect(r).toEqual({ status: 200, body: { ...good, lines: [] } })
  expect(askAi).toHaveBeenCalledWith('hi', null, null)
})

test('tries once more after a broken answer', async () => {
  const askAi = vi.fn().mockResolvedValueOnce('oops').mockResolvedValueOnce(JSON.stringify(good))
  const r = await handleExplain({ text: 'hi' }, askAi)
  expect(r.status).toBe(200)
  expect(askAi).toHaveBeenCalledTimes(2)
})

test('502 ai_failed after two broken answers', async () => {
  const askAi = vi.fn().mockResolvedValue('oops')
  const r = await handleExplain({ text: 'hi' }, askAi)
  expect(r).toEqual({ status: 502, body: { error: 'ai_failed' } })
  expect(askAi).toHaveBeenCalledTimes(2)
})

test('429 busy when the provider is rate limited, without a second try', async () => {
  const askAi = vi.fn().mockRejectedValue(Object.assign(new Error('rate'), { status: 429 }))
  expect(await handleExplain({ text: 'hi' }, askAi)).toEqual({ status: 429, body: { error: 'busy' } })
  expect(askAi).toHaveBeenCalledTimes(1)
})

test('502 ai_failed when the provider throws another error', async () => {
  const askAi = vi.fn().mockRejectedValue(new Error('boom'))
  expect(await handleExplain({ text: 'hi' }, askAi)).toEqual({ status: 502, body: { error: 'ai_failed' } })
})

test('tries once more after a provider error such as failed JSON mode', async () => {
  const askAi = vi
    .fn()
    .mockRejectedValueOnce(Object.assign(new Error('json_validate_failed'), { status: 400 }))
    .mockResolvedValueOnce(JSON.stringify(good))
  const r = await handleExplain({ text: 'hi' }, askAi)
  expect(r.status).toBe(200)
  expect(askAi).toHaveBeenCalledTimes(2)
})

test('passes a level to the AI', async () => {
  const askAi = vi.fn().mockResolvedValue(JSON.stringify(good))
  const r = await handleExplain({ text: 'hi', level: 'simpler' }, askAi)
  expect(r.status).toBe(200)
  expect(askAi).toHaveBeenCalledWith('hi', 'simpler', null)
})

test('400 bad_level for an unknown level, AI not called', async () => {
  const askAi = vi.fn()
  expect(await handleExplain({ text: 'hi', level: 'harder' }, askAi)).toEqual({ status: 400, body: { error: 'bad_level' } })
  expect(askAi).not.toHaveBeenCalled()
})

const limitError = (extra) => Object.assign(new Error('rate'), { status: 429, ...extra })

test('429 busy passes on the wait time and which limit was hit', async () => {
  const askAi = vi.fn().mockRejectedValue(limitError({ retryAfter: 5, limit: 'minute' }))
  expect(await handleExplain({ text: 'hi' }, askAi)).toEqual({
    status: 429,
    body: { error: 'busy', retryAfter: 5, limit: 'minute' },
  })
})

test.each([[0], [-3], [Number.NaN], ['5'], [null]])('a wait time of %p is left out', async (retryAfter) => {
  const askAi = vi.fn().mockRejectedValue(limitError({ retryAfter, limit: 'other' }))
  expect(await handleExplain({ text: 'hi' }, askAi)).toEqual({ status: 429, body: { error: 'busy' } })
})

test('a very long wait is capped at one day', async () => {
  const askAi = vi.fn().mockRejectedValue(limitError({ retryAfter: 999999, limit: 'day' }))
  expect((await handleExplain({ text: 'hi' }, askAi)).body).toEqual({ error: 'busy', retryAfter: 86400, limit: 'day' })
})
