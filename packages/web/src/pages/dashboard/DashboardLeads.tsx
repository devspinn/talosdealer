import { useState } from 'react'
import { useDashboardLeads } from '@/hooks/use-dashboard'
import { dashboard } from '@/lib/api'
import { MessageSquare, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types'

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'closed', label: 'Closed' },
]

const FILTER_TABS = [
  { value: undefined, label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
] as const

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function DashboardLeads() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data, loading, refetch } = useDashboardLeads(filter)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const leads = data?.leads ?? []

  async function handleStatusChange(lead: Lead, newStatus: string) {
    try {
      await dashboard.updateLead(lead.id, { status: newStatus })
      refetch()
    } catch {
      // Silently fail — the UI will still show the old status
    }
  }

  async function handleExportAdf(leadId: string) {
    const res = await fetch(`${API_BASE}/dashboard/leads/${leadId}/adf`, {
      credentials: 'include',
    })
    if (!res.ok) return
    const xml = await res.text()
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lead-${leadId}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No leads yet</h3>
          <p className="text-gray-500 text-sm">
            Share your dealership website to start receiving inquiries.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const isExpanded = expandedId === lead.id
                const unitLabel = lead.unitYear || lead.unitMake
                  ? [lead.unitYear, lead.unitMake, lead.unitModel].filter(Boolean).join(' ')
                  : null

                return (
                  <tr key={lead.id} className="group">
                    <td colSpan={7} className="p-0">
                      <div
                        className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_auto_auto_auto] lg:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      >
                        <div className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                        <div className="px-4 py-3 font-medium text-gray-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="px-4 py-3 text-gray-600 hidden sm:block truncate">
                          {lead.email}
                        </div>
                        <div className="px-4 py-3 text-gray-600 hidden md:block">
                          {lead.phone || '-'}
                        </div>
                        <div className="px-4 py-3 text-gray-600 hidden lg:block truncate max-w-[200px]">
                          {unitLabel || '-'}
                        </div>
                        <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer',
                              STATUS_COLORS[lead.status]
                            )}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleExportAdf(lead.id)}
                            className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                            title="Export ADF XML"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Email:</span>{' '}
                              <a href={`mailto:${lead.email}`} className="text-accent hover:text-amber-600 font-medium">
                                {lead.email}
                              </a>
                            </div>
                            {lead.phone && (
                              <div>
                                <span className="text-gray-500">Phone:</span>{' '}
                                <a href={`tel:${lead.phone}`} className="text-accent hover:text-amber-600 font-medium">
                                  {lead.phone}
                                </a>
                              </div>
                            )}
                            {lead.interest && (
                              <div>
                                <span className="text-gray-500">Interest:</span>{' '}
                                <span className="text-gray-900">{lead.interest}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Source:</span>{' '}
                              <span className="text-gray-900">{lead.source === 'unit_inquiry' ? 'Unit Inquiry' : 'Contact Form'}</span>
                            </div>
                            {unitLabel && (
                              <div className="sm:col-span-2">
                                <span className="text-gray-500">Unit:</span>{' '}
                                <span className="text-gray-900">{unitLabel}</span>
                              </div>
                            )}
                          </div>
                          {lead.message && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm text-gray-700">
                              {lead.message}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
