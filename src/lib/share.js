import { MAX_SEGMENTS } from '../../shared/segments.js'
import { isLanguage, isLevel, isResult } from './answerShape.js'

// "Share": the pasted text and its answer travel inside the link, after the #, which browsers
// never send to a server. Nothing is stored anywhere.
//
// The data is one letter for the form, base64url, and a closing "0":
//   z  compressed by the browser ("deflate", whose own checksum catches a changed character)
//   j  plain JSON followed by a 4-byte checksum, for browsers without compression
// The closing "0" keeps the end a letter or digit: chat apps and GitHub leave a trailing "_"
// or "-" out of a link they make clickable.

const VERSION = 1
const MAX_TEXT = 3000
// Limits for a link someone may have made by hand, well above anything the app writes.
// About 22 KB once read: even fully unpacked by a browser that ignores the slices below, that
// stays near 22 MB. A real link is a few thousand characters.
const MAX_DATA = 30_000 // characters of link data
const MAX_BYTES = 200_000 // bytes once unpacked
const MAX_WORDS = 10
const MAX_STEPS = 10
const END = '0'
const SLICE = 512

function toBase64url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(text) {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('not base64url')
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  // Only the exact spelling the app writes: the last character has spare bits a change could hide in.
  if (toBase64url(bytes) !== text) throw new Error('not canonical')
  return bytes
}

// FNV-1a, 32 bits: enough to notice a changed or missing character in the plain form.
function checksum(bytes) {
  let h = 0x811c9dc5
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0
  return Uint8Array.of(h >>> 24, (h >>> 16) & 255, (h >>> 8) & 255, h & 255)
}

const sameBytes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

async function compress(bytes) {
  const stream = new Response(bytes).body.pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// Feeds the packed bytes to the unpacker a little at a time, and only when it asks, so a link
// that would grow past MAX_BYTES is refused after a slice or two instead of after unpacking it all.
async function decompress(bytes) {
  let at = 0
  const source = new ReadableStream(
    {
      pull(controller) {
        if (at >= bytes.length) controller.close()
        else {
          controller.enqueue(bytes.slice(at, at + SLICE))
          at += SLICE
        }
      },
    },
    { highWaterMark: 0 },
  )
  const reader = source.pipeThrough(new DecompressionStream('deflate')).getReader()
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > MAX_BYTES) {
      await reader.cancel().catch(() => {})
      throw new Error('too big')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

const filled = (s) => typeof s === 'string' && s.trim() !== ''

// Only the fields the shared page needs, each checked as History checks its own entries, plus
// the sizes an answer from the AI never goes beyond.
function checked(data) {
  if (data === null || typeof data !== 'object' || data.v !== VERSION) return null
  const { text, result, level = null, language = null } = data
  if (!filled(text) || text.length > MAX_TEXT) return null
  if (!isResult(result) || !isLevel(level) || !isLanguage(language)) return null
  if (result.words.length > MAX_WORDS || !result.words.every((w) => filled(w.word))) return null
  if (result.steps.length > MAX_STEPS || (result.lines?.length ?? 0) > MAX_SEGMENTS) return null
  return { text, result, level, language }
}

// The plain form of any object, with its checksum and end mark. encodeShare uses it when the
// browser cannot compress.
export function packJson(obj) {
  const json = new TextEncoder().encode(JSON.stringify(obj))
  const bytes = new Uint8Array(json.length + 4)
  bytes.set(json)
  bytes.set(checksum(json), json.length)
  return `j${toBase64url(bytes)}${END}`
}

export async function encodeShare({ text, result, level = null, language = null }) {
  const payload = { v: VERSION, text, result, level, language }
  if (typeof CompressionStream !== 'function') return packJson(payload)
  const json = new TextEncoder().encode(JSON.stringify(payload))
  return `z${toBase64url(await compress(json))}${END}`
}

export async function decodeShare(data) {
  try {
    if (typeof data !== 'string' || data.length < 3 || data.length > MAX_DATA || !data.endsWith(END)) return null
    const kind = data[0]
    const body = fromBase64url(data.slice(1, -1))
    let json
    if (kind === 'z') {
      if (typeof DecompressionStream !== 'function') return null
      json = await decompress(body)
    } else if (kind === 'j') {
      if (body.length < 5 || body.length > MAX_BYTES) return null
      json = body.subarray(0, -4)
      if (!sameBytes(checksum(json), body.subarray(-4))) return null
    } else {
      return null
    }
    return checked(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json)))
  } catch {
    return null
  }
}

export const shareUrl = (data, origin = window.location.origin) => `${origin}/s#d=${data}`

export function readShareHash(hash) {
  const m = /^#d=(.+)$/.exec(hash ?? '')
  return m ? m[1] : null
}
