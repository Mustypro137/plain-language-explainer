// @vitest-environment node
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const config = JSON.parse(read('vercel.json'))
const headersFor = (source) => Object.fromEntries(config.headers.find((h) => h.source === source).headers.map((h) => [h.key, h.value]))

test('the Content-Security-Policy allows exactly the inline theme script in index.html', () => {
  // Vercel builds from git, where the file has LF line endings.
  const html = read('index.html').replace(/\r\n/g, '\n')
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`,
  )
  expect(scripts).toHaveLength(1)
  const policy = headersFor('/(.*)')['Content-Security-Policy']
  // If this fails, the theme script changed: put its new hash in vercel.json.
  expect(policy).toContain(`script-src 'self' ${scripts[0]}`)
})

test('the policy allows the Google Fonts the page loads, and nothing else outside the site', () => {
  const policy = headersFor('/(.*)')['Content-Security-Policy']
  for (const url of read('index.html').match(/https:\/\/fonts\.googleapis\.com\/css2[^"]+/g)) {
    expect(policy).toContain(`style-src 'self' ${new URL(url).origin}`)
  }
  expect(policy).toContain('font-src https://fonts.gstatic.com')
  expect(policy).toContain("connect-src 'self'")
  expect(policy).toContain("frame-ancestors 'none'")
})

test('built files, whose names change with each release, are cached for a year', () => {
  expect(headersFor('/assets/(.*)')['Cache-Control']).toBe('public, max-age=31536000, immutable')
})
