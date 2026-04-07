import { Link } from 'react-router-dom'
import { useDashboardDealer, useDashboardInventory, useDashboardLeads } from '@/hooks/use-dashboard'
import { Package, MessageSquare, Settings, ExternalLink } from 'lucide-react'
import CreateDealerForm from './CreateDealerForm'

export default function DashboardOverview() {
  const { data: dealerData, loading, refetch } = useDashboardDealer()
  const { data: units } = useDashboardInventory()
  const { data: leadsData } = useDashboardLeads()

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!dealerData?.dealer) {
    return <CreateDealerForm onCreated={refetch} />
  }

  const dealer = dealerData.dealer
  const unitCount = units?.length ?? 0

  const typeCounts: Record<string, number> = {}
  units?.forEach((u) => {
    typeCounts[u.type] = (typeCounts[u.type] || 0) + 1
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dealer.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            roostdealer.com/{dealer.slug}
          </p>
        </div>
        <a
          href={`/${dealer.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:text-primary-light transition-colors"
        >
          View Site <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">New Leads</div>
          <div className="text-3xl font-bold text-gray-900">
            {leadsData?.leads?.filter((l) => l.status === 'new').length ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">Total Units</div>
          <div className="text-3xl font-bold text-gray-900">{unitCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">New</div>
          <div className="text-3xl font-bold text-gray-900">
            {units?.filter((u) => u.condition === 'new').length ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm text-gray-500 mb-1">Used</div>
          <div className="text-3xl font-bold text-gray-900">
            {units?.filter((u) => u.condition === 'used').length ?? 0}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/dashboard/leads"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">View Leads</div>
            <div className="text-sm text-gray-500">{leadsData?.leads?.length ?? 0} total leads</div>
          </div>
        </Link>
        <Link
          to="/dashboard/inventory"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Manage Inventory</div>
            <div className="text-sm text-gray-500">{unitCount} units listed</div>
          </div>
        </Link>
        <Link
          to="/dashboard/settings"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Dealer Settings</div>
            <div className="text-sm text-gray-500">Update contact info & branding</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
