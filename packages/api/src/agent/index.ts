import type { Database, Dealer } from '@talosdealer/db'
import {
  createBedrockClient,
  streamClaude,
  type ClaudeMessage,
  type ContentBlock,
} from './client'
import {
  buildSystemPrompt,
  fetchInventorySummary,
  pickDomain,
  resolveAgentName,
  type PageContext,
} from './context'
import { findTool, toolDefinitionsForClaude, type AgentContext } from './tools'

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_start'; id: string; name: string }
  | { type: 'tool_end'; id: string; name: string; ok: boolean; summary?: string }
  | { type: 'agent_name'; name: string }
  | { type: 'lead_captured'; leadId: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type RunAgentArgs = {
  db: Database
  dealer: Dealer
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  pageContext?: PageContext
  env: {
    AWS_BEARER_TOKEN_BEDROCK: string
    AWS_REGION?: string
    ANTHROPIC_SMALL_FAST_MODEL?: string
  }
}

const MAX_TOOL_TURNS = 6

/**
 * Run a single agent turn, streaming events as the model works.
 * Handles the tool-use loop: model calls tool, we run it, feed result back, repeat until end_turn.
 */
export async function* runAgent(args: RunAgentArgs): AsyncGenerator<AgentEvent> {
  const { db, dealer, messages: userMessages, pageContext, env } = args

  if (!env.AWS_BEARER_TOKEN_BEDROCK) {
    yield { type: 'error', message: 'Chat not configured: missing AWS_BEARER_TOKEN_BEDROCK' }
    return
  }

  const inventorySummary = await fetchInventorySummary(db, dealer.id)
  const domain = pickDomain(inventorySummary)
  const agentName = resolveAgentName(dealer, domain)
  yield { type: 'agent_name', name: agentName }

  const systemPrompt = buildSystemPrompt({
    dealer,
    inventorySummary,
    pageContext,
    agentName,
    domain,
  })

  const client = createBedrockClient({
    region: env.AWS_REGION ?? 'us-east-1',
    bearerToken: env.AWS_BEARER_TOKEN_BEDROCK,
  })
  const model = env.ANTHROPIC_SMALL_FAST_MODEL ?? 'us.anthropic.claude-sonnet-4-6'

  const toolCtx: AgentContext = {
    db,
    dealer,
    transcript: userMessages.map((m) => ({ role: m.role, content: m.content })),
    page: pageContext,
  }

  // Build message array. User-sent messages are plain strings; we'll append structured
  // assistant turns (with tool_use) and synthetic user turns (with tool_result) as we loop.
  const messages: ClaudeMessage[] = userMessages.map((m) => ({ role: m.role, content: m.content }))

  // Track whether we've already streamed any text in a prior turn. Claude typically
  // emits a short preamble ("Let me pull that up…"), does a tool call, then starts a
  // new text block with the final answer — with no separator between them. We inject
  // a paragraph break when the second text block starts so the UI doesn't run the
  // two sentences together ("for you!Honest answer…").
  let hasEmittedTextEver = false
  let turnHasEmittedText = false

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    let stopReason: string | null = null
    let assistantContent: ContentBlock[] = []
    turnHasEmittedText = false

    try {
      for await (const evt of streamClaude({
        client,
        model,
        systemCached: systemPrompt.cached,
        systemVolatile: systemPrompt.volatile,
        messages,
        tools: toolDefinitionsForClaude(),
        maxTokens: 1024,
      })) {
        if (evt.type === 'text_delta') {
          if (!turnHasEmittedText && hasEmittedTextEver) {
            yield { type: 'text', delta: '\n\n' }
          }
          turnHasEmittedText = true
          hasEmittedTextEver = true
          yield { type: 'text', delta: evt.text }
        } else if (evt.type === 'tool_use_start') {
          yield { type: 'tool_start', id: evt.id, name: evt.name }
        } else if (evt.type === 'tool_use_complete') {
          // emitted in loop below after we actually run it
        } else if (evt.type === 'message_stop') {
          stopReason = evt.stopReason
          assistantContent = evt.assistantContent
          const u = evt.usage
          console.log(
            `[chat] dealer=${dealer.slug} turn=${turn} in=${u.inputTokens ?? '?'} out=${u.outputTokens ?? '?'} cache_create=${u.cacheCreationInputTokens ?? 0} cache_read=${u.cacheReadInputTokens ?? 0}`,
          )
        } else if (evt.type === 'error') {
          yield { type: 'error', message: evt.message }
          return
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bedrock stream failed'
      yield { type: 'error', message: msg }
      return
    }

    // Append the assistant turn (with any tool_use blocks) to the running conversation.
    messages.push({ role: 'assistant', content: assistantContent })

    if (stopReason !== 'tool_use') {
      yield { type: 'done' }
      return
    }

    // Run each tool_use block and prepare tool_result blocks as a user message.
    const toolResults: ContentBlock[] = []
    for (const block of assistantContent) {
      if (block.type !== 'tool_use') continue
      const spec = findTool(block.name)
      if (!spec) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify({ error: `Unknown tool: ${block.name}` }),
          is_error: true,
        })
        yield { type: 'tool_end', id: block.id, name: block.name, ok: false, summary: 'unknown tool' }
        continue
      }
      try {
        const result = await spec.handler(block.input, toolCtx)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
        yield {
          type: 'tool_end',
          id: block.id,
          name: block.name,
          ok: true,
          summary: summarize(block.name, result),
        }
        // Lead capture side-effect: tell the client so it can render a confirmation card.
        if (
          block.name === 'submit_lead' &&
          result &&
          typeof result === 'object' &&
          (result as { ok?: boolean }).ok === true &&
          typeof (result as { leadId?: string }).leadId === 'string'
        ) {
          yield { type: 'lead_captured', leadId: (result as { leadId: string }).leadId }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tool error'
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify({ error: msg }),
          is_error: true,
        })
        yield { type: 'tool_end', id: block.id, name: block.name, ok: false, summary: msg }
      }
    }

    messages.push({ role: 'user', content: toolResults })
    // Loop continues — model will synthesize a response using tool results.
  }

  // Hit the tool-turn cap without a natural end. Tell the client and stop.
  yield { type: 'error', message: 'Agent exceeded tool-use loop limit' }
}

function summarize(toolName: string, result: unknown): string | undefined {
  if (!result || typeof result !== 'object') return undefined
  const r = result as Record<string, unknown>
  // For most tools, the user doesn't need a row count or a name echoed back —
  // the tool name + done state is enough signal. We only surface a summary when
  // it adds real information (a lead saved confirmation or a tool error).
  if (toolName === 'submit_lead') {
    if (r.ok === true) return 'saved'
    if (r.ok === false && typeof r.error === 'string') return String(r.error)
  }
  return undefined
}
