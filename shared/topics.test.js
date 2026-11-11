import { TOPICS, normaliseTopic } from './topics.js'

test('the fixed topic list, with General last', () => {
  expect(TOPICS).toEqual(['JavaScript', 'React', 'CSS', 'HTML', 'Node and npm', 'Git', 'Web and HTTP', 'General'])
})

test.each([
  ['React', 'React'],
  ['react', 'React'],
  ['  node AND npm ', 'Node and npm'],
  ['Python', 'General'],
  ['', 'General'],
  [undefined, 'General'],
  [null, 'General'],
  [7, 'General'],
])('%p becomes %p', (input, topic) => expect(normaliseTopic(input)).toBe(topic))
