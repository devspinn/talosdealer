import type { EnrichedData } from '@/types'
import mountainMarine from './sample.json'
import sarasotaPowersports from './sarasota-powersports.json'
import portsideMarine from './portside-marine.json'
import tomsRiverMarine from './toms-river-marine.json'

export const dealers: Record<string, EnrichedData> = {
  'mountain-marine': mountainMarine as unknown as EnrichedData,
  'sarasota-powersports': sarasotaPowersports as unknown as EnrichedData,
  'portside-marine': portsideMarine as unknown as EnrichedData,
  'toms-river-marine': tomsRiverMarine as unknown as EnrichedData,
}

export const dealerList = Object.values(dealers).map((d) => d.dealer)
