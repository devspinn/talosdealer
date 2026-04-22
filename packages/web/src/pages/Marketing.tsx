import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { useMetaTags } from '@/hooks/use-meta-tags'
import {
  ArrowRight,
  Clock,
  Search,
  Palette,
  Sparkles,
  Monitor,
  RefreshCw,
  TrendingUp,
  Plug,
  Menu,
  X,
} from 'lucide-react'

const painPoints = [
  {
    icon: Clock,
    title: '24-Hour Inventory Delays',
    description:
      'Most platforms batch-sync once a day. A customer sees a unit that sold yesterday.',
  },
  {
    icon: Search,
    title: 'Invisible on Google',
    description:
      'Thin, duplicate descriptions mean search engines ignore your listings.',
  },
  {
    icon: Palette,
    title: 'One-Size-Fits-None Design',
    description:
      'Your site looks identical to every other dealer on the same platform.',
  },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Descriptions',
    description:
      'Every unit gets a unique, compelling description written by AI. Better descriptions mean better SEO and more engaged buyers.',
    color: 'accent',
  },
  {
    icon: Monitor,
    title: 'Modern, Beautiful Design',
    description:
      'Mobile-first, blazing fast, with your brand front and center — not your platform\'s.',
    color: 'primary',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Inventory Sync',
    description:
      'No more day-old listings. Inventory updates flow through instantly so customers always see what\'s on your lot.',
    color: 'emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'SEO That Works',
    description:
      'Rich, unique content on every page. Proper schema markup, fast load times, and semantic HTML.',
    color: 'violet-500',
  },
  {
    icon: Plug,
    title: 'DMS Integration',
    description:
      'Connect your existing dealer management system. We pull inventory data directly — no manual entry required.',
    color: 'blue-500',
  },
  {
    icon: Palette,
    title: 'Your Brand, Your Way',
    description:
      'Custom colors, logos, hero images, and copy. Each dealer site is unique — not a reskinned template.',
    color: 'pink-500',
  },
]

const featureColorMap: Record<string, { bg: string; text: string }> = {
  accent: { bg: 'bg-accent/10', text: 'text-accent' },
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  'emerald-500': { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  'violet-500': { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  'blue-500': { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  'pink-500': { bg: 'bg-pink-500/10', text: 'text-pink-600' },
}

export default function Marketing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = authClient.useSession()

  useMetaTags({
    title: 'Talos | AI-Powered Dealer Websites for Powersports & Marine',
    description: 'Modern, AI-powered websites for powersports and marine dealers. Replace your legacy DealerSpike site with a faster, smarter platform.',
    ogType: 'website',
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <span className="text-xl font-bold text-white tracking-tight">
              Talos
            </span>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Features
              </a>
              <Link
                to="/demos"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Demos
              </Link>
              {session ? (
                <Link
                  to="/dashboard"
                  className="bg-accent hover:bg-accent-light text-primary font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-accent hover:bg-accent-light text-primary font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10 px-4 pb-4 space-y-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-white/80 hover:text-white"
            >
              Features
            </a>
            <Link
              to="/demos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-white/80 hover:text-white"
            >
              Demos
            </Link>
            {session ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-accent hover:bg-accent-light text-primary font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-white/80 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-accent hover:bg-accent-light text-primary font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary to-[#162d4a] py-20 sm:py-28 lg:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-wider">
            AI-Powered Dealer Websites
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Your Dealership Deserves a Website That Actually{' '}
            <span className="text-accent">Sells</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Beautiful, modern inventory websites for powersports and marine
            dealers. AI-enhanced descriptions, real-time inventory sync, and SEO
            that actually works.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/demos"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              See Demo Sites
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg border border-white/20 backdrop-blur-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
                The Problem
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Legacy Dealer Websites Are Costing You Customers
              </h2>
              <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Your website is the first impression most customers get. If it
                  looks like it was built in 2010, loads slowly, and has thin,
                  copy-paste descriptions — buyers leave.
                </p>
                <p>
                  Most dealer website platforms haven't kept up. They batch-sync
                  inventory once a day, produce cookie-cutter designs, and
                  generate zero organic traffic. You deserve better.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {painPoints.map((point) => (
                <div
                  key={point.title}
                  className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 shrink-0">
                    <point.icon className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{point.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything Your Dealership Needs
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              A modern platform built from scratch for powersports and marine
              dealers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const colors = featureColorMap[feature.color]
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
                >
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-xl ${colors.bg} mb-5`}
                  >
                    <feature.icon className={`h-7 w-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
            See It In Action
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Don't Take Our Word For It
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            We've rebuilt real dealer websites using Talos. Browse live
            demos from powersports and marine dealers to see the difference.
          </p>
          <div className="mt-8">
            <Link
              to="/demos"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Browse Demo Sites
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Replace Your Dealer Website?
          </h2>
          <p className="mt-4 text-white/70 text-lg max-w-2xl mx-auto">
            Join the dealers making the switch to AI-powered, modern websites.
            Get set up in days, not months.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/demos"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg border border-white/20 transition-colors"
            >
              See Demos
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-semibold text-accent">Talos</span>.
              All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/demos"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Demos
              </Link>
              <Link
                to={session ? '/dashboard' : '/login'}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {session ? 'Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
