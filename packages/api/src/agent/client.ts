import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

type BedrockAuth = {
  region: string
  bearerToken: string
}

export function createBedrockClient(auth: BedrockAuth): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    region: auth.region,
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: auth.bearerToken,
    },
  })
}

export type ClaudeMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ClaudeCallArgs = {
  client: BedrockRuntimeClient
  model: string
  systemPrompt: string
  messages: ClaudeMessage[]
  maxTokens?: number
}

export async function callClaude(args: ClaudeCallArgs): Promise<string> {
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: args.maxTokens ?? 1024,
    system: [
      {
        type: 'text',
        text: args.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const cmd = new InvokeModelCommand({
    modelId: args.model,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  })

  const res = await args.client.send(cmd)
  const decoded = new TextDecoder().decode(res.body as Uint8Array)
  const parsed = JSON.parse(decoded) as {
    content: Array<{ type: string; text?: string }>
  }
  const text = parsed.content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text!)
    .join('')
  return text
}
