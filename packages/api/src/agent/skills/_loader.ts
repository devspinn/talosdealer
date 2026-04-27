import { inventorySearch } from './inventory-search'
import { dealerVoice } from './dealer-voice'

export type SkillDomain = 'powersports' | 'marine'

export type Skill = {
  name: string
  description: string
  whenToUse: string[]
  domains: SkillDomain[]
  priority: 'low' | 'medium' | 'high'
  body: string
}

// Skills are TS files (not .md) so the same module format works in both
// Node (tsx) dev and Cloudflare Workers (esbuild) prod — no loader config needed.
// The markdown bodies are still human-editable template strings; Jay can edit them
// without touching TypeScript logic.
const ALL_SKILLS: Skill[] = [inventorySearch, dealerVoice]

export function loadSkills(filter?: { domain?: SkillDomain }): Skill[] {
  if (!filter?.domain) return ALL_SKILLS
  return ALL_SKILLS.filter((s) => s.domains.includes(filter.domain!))
}
