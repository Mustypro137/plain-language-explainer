import { describeText } from './describeText.js'

test.each([
  ['npm ERR! code ERESOLVE\nnpm ERR! could not resolve', 'Looks like an npm error · 2 lines'],
  ["TypeError: Cannot read properties of undefined (reading 'map')\n    at App (App.jsx:3:1)", 'Looks like a JavaScript error · 2 lines'],
  ['Traceback (most recent call last):\n  File "app.py", line 3, in <module>\nNameError: x', 'Looks like a Python error · 3 lines'],
  ['fatal: not a git repository', 'Looks like an error message · 1 sentence'],
  ['useEffect is a React Hook that lets you synchronize a component with an external system.', 'Looks like documentation · 1 sentence'],
])('%s', (text, label) => expect(describeText(text)).toBe(label))

test('a long paragraph is counted in sentences', () => {
  const first = 'Cross-Origin Resource Sharing is a mechanism that lets a server say which other origins may load its resources.'
  expect(describeText(`${first} Browsers also send a preflight request.`)).toBe('Looks like documentation · 2 sentences')
})

test('nothing for an empty box', () => expect(describeText('  \n ')).toBeNull())
