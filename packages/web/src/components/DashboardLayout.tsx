import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { LayoutDashboard, Package, MessageSquare, Settings, ExternalLink, LogOut, Anchor } from 'lucide-react'
import { useDashboardDealer } from '@/hooks/use-dashboard'
import { useEffect } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/leads', icon: MessageSquare, label: 'Leads' },
  { to: '/dashboard/inventory', icon: Package, label: 'Inventory' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const location = useLocation()

  // Only fetch dealer data once we know the user is authenticated
  const isAuthenticated = !isPending && !!session
  const { data: dealerData } = useDashboardDealer(isAuthenticated)

  useEffect(() => {
    if (!isPending && !session) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
    }
  }, [isPending, session, navigate, location.pathname])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  const dealerSlug = dealerData?.dealer?.slug

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
            <Anchor className="w-6 h-6" />
            Talos
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => {
            const active = end
              ? location.pathname === to
              : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}

          {dealerSlug && (
            <>
              <div className="border-t border-gray-100 my-3" />
              <a
                href={`/${dealerSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Site
              </a>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-sm text-gray-600 mb-2 truncate">{session.user.name}</div>
          <button
            onClick={async () => {
              await authClient.signOut()
              navigate('/login')
            }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
