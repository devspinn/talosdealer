import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { useMetaTags } from '@/hooks/use-meta-tags'
import {
  ArrowRight,
  Clock,
  Search,
  Smartphone,
  PhoneOff,
  Sparkles,
  PenTool,
  Send,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Zap,
  Menu,
  X,
} from 'lucide-react'

const painPoints = [
  {
    icon: Clock,
    title: '24-Hour Inventory Delays',
    description:
      'Most platforms batch-sync once a day. Customers see units that sold yesterday and walk.',
  },
  {
    icon: Search,
    title: 'Invisible on Google',
    description:
      'Thin, duplicate descriptions mean search engines skip your listings and send buyers to competitors.',
  },
  {
    icon: Smartphone,
    title: 'Broken on Mobile',
    description:
      'Most buyers browse on their phone. Legacy dealer sites weren\'t built for it, and it shows.',
  },
  {
    icon: PhoneOff,
    title: 'Leads Go Cold Fast',
    description:
      'A lead that waits 5 minutes for a reply is 80% less likely to convert. Nights, weekends, holidays — nobody\'s watching.',
  },
]

const howItWorks = [
  {
    icon: TrendingUp,
    title: 'Attract',
    description:
      'Fast, mobile-first pages with unique AI-written content on every unit. Rank higher, pull in more organic traffic, and give buyers a reason to stay.',
  },
  {
    icon: MessageCircle,
    title: 'Engage',
    description:
      'An AI sales concierge answers questions 24/7, grounded in your real inventory. It qualifies intent, captures contact info, and hands warm leads to your team.',
  },
  {
    icon: Send,
    title: 'Close',
    description:
      'Every lead gets intelligent, personalized follow-up until they buy, book, or opt out. No lead forgotten, no night or weekend off.',
  },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI Sales Concierge',
    description:
      'A chat agent on every page, grounded in your live inventory. Answers product questions, qualifies buyers, and captures leads around the clock.',
    color: 'accent',
  },
  {
    icon: Send,
    title: 'AI Lead Follow-Up',
    description:
      'Every lead gets a tailored follow-up sequence until they convert or opt out. No more leads dying in an inbox.',
    color: 'primary',
  },
  {
    icon: PenTool,
    title: 'AI-Written Descriptions',
    description:
      'Every unit gets unique, compelling copy — better for SEO, better for buyers. No more copy-paste listings.',
    color: 'violet-500',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Inventory',
    description:
      'Inventory updates the moment your DMS changes. No 24-hour delays, no ghost listings.',
    color: 'emerald-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast & Mobile-First',
    description:
      'Pages load in under a second on mobile, where your buyers actually shop. Built on modern infrastructure, not 2010 tech.',
    color: 'blue-500',
  },
  {
    icon: TrendingUp,
    title: 'SEO That Actually Works',
    description:
      'Unique content, proper schema, semantic HTML, and speed — everything Google rewards, built in from day one.',
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
    description: 'AI-powered dealer websites that generate leads and an AI sales agent that closes them. Faster, smarter, and always on — unlike legacy platforms like DealerSpike.',
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
            Websites That Generate Leads.{' '}
            <span className="text-accent">AI That Closes Them.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Talos replaces your legacy dealer site with a fast, modern storefront —
            and an AI sales agent that qualifies every visitor, answers questions
            24/7, and follows up with every lead until they buy or opt out.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
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
                Your Website Is Losing Deals You'll Never Know About
              </h2>
              <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Most dealer sites were built a decade ago and haven't evolved.
                  They load slowly on mobile, batch-sync inventory once a day, and
                  produce cookie-cutter descriptions search engines ignore.
                </p>
                <p>
                  Worse, the leads that do come through go into a black hole.
                  Nobody calls them back fast enough. Nobody follows up a week
                  later. Your best salesperson is busy, and your website can't
                  help.
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

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Every Visitor, Worked Like It's Your Last Lead
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Talos runs the full funnel — from search impression to signed
              deal — so no opportunity slips through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, idx) => (
              <div
                key={step.title}
                className="relative bg-gray-50 rounded-2xl p-8"
              >
                <div className="absolute top-6 right-6 text-5xl font-extrabold text-gray-200 leading-none select-none">
                  {idx + 1}
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 mb-5">
                  <step.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
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
              Everything a Modern Dealership Needs
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Built from scratch for powersports and marine dealers who want to
              win.
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

      {/* Final CTA */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Stop Losing Deals to a Website That Can't Sell
          </h2>
          <p className="mt-4 text-white/70 text-lg max-w-2xl mx-auto">
            Join the dealers replacing legacy platforms with an AI-powered site
            that works every lead, every hour. Live in days, not months.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
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
                to={session ? '/dashboard' : '/login'}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {session ? 'Dashboard' : 'Sign In'}
              </Link>
              <Link
                to="/terms"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
