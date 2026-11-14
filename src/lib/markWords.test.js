import { markWords, wordsIn } from './markWords.js'

const w = (word) => ({ word, meaning: `${word} means`, sentence: 's' })
const marked = (pieces) => pieces.filter((p) => p.word).map((p) => [p.text, p.word.word])

test('marks each hard word in the text, ignoring letter case', () => {
  const pieces = markWords("TypeError: cannot read 'map' of Undefined", [w('typeerror'), w('map'), w('undefined')])
  expect(marked(pieces)).toEqual([
    ['TypeError', 'typeerror'],
    ['map', 'map'],
    ['Undefined', 'undefined'],
  ])
  expect(pieces.map((p) => p.text).join('')).toBe("TypeError: cannot read 'map' of Undefined")
})

test('marks every place a word appears', () =>
  expect(marked(markWords('a map and a map', [w('map')]))).toEqual([
    ['map', 'map'],
    ['map', 'map'],
  ]))

test('does not mark a word inside a longer word', () =>
  expect(marked(markWords('bitmap mapping map', [w('map')]))).toEqual([['map', 'map']]))

test('prefers the longer of two words that overlap', () =>
  expect(marked(markWords('a peer dependency and a dependency', [w('dependency'), w('peer dependency')]))).toEqual([
    ['peer dependency', 'peer dependency'],
    ['dependency', 'dependency'],
  ]))

test('handles words with signs that mean something in a pattern', () =>
  expect(marked(markWords('use C++ or .map() here', [w('C++'), w('.map()')]))).toEqual([
    ['C++', 'C++'],
    ['.map()', '.map()'],
  ]))

test('a word not found in the text is not marked', () => {
  const pieces = markWords('reading properties', [w('property')])
  expect(pieces).toEqual([{ text: 'reading properties' }])
})

test('no words gives the whole text as one piece', () => expect(markWords('hello', [])).toEqual([{ text: 'hello' }]))

test('wordsIn lists each word found once, in the order met, with the longer match winning', () => {
  const found = wordsIn('Use node.js and C++, then node.js again, in nodejs', [{ word: 'node.js' }, { word: 'c++' }, { word: 'js' }])
  expect(found.map((w) => w.word)).toEqual(['node.js', 'c++'])
})

test('wordsIn finds nothing in a text without the words', () => expect(wordsIn('hello', [{ word: 'map' }])).toEqual([]))
