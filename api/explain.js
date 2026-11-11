import { askAi } from './_lib/aiProvider.js'
import { handleExplain } from './_lib/handleExplain.js'

const json = (status, body) => Response.json(body, { status })

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json(405, { error: 'method' })
    const body = await request.json().catch(() => undefined)
    const result = await handleExplain(body, askAi)
    return json(result.status, result.body)
  },
}
