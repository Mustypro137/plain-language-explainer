import { decodeShare, encodeShare, packJson, readShareHash, shareUrl } from './share.js'

const result = {
  kind: 'error',
  explanation: 'npm could not find versions that fit together.',
  why: 'Two packages want different React versions.',
  steps: ['Install with --legacy-peer-deps'],
  example: 'npm install --legacy-peer-deps',
  words: [{ word: 'peer', meaning: 'Next to and equal.', sentence: 'peer dependency', help: { lang: 'ar', meaning: 'نظير' } }],
  lines: [{ from: 1, to: 1, plain: 'npm stopped.', help: { lang: 'ar', plain: 'توقف npm.' } }],
  help: { lang: 'ar', explanation: 'شرح', why: 'لماذا' },
}
const shared = { text: 'npm ERR! could not resolve 🙂 خطأ\nreact@"^18.2.0" from thing@1.2.3', result, level: null, language: 'ar' }

// Hand-made link data in the plain form, for payloads the app itself would never write.
const crafted = (over) => packJson({ v: 1, ...shared, ...over })

function withoutCompression(fn) {
  vi.stubGlobal('CompressionStream', undefined)
  return Promise.resolve(fn()).finally(() => vi.unstubAllGlobals())
}

// A single-character change at many places in the data must never be read as different content:
// it is refused, or (where the change only touches spare bits) it reads exactly as the original.
async function everyChangeRefused(data) {
  const original = await decodeShare(data)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const step = Math.max(1, Math.floor(data.length / 120))
  for (let i = 1; i < data.length; i += step) {
    const at = alphabet.indexOf(data[i])
    for (const c of [alphabet[(at + 1) % 64], alphabet[(at + 37) % 64]]) {
      const changed = data.slice(0, i) + c + data.slice(i + 1)
      if (changed === data) continue
      const read = await decodeShare(changed)
      if (read !== null) expect(read, `change at ${i}`).toEqual(original)
    }
  }
}

test('what goes in comes back out, with non-English text and translations', async () => {
  expect(await decodeShare(await encodeShare(shared))).toEqual(shared)
})

test('the data is compressed, so the link is shorter than the plain text', async () => {
  const long = { ...shared, text: 'npm ERR! could not resolve dependency\n'.repeat(50) }
  const data = await encodeShare(long)
  expect(data[0]).toBe('z')
  expect(data.length).toBeLessThan(JSON.stringify(long).length)
})

test('a browser without compression still makes a working link', async () => {
  await withoutCompression(async () => {
    const data = await encodeShare(shared)
    expect(data[0]).toBe('j')
    expect(await decodeShare(data)).toEqual(shared)
  })
})

test('the data always ends in a letter or digit, so a link pasted into a chat or on GitHub keeps its end', async () => {
  for (let i = 0; i < 20; i++) {
    const data = await encodeShare({ ...shared, text: `${shared.text} ${i} ${'x'.repeat(i)}` })
    expect(data).toMatch(/[A-Za-z0-9]$/)
  }
})

describe('a link that is not right opens as nothing', () => {
  test('cut short', async () => {
    const data = await encodeShare(shared)
    for (const cut of [1, 2, 5, 10, 40]) expect(await decodeShare(data.slice(0, -cut))).toBeNull()
  })

  test('any one character changed, in the compressed form', async () => {
    await everyChangeRefused(await encodeShare(shared))
  })

  test('any one character changed, in the plain form', async () => {
    await everyChangeRefused(await withoutCompression(() => encodeShare(shared)))
  })

  test('an unknown kind of data, or none', async () => {
    expect(await decodeShare('xabc0')).toBeNull()
    expect(await decodeShare('')).toBeNull()
    expect(await decodeShare('j!!!0')).toBeNull()
  })

  test('a newer version than this app knows', async () => {
    expect(await decodeShare(packJson({ v: 2, ...shared }))).toBeNull()
  })

  test('a text longer than the app ever explains', async () => {
    expect(await decodeShare(crafted({ text: 'a'.repeat(3001) }))).toBeNull()
  })

  test('an answer of the wrong shape', async () => {
    expect(await decodeShare(crafted({ result: { ...result, lines: [{ from: 0, to: 0, plain: 'x' }] } }))).toBeNull()
    expect(await decodeShare(crafted({ result: { ...result, words: [{ word: 'x' }] } }))).toBeNull()
  })

  test('more than an answer ever holds: too many words, steps or lines, or an empty word', async () => {
    const word = (i) => ({ word: `w${i}`, meaning: 'm', sentence: '' })
    expect(await decodeShare(crafted({ result: { ...result, words: Array.from({ length: 11 }, (_, i) => word(i)) } }))).toBeNull()
    expect(await decodeShare(crafted({ result: { ...result, steps: Array.from({ length: 11 }, () => 's') } }))).toBeNull()
    const lines = Array.from({ length: 41 }, (_, i) => ({ from: i + 1, to: i + 1, plain: 'p' }))
    expect(await decodeShare(crafted({ result: { ...result, lines } }))).toBeNull()
    expect(await decodeShare(crafted({ result: { ...result, words: [{ word: '  ', meaning: 'm', sentence: '' }] } }))).toBeNull()
  })

  test('an unknown language or level', async () => {
    expect(await decodeShare(crafted({ language: 'xx' }))).toBeNull()
    expect(await decodeShare(crafted({ level: 'huge' }))).toBeNull()
  })

  test('data far longer than any real link', async () => {
    expect(await decodeShare(`z${'A'.repeat(30001)}0`)).toBeNull()
  })
})

test('a short link that would unpack to far more than any answer is refused', async () => {
  // Megabytes of zeros compress to almost nothing: the classic "bomb".
  const zeros = new Uint8Array(20_000_000)
  const packed = new Uint8Array(await new Response(new Response(zeros).body.pipeThrough(new CompressionStream('deflate'))).arrayBuffer())
  const b64 = btoa(String.fromCharCode(...packed)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  // Count how much of the link's data is handed to the unpacker before it gives up.
  const Real = globalThis.DecompressionStream
  let fed = 0
  vi.stubGlobal(
    'DecompressionStream',
    class {
      constructor(format) {
        const real = new Real(format)
        const counter = new TransformStream({
          transform(chunk, controller) {
            fed += chunk.length
            controller.enqueue(chunk)
          },
        })
        counter.readable.pipeTo(real.writable).catch(() => {})
        this.writable = counter.writable
        this.readable = real.readable
      }
    },
  )
  try {
    expect(b64.length).toBeLessThan(30_000) // within the length limit, so only the unpack limit stops it
    expect(await decodeShare(`z${b64}0`)).toBeNull()
    expect(fed).toBeGreaterThan(0)
  } finally {
    vi.unstubAllGlobals()
  }
})

test('extra fields in the data are not passed on', async () => {
  expect(await decodeShare(crafted({ followUps: [{ question: 'q', answer: 'a' }], extra: 1 }))).toEqual(shared)
})

test('reads the data from the address after #d=', () => {
  expect(readShareHash('#d=abc')).toBe('abc')
  expect(readShareHash('')).toBeNull()
  expect(readShareHash('#x=1')).toBeNull()
  expect(readShareHash('#d=')).toBeNull()
})

test('the link points at the shared page', () => {
  expect(shareUrl('abc', 'https://site.example')).toBe('https://site.example/s#d=abc')
})
