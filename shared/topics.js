// The topics a hard word can belong to. Used by the server (to check the AI's answer)
// and by the app (to show and filter saved words), so both always agree.
export const TOPICS = ['JavaScript', 'React', 'CSS', 'HTML', 'Node and npm', 'Git', 'Web and HTTP', 'General']

const BY_KEY = new Map(TOPICS.map((t) => [t.toLowerCase(), t]))

export function normaliseTopic(topic) {
  return (typeof topic === 'string' && BY_KEY.get(topic.trim().toLowerCase())) || 'General'
}
