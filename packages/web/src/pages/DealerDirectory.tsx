import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, Bike, Anchor, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useDealers } from '@/hooks/use-api'
import { useMetaTags } from '@/hooks/use-meta-tags'

export default function DealerDirectory() {
  useMetaTags({
    title: 'Demo Dealers | Talos',
    description: 'Browse demo dealer websites powered by Talos. See real inventory from powersports and marine dealers.',
  })
  const { data: session } = authClient.useSession()
  const { data: dealerList, loading, error } = useDealers()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-white tracking-tight">
                Talos
              </span>
              <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/20 text-accent uppercase tracking-wider">
                Demos
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {session?.user ? (
                <>
                  <span className="text-sm text-white/80">{session.user.name}</span>
                  <button
                    onClick={() => authClient.signOut()}
                    className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary pb-20 pt-12 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            AI-Native Dealer Websites
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Beautiful, fast inventory sites for powersports and marine dealers.
            Pick a demo dealer below to see what your site could look like.
          </p>
        </div>
      </section>

      {/* Dealer Cards */}
      <section className="-mt-10 pb-20 flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">Failed to load dealers</p>
            </div>
          )}
          {dealerList && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dealerList.map((dealer) => {
              const icon = /marine|boat/i.test(dealer.name) ? (
                <Anchor className="h-8 w-8 text-primary" />
              ) : (
                <Bike className="h-8 w-8 text-primary" />
              )

              return (
                <Link
                  key={dealer.slug}
                  to={`/${dealer.slug}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {dealer.name}
                      </h2>
                      {dealer.city && dealer.state && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {dealer.city}, {dealer.state}
                        </div>
                      )}
                      {dealer.sourceUrl && (
                        <p className="text-sm text-gray-400 mt-2">
                          Scraped from{' '}
                          <span className="text-gray-500">
                            {new URL(dealer.sourceUrl).hostname}
                          </span>
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-accent transition-colors mt-1 shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <span className="font-semibold text-accent">Talos</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
