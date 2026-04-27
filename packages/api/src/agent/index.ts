import type { Database, Dealer } from '@talosdealer/db'
import { callClaude, createBedrockClient, type ClaudeMessage } from './client'
import {
  buildSystemPrompt,
  fetchInventorySummary,
  pickDomain,
  resolveAgentName,
  type PageContext,
} from './context'

export type RunAgentArgs = {
  db: Database
  dealer: Dealer
  messages: ClaudeMessage[]
  pageContext?: PageContext
  env: {
    AWS_BEARER_TOKEN_BEDROCK: string
    AWS_REGION?: string
    ANTHROPIC_SMALL_FAST_MODEL?: string
  }
}

export type RunAgentResult = {
  text: string
  agentName: string
}

export async function runAgent(args: RunAgentArgs): Promise<RunAgentResult> {
  const { db, dealer, messages, pageContext, env } = args

  const inventorySummary = await fetchInventorySummary(db, dealer.id)
  const domain = pickDomain(inventorySummary)
  const agentName = resolveAgentName(dealer, domain)

  const systemPrompt = buildSystemPrompt({
    dealer,
    inventorySummary,
    pageContext,
    agentName,
  })

  const client = createBedrockClient({
    region: env.AWS_REGION ?? 'us-east-1',
    bearerToken: env.AWS_BEARER_TOKEN_BEDROCK,
  })

  const text = await callClaude({
    client,
    model: env.ANTHROPIC_SMALL_FAST_MODEL ?? 'us.anthropic.claude-sonnet-4-6',
    systemPrompt,
    messages,
    maxTokens: 1024,
  })

  return { text, agentName }
}
