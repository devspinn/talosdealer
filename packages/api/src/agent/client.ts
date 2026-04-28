import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime'

type BedrockAuth = {
  region: string
  bearerToken: string
}

export function createBedrockClient(auth: BedrockAuth): BedrockRuntimeClient {
  // Pass the bearer token explicitly via `token` + force the bearer auth scheme.
  // The AWS_BEARER_TOKEN_BEDROCK env var fallback only works in Node; on
  // Cloudflare Workers the SDK has no env access, so we must wire it ourselves.
  return new BedrockRuntimeClient({
    region: auth.region,
    token: { token: auth.bearerToken },
    authSchemePreference: ['httpBearerAuth'],
  })
}

export type ClaudeRole = 'user' | 'assistant'

// A content block in a user or assistant message.
// - text: plain text
// - tool_use: assistant asking to invoke a tool
// - tool_result: user-role block returning the result to the model
export type TextBlock = { type: 'text'; text: string }
export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
export type ToolResultBlock = {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock

export type ClaudeMessage = {
  role: ClaudeRole
  content: string | ContentBlock[]
}

export type ToolDefinition = {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export type Usage = {
  inputTokens?: number
  outputTokens?: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
}

export type StreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_use_start'; id: string; name: string }
  | { type: 'tool_use_input'; id: string; inputJson: string }
  | { type: 'tool_use_complete'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'message_stop'; stopReason: string | null; assistantContent: ContentBlock[]; usage: Usage }
  | { type: 'error'; message: string }

export type StreamArgs = {
  client: BedrockRuntimeClient
  model: string
  // The cached block is everything that stays identical across calls for this dealer
  // (base scaffold + dealer profile + skills). The volatile block is whatever changes
  // per call (random inventory sample, page context). Splitting them is what makes
  // prompt caching actually hit.
  systemCached: string
  systemVolatile?: string
  messages: ClaudeMessage[]
  tools?: ToolDefinition[]
  maxTokens?: number
}

/**
 * Stream a single Claude turn. Yields events for text deltas, tool use start/input/complete,
 * and a terminal message_stop event with the fully assembled assistant content blocks.
 */
export async function* streamClaude(args: StreamArgs): AsyncGenerator<StreamEvent> {
  const systemBlocks: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: args.systemCached,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (args.systemVolatile && args.systemVolatile.trim()) {
    systemBlocks.push({ type: 'text', text: args.systemVolatile })
  }
  const bodyObj: Record<string, unknown> = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: args.maxTokens ?? 1024,
    system: systemBlocks,
    messages: args.messages,
  }
  if (args.tools && args.tools.length) {
    bodyObj.tools = args.tools
  }

  const cmd = new InvokeModelWithResponseStreamCommand({
    modelId: args.model,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(bodyObj),
  })

  const res = await args.client.send(cmd)
  if (!res.body) {
    yield { type: 'error', message: 'Bedrock returned empty stream' }
    return
  }

  const decoder = new TextDecoder()
  // Assembled state for the current turn.
  const blocks: ContentBlock[] = []
  // Per-index running state for content blocks.
  const textByIndex = new Map<number, string>()
  const toolByIndex = new Map<number, { id: string; name: string; inputJson: string }>()
  let stopReason: string | null = null
  const usage: Usage = {}

  for await (const chunk of res.body) {
    const bytes = chunk.chunk?.bytes
    if (!bytes) continue
    const raw = decoder.decode(bytes)
    let evt: any
    try {
      evt = JSON.parse(raw)
    } catch {
      continue
    }

    switch (evt.type) {
      case 'message_start': {
        const u = evt.message?.usage
        if (u) {
          if (typeof u.input_tokens === 'number') usage.inputTokens = u.input_tokens
          if (typeof u.cache_creation_input_tokens === 'number')
            usage.cacheCreationInputTokens = u.cache_creation_input_tokens
          if (typeof u.cache_read_input_tokens === 'number')
            usage.cacheReadInputTokens = u.cache_read_input_tokens
        }
        break
      }
      case 'content_block_start': {
        const i = evt.index as number
        const cb = evt.content_block
        if (cb?.type === 'text') {
          textByIndex.set(i, '')
        } else if (cb?.type === 'tool_use') {
          toolByIndex.set(i, { id: cb.id, name: cb.name, inputJson: '' })
          yield { type: 'tool_use_start', id: cb.id, name: cb.name }
        }
        break
      }
      case 'content_block_delta': {
        const i = evt.index as number
        const delta = evt.delta
        if (delta?.type === 'text_delta') {
          const cur = textByIndex.get(i) ?? ''
          textByIndex.set(i, cur + (delta.text ?? ''))
          yield { type: 'text_delta', text: delta.text ?? '' }
        } else if (delta?.type === 'input_json_delta') {
          const t = toolByIndex.get(i)
          if (t) {
            t.inputJson += delta.partial_json ?? ''
            yield { type: 'tool_use_input', id: t.id, inputJson: delta.partial_json ?? '' }
          }
        }
        break
      }
      case 'content_block_stop': {
        const i = evt.index as number
        if (textByIndex.has(i)) {
          blocks[i] = { type: 'text', text: textByIndex.get(i)! }
          textByIndex.delete(i)
        } else if (toolByIndex.has(i)) {
          const t = toolByIndex.get(i)!
          let parsed: Record<string, unknown> = {}
          try {
            parsed = t.inputJson ? JSON.parse(t.inputJson) : {}
          } catch {
            parsed = {}
          }
          blocks[i] = { type: 'tool_use', id: t.id, name: t.name, input: parsed }
          toolByIndex.delete(i)
          yield { type: 'tool_use_complete', id: t.id, name: t.name, input: parsed }
        }
        break
      }
      case 'message_delta': {
        if (evt.delta?.stop_reason) stopReason = evt.delta.stop_reason
        if (evt.usage?.output_tokens != null) usage.outputTokens = evt.usage.output_tokens
        break
      }
      case 'message_stop': {
        // Emit in the final event below.
        break
      }
      case 'error': {
        yield { type: 'error', message: evt.error?.message ?? 'Bedrock stream error' }
        return
      }
      default:
        break
    }
  }

  // Collapse any gaps (shouldn't happen, but keep the array dense)
  const finalBlocks = blocks.filter(Boolean)
  yield { type: 'message_stop', stopReason, assistantContent: finalBlocks, usage }
}
