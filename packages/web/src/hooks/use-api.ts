import { useState, useEffect } from 'react'
import type { DealerInfo, Unit } from '@/types'
import { fetchDealers, fetchDealer, fetchInventory } from '@/lib/api'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/** Fetch the list of all dealers. */
export function useDealers(): AsyncState<DealerInfo[]> {
  const [state, setState] = useState<AsyncState<DealerInfo[]>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetchDealers()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/** Fetch dealer info + full inventory for a given slug. */
export function useDealerSite(
  slug: string | undefined
): AsyncState<{ dealer: DealerInfo; units: Unit[] }> {
  const [state, setState] = useState<AsyncState<{ dealer: DealerInfo; units: Unit[] }>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!slug) {
      setState({ data: null, loading: false, error: 'No slug provided' })
      return
    }

    let cancelled = false
    setState({ data: null, loading: true, error: null })

    Promise.all([fetchDealer(slug), fetchInventory(slug)])
      .then(([dealer, units]) => {
        if (!cancelled) setState({ data: { dealer, units }, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}
