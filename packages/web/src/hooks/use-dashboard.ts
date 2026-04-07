import { useState, useEffect, useCallback } from 'react'
import type { DealerInfo, Unit, Lead } from '@/types'
import { dashboard } from '@/lib/api'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardDealer(enabled = true): AsyncState<{ dealer: DealerInfo | null }> {
  const [state, setState] = useState<Omit<AsyncState<{ dealer: DealerInfo | null }>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }

    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))

    dashboard.getDealer()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })

    return () => { cancelled = true }
  }, [tick, enabled])

  return { ...state, refetch }
}

export function useDashboardInventory(): AsyncState<Unit[]> {
  const [state, setState] = useState<Omit<AsyncState<Unit[]>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))

    dashboard.getInventory()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })

    return () => { cancelled = true }
  }, [tick])

  return { ...state, refetch }
}

export function useDashboardLeads(status?: string): AsyncState<{ leads: Lead[] }> {
  const [state, setState] = useState<Omit<AsyncState<{ leads: Lead[] }>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))

    dashboard.getLeads(status)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })

    return () => { cancelled = true }
  }, [tick, status])

  return { ...state, refetch }
}
