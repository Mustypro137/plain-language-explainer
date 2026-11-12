// Example texts with answers written in advance, so a new visitor can see what the app
// does without pasting anything and without using the free AI limit.
// samples.test.js checks every answer against the same rules as a real AI answer.
export const SAMPLES = [
  {
    id: 'react-error',
    label: 'A React error',
    text: `TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (ProductList.jsx:14:22)
    at renderWithHooks (react-dom.development.js:15486:18)`,
    result: {
      kind: 'error',
      explanation:
        'Your code called .map() on something that has no value yet. .map() only works on a list (an array). Here the value was undefined, so JavaScript stopped and React could not show the ProductList component.',
      why: 'This often happens when data comes from a server. On the first render the data has not arrived yet, so the variable is still undefined. It can also happen when a prop has a different name than you expect.',
      steps: [
        'Open ProductList.jsx at line 14 and find the value just before .map().',
        'Give it a starting value: useState([]) instead of useState().',
        'Add console.log() just before line 14 to see what the value really is.',
      ],
      example: `// Before: products is undefined on the first render
const [products, setProducts] = useState()

// After: start with an empty list
const [products, setProducts] = useState([])

return products.map((p) => <li key={p.id}>{p.name}</li>)`,
      lines: [
        { from: 1, to: 1, plain: 'JavaScript stopped because your code used .map() on a value that is undefined.' },
        { from: 2, to: 3, plain: 'It happened in your ProductList component, in ProductList.jsx at line 14.' },
      ],
      words: [
        {
          word: 'TypeError',
          meaning: 'An error that happens when a value is the wrong type for what the code tries to do with it.',
          sentence: "TypeError: Cannot read properties of undefined (reading 'map')",
          topic: 'JavaScript',
        },
        {
          word: 'undefined',
          meaning: 'A value that means a variable exists but has no value yet.',
          sentence: "TypeError: Cannot read properties of undefined (reading 'map')",
          topic: 'JavaScript',
        },
        {
          word: 'property',
          meaning: 'A named value that belongs to an object, like user.name.',
          sentence: "TypeError: Cannot read properties of undefined (reading 'map')",
          topic: 'JavaScript',
        },
        {
          word: 'map',
          meaning: 'An array method that runs a function on each item and gives back a new array.',
          sentence: "TypeError: Cannot read properties of undefined (reading 'map')",
          topic: 'JavaScript',
        },
      ],
    },
  },
  {
    id: 'npm-error',
    label: 'An npm error',
    text: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! While resolving: some-chart-lib@2.1.0
npm ERR! Found: react@19.0.0
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^17.0.0" from some-chart-lib@2.1.0`,
    result: {
      kind: 'error',
      explanation:
        'npm could not install your packages. The package some-chart-lib says it only works with React 17. Your project uses React 19, so npm stops instead of guessing.',
      why: 'Packages can say which versions of other packages they need. When those versions do not match your project, npm 7 and newer stop the install, because the package might break.',
      steps: [
        'Check if a newer version of some-chart-lib works with React 19, and install that version.',
        'If there is none, look for another chart package that works with React 19.',
        'Last choice: run npm install --legacy-peer-deps. It installs anyway, but the package may not work.',
      ],
      example: `# See which versions of the package exist
npm view some-chart-lib versions

# Install the newest version
npm install some-chart-lib@latest`,
      lines: [
        { from: 1, to: 1, plain: 'npm stopped with the error code ERESOLVE.' },
        { from: 2, to: 2, plain: 'It could not find package versions that fit together.' },
        { from: 3, to: 3, plain: 'This happened while adding some-chart-lib, version 2.1.0.' },
        { from: 4, to: 4, plain: 'Your project has React 19.' },
        { from: 5, to: 5, plain: 'One package that is needed does not fit:' },
        { from: 6, to: 6, plain: 'some-chart-lib wants React 17, which you must install yourself.' },
      ],
      words: [
        {
          word: 'dependency',
          meaning: 'A package that your project needs in order to work.',
          sentence: 'npm ERR! Could not resolve dependency:',
          topic: 'Node and npm',
        },
        {
          word: 'peer dependency',
          meaning: 'A package that another package needs, which you must install yourself in a version that fits.',
          sentence: 'npm ERR! peer react@"^17.0.0" from some-chart-lib@2.1.0',
          topic: 'Node and npm',
        },
        {
          word: 'resolve',
          meaning: 'To find versions of all your packages that work together.',
          sentence: 'npm ERR! ERESOLVE could not resolve',
          topic: 'Node and npm',
        },
        {
          word: 'caret (^)',
          meaning: 'A sign before a version that means "this version, or a newer one with the same first number".',
          sentence: 'npm ERR! peer react@"^17.0.0" from some-chart-lib@2.1.0',
          topic: 'Node and npm',
        },
      ],
    },
  },
  {
    id: 'cors-docs',
    label: 'A docs paragraph',
    text: 'Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
    result: {
      kind: 'docs',
      explanation:
        'CORS is a set of rules that browsers follow. A web page from one site can ask another site for data. The browser only lets the page use that data if the other site says yes, with special HTTP headers.',
      why: 'Without CORS, any page you open could read your data from other sites where you are logged in. So browsers block these requests unless the server allows them on purpose.',
      steps: [],
      example: `// Your page runs on http://localhost:5173
fetch('https://api.example.com/data')

// The API must answer with this header,
// or the browser blocks the answer:
Access-Control-Allow-Origin: http://localhost:5173`,
      lines: [
        {
          from: 1,
          to: 1,
          plain: 'CORS lets a server tell the browser which other websites may load its files.',
        },
      ],
      words: [
        {
          word: 'origin',
          meaning: 'The start of a web address: the scheme, the domain and the port, like https://example.com.',
          sentence:
            'Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
          topic: 'Web and HTTP',
        },
        {
          word: 'HTTP header',
          meaning: 'Extra information sent with a request or an answer, as a name and a value.',
          sentence:
            'Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
          topic: 'Web and HTTP',
        },
        {
          word: 'resource',
          meaning: 'Something a page loads from a server, like data, an image or a script.',
          sentence:
            'Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
          topic: 'Web and HTTP',
        },
        {
          word: 'mechanism',
          meaning: 'The way something works: a system of parts or steps.',
          sentence:
            'Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
          topic: 'General',
        },
        {
          word: 'permit',
          meaning: 'To allow something.',
          sentence:
            'Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
          topic: 'General',
        },
      ],
    },
  },
]
