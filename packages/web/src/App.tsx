import { useMemo, useEffect } from 'react'
import { Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import DashboardLayout from '@/components/DashboardLayout'
import Home from '@/pages/Home'
import Inventory from '@/pages/Inventory'
import UnitDetail from '@/pages/UnitDetail'
import Contact from '@/pages/Contact'
import Financing from '@/pages/Financing'
import About from '@/pages/About'
import Service from '@/pages/Service'
import Parts from '@/pages/Parts'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import DealerDirectory from '@/pages/DealerDirectory'
import Marketing from '@/pages/Marketing'
import DashboardOverview from '@/pages/dashboard/DashboardOverview'
import DashboardSettings from '@/pages/dashboard/DashboardSettings'
import DashboardInventory from '@/pages/dashboard/DashboardInventory'
import DashboardInventoryNew from '@/pages/dashboard/DashboardInventoryNew'
import DashboardInventoryEdit from '@/pages/dashboard/DashboardInventoryEdit'
import DashboardLeads from '@/pages/dashboard/DashboardLeads'
import { DealerBasePathProvider } from '@/DealerContext'
import { useDealerSite } from '@/hooks/use-api'
import type { UnitType } from '@/types'

const TYPE_LABELS: Record<UnitType, string> = {
  boat: 'Boats',
  motorcycle: 'Motorcycles',
  atv: 'ATVs',
  utv: 'Side x Sides',
  snowmobile: 'Snowmobiles',
  pwc: 'Personal Watercraft',
  trailer: 'Trailers',
  other: 'Other',
}

function DealerSite() {
  const { slug } = useParams<{ slug: string }>()
  const { data, loading, error } = useDealerSite(slug)

  const unitTypes = useMemo(() => {
    if (!data?.units) return []
    const counts = new Map<UnitType, number>()
    for (const u of data.units) counts.set(u.type, (counts.get(u.type) || 0) + 1)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, label: TYPE_LABELS[type], count }))
  }, [data?.units])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col animate-pulse">
        {/* Header skeleton */}
        <div className="sticky top-0 z-50 bg-primary shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="h-8 w-40 bg-white/10 rounded" />
              <div className="hidden md:flex items-center gap-8">
                <div className="h-4 w-14 bg-white/10 rounded" />
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-4 w-16 bg-white/10 rounded" />
              </div>
              <div className="hidden sm:block h-9 w-36 bg-white/10 rounded-lg" />
            </div>
          </div>
        </div>
        {/* Hero skeleton */}
        <div className="bg-gray-200 h-72 sm:h-96" />
        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-72" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <Navigate to="/" replace />
  }

  const { dealer, units } = data
  const basePath = `/${slug}`

  return (
    <DealerBasePathProvider basePath={basePath}>
      <Layout dealer={dealer} unitTypes={unitTypes}>
        <Routes>
          <Route path="/" element={<Home dealer={dealer} units={units} />} />
          <Route path="/inventory" element={<Inventory units={units} dealer={dealer} />} />
          <Route
            path="/inventory/:id"
            element={<UnitDetail units={units} dealer={dealer} />}
          />
          <Route path="/contact" element={<Contact dealer={dealer} />} />
          <Route path="/financing" element={<Financing dealer={dealer} />} />
          <Route path="/about" element={<About dealer={dealer} units={units} />} />
          <Route path="/service" element={<Service dealer={dealer} units={units} />} />
          <Route path="/parts" element={<Parts dealer={dealer} units={units} />} />
        </Routes>
      </Layout>
    </DealerBasePathProvider>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Marketing />} />
      <Route path="/demos" element={<DealerDirectory />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="leads" element={<DashboardLeads />} />
        <Route path="settings" element={<DashboardSettings />} />
        <Route path="inventory" element={<DashboardInventory />} />
        <Route path="inventory/new" element={<DashboardInventoryNew />} />
        <Route path="inventory/:id/edit" element={<DashboardInventoryEdit />} />
      </Route>
      <Route path="/:slug/*" element={<DealerSite />} />
    </Routes>
    </>
  )
}

export default App
