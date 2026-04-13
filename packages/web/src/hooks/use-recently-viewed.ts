import { useState, useEffect, useCallback } from 'react'

const MAX_ITEMS = 8

function getStorageKey(slug: string) {
  return `roostdealer:recently-viewed:${slug}`
}

export function useRecentlyViewed(slug: string, currentUnitId?: string) {
  const [viewedIds, setViewedIds] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(slug))
      if (stored) setViewedIds(JSON.parse(stored))
    } catch { /* ignore parse errors */ }
  }, [slug])

  // Record a view
  const recordView = useCallback((unitId: string) => {
    setViewedIds(prev => {
      const filtered = prev.filter(id => id !== unitId)
      const next = [unitId, ...filtered].slice(0, MAX_ITEMS)
      try { localStorage.setItem(getStorageKey(slug), JSON.stringify(next)) } catch { /* storage full */ }
      return next
    })
  }, [slug])

  // Auto-record current unit on mount
  useEffect(() => {
    if (currentUnitId) recordView(currentUnitId)
  }, [currentUnitId, recordView])

  // Return IDs excluding current unit, limited to 4
  const recentIds = viewedIds.filter(id => id !== currentUnitId).slice(0, 4)

  return { recentIds }
}
