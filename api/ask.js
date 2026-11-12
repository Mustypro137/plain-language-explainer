import { askFollowUp } from './_lib/aiProvider.js'
import { handleAsk } from './_lib/handleAsk.js'

const json = (status, body) => Response.json(body, { status })

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json(405, { error: 'method' })
    const body = await request.json().catch(() => undefined)
    const result = await handleAsk(body, askFollowUp)
    return json(result.status, result.body)
  },
}
