const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type PageContext = {
  path?: string
  unitId?: string
}

export type ChatResponse = {
  message: ChatMessage
  agentName: string
}

export async function sendChat(args: {
  slug: string
  messages: ChatMessage[]
  pageContext?: PageContext
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/dealers/${args.slug}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: args.messages, pageContext: args.pageContext }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Chat error: ${res.status}`)
  }
  return res.json()
}
