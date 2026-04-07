import type { DealerInfo, Unit, Lead } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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

/** Submit a lead for a dealer (public, no auth). */
export async function submitLead(slug: string, data: Record<string, unknown>): Promise<{ lead: Lead }> {
  const res = await fetch(`${API_BASE}/dealers/${slug}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

// --- Dashboard (authenticated) API ---

async function fetchAuthed<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

async function mutate<T>(url: string, method: string, body?: unknown): Promise<T> {
  return fetchAuthed(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

export const dashboard = {
  getDealer: () => fetchAuthed<{ dealer: DealerInfo | null }>(`${API_BASE}/dashboard`),
  createDealer: (data: Partial<DealerInfo>) => mutate<{ dealer: DealerInfo }>(`${API_BASE}/dashboard/dealer`, 'POST', data),
  updateDealer: (data: Partial<DealerInfo>) => mutate<{ dealer: DealerInfo }>(`${API_BASE}/dashboard/dealer`, 'PUT', data),
  getInventory: () => fetchAuthed<Unit[]>(`${API_BASE}/dashboard/inventory`),
  addUnit: (data: Record<string, unknown>) => mutate<{ unit: Unit }>(`${API_BASE}/dashboard/inventory`, 'POST', data),
  updateUnit: (id: string, data: Record<string, unknown>) => mutate<{ unit: Unit }>(`${API_BASE}/dashboard/inventory/${id}`, 'PUT', data),
  deleteUnit: (id: string) => mutate<{ success: boolean }>(`${API_BASE}/dashboard/inventory/${id}`, 'DELETE'),
  getLeads: (status?: string) => fetchAuthed<{ leads: Lead[] }>(
    `${API_BASE}/dashboard/leads${status ? `?status=${status}` : ''}`
  ),
  updateLead: (id: string, data: { status: string }) => mutate<{ lead: Lead }>(
    `${API_BASE}/dashboard/leads/${id}`, 'PUT', data
  ),
}
