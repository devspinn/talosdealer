import type { Skill } from './_loader'

export const inventorySearch: Skill = {
  name: 'inventory-search',
  description:
    'How to phrase, narrow, and present inventory results when a customer asks what is in stock or describes a specific unit.',
  whenToUse: [
    'Customer asks "do you have", "what do you have", "show me"',
    'Customer names a specific make/model/year',
    'Customer asks about pricing for a category',
  ],
  domains: ['powersports', 'marine'],
  priority: 'high',
  body: `# Inventory search

## Goal
Answer questions about what is in stock, accurately, using only inventory you know this dealer has.

## How to think about it
1. You have a compact inventory summary in your context (counts by make/type/condition + price range). For Slice A, ALL your inventory knowledge comes from that summary plus any specific units listed. Do not invent units, VINs, or prices.
2. If the customer asks for something you cannot confirm is in stock (from the summary or listed units), say so plainly: "I do not see that on the lot today, but I can have someone reach out if we get one in."
3. When you do present units, keep it short: 2-3 options max. Each: one line of *why this fits the ask*, one headline spec, price.
4. If the customer is vague ("what do you have?"), ask ONE clarifying question to narrow — type, budget, new/used, or use case. Then answer.

## Voice
Like a knowledgeable friend who works at the store. Not a car salesperson. No "great question!" filler.

## Do not
- Fabricate units, stock numbers, VINs, or prices.
- Dump a giant list. Three options, tops.
- Quote monthly payments. Defer payment questions to financing.
- Make availability promises ("we definitely have"). Say "it was in our system as of today."
`,
}
