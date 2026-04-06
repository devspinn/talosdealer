import type { DealerInfo, Unit } from '@/types'

const API_BASE = '/api'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

/** Fetch all dealers (for directory page). */
export async function fetchDealers(): Promise<DealerInfo[]> {
  return fetchJson(`${API_BASE}/dealers`)
}

/** Fetch a single dealer by slug. */
export async function fetchDealer(slug: string): Promise<DealerInfo> {
  return fetchJson(`${API_BASE}/dealers/${slug}`)
}

/** Fetch all inventory for a dealer. */
export async function fetchInventory(slug: string): Promise<Unit[]> {
  return fetchJson(`${API_BASE}/dealers/${slug}/inventory`)
}
