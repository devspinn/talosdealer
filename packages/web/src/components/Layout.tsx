import { Link, useLocation } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock, Menu, X, Anchor, ChevronDown, CheckCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useDealerPath } from '@/DealerContext'
import { subscribeNewsletter } from '@/lib/api'
import type { DealerInfo, UnitType } from '@/types'

interface UnitTypeSummary {
  type: UnitType
  label: string
  count: number
}

interface LayoutProps {
  dealer: DealerInfo
  unitTypes?: UnitTypeSummary[]
  children: React.ReactNode
}

function DesktopDropdown({
  label,
  items,
  isActive,
}: {
  label: string
  items: Array<{ to: string; label: string; divider?: boolean }>
  isActive: boolean
}) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)

  function handleEnter() {
    clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={cn(
          'flex items-center gap-1 text-sm font-medium transition-colors hover:text-accent',
          isActive ? 'text-accent' : 'text-white/90',
        )}
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="border-t border-gray-100 my-1.5" />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout({ dealer, unitTypes = [], children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileInventoryOpen, setMobileInventoryOpen] = useState(false)
  const [mobileDealershipOpen, setMobileDealershipOpen] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [newsletterError, setNewsletterError] = useState('')
  const location = useLocation()
  const dp = useDealerPath()

  const inventoryItems: Array<{ to: string; label: string; divider?: boolean }> = [
    { to: dp('/inventory'), label: 'All Inventory' },
    { to: dp('/inventory?condition=new'), label: 'New Inventory' },
    { to: dp('/inventory?condition=used'), label: 'Pre-Owned Inventory' },
  ]

  if (unitTypes.length > 0) {
    inventoryItems.push({ to: '', label: '', divider: true })
    for (const ut of unitTypes) {
      inventoryItems.push({
        to: dp(`/inventory?type=${ut.type}`),
        label: `${ut.label} (${ut.count})`,
      })
    }
  }

  const dealershipItems = [
    { to: dp('/about'), label: 'About Us' },
    { to: dp('/financing'), label: 'Financing' },
    { to: dp('/service'), label: 'Service' },
    { to: dp('/parts'), label: 'Parts' },
    { to: dp('/contact'), label: 'Contact Us' },
  ]

  const isInventoryActive = location.pathname.includes('/inventory')
  const isDealershipActive =
    location.pathname.includes('/about') ||
    location.pathname.includes('/financing') ||
    location.pathname.includes('/service') ||
    location.pathname.includes('/parts') ||
    location.pathname.includes('/contact')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo / Dealer Name */}
            <Link to={dp('/')} className="flex items-center gap-2 text-white">
              {dealer.logo ? (
                <img
                  src={dealer.logo}
                  alt={dealer.name}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              ) : (
                <>
                  <Anchor className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
                  <span className="text-lg sm:text-xl font-bold tracking-tight">
                    {dealer.name}
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to={dp('/')}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-accent',
                  location.pathname === dp('/') || location.pathname === dp('/') + '/'
                    ? 'text-accent'
                    : 'text-white/90',
                )}
              >
                Home
              </Link>
              <DesktopDropdown
                label="Inventory"
                items={inventoryItems}
                isActive={isInventoryActive}
              />
              <DesktopDropdown
                label="Dealership"
                items={dealershipItems}
                isActive={isDealershipActive}
              />
            </nav>

            {/* Phone CTA */}
            {dealer.phone && (
              <a
                href={`tel:${dealer.phone}`}
                className="hidden sm:flex items-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-5 py-2.5 rounded-lg transition-colors text-base"
              >
                <Phone className="h-4 w-4" />
                {dealer.phone}
              </a>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-primary-light border-t border-white/10">
            <div className="px-4 py-3 space-y-1">
              <Link
                to={dp('/')}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === dp('/') || location.pathname === dp('/') + '/'
                    ? 'bg-white/10 text-accent'
                    : 'text-white/90 hover:bg-white/5',
                )}
              >
                Home
              </Link>

              {/* Mobile Inventory Accordion */}
              <div>
                <button
                  onClick={() => setMobileInventoryOpen(!mobileInventoryOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isInventoryActive
                      ? 'bg-white/10 text-accent'
                      : 'text-white/90 hover:bg-white/5',
                  )}
                >
                  Inventory
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      mobileInventoryOpen && 'rotate-180',
                    )}
                  />
                </button>
                {mobileInventoryOpen && (
                  <div className="pl-4 mt-1 space-y-1">
                    {inventoryItems
                      .filter((item) => !item.divider)
                      .map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              {/* Mobile Dealership Accordion */}
              <div>
                <button
                  onClick={() => setMobileDealershipOpen(!mobileDealershipOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isDealershipActive
                      ? 'bg-white/10 text-accent'
                      : 'text-white/90 hover:bg-white/5',
                  )}
                >
                  Dealership
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      mobileDealershipOpen && 'rotate-180',
                    )}
                  />
                </button>
                {mobileDealershipOpen && (
                  <div className="pl-4 mt-1 space-y-1">
                    {dealershipItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {dealer.phone && (
                <a
                  href={`tel:${dealer.phone}`}
                  className="flex items-center gap-2 px-3 py-2 text-accent text-sm font-medium"
                >
                  <Phone className="h-4 w-4" />
                  {dealer.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Newsletter Signup Bar */}
      <section className="bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary font-bold text-sm sm:text-base">
            Get Inventory Updates &amp; Exclusive Deals
          </p>
          {newsletterStatus === 'success' ? (
            <p className="text-primary font-medium text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> You're subscribed!
            </p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setNewsletterStatus('loading')
                setNewsletterError('')
                try {
                  await subscribeNewsletter(dealer.slug, newsletterEmail)
                  setNewsletterStatus('success')
                } catch (err: any) {
                  setNewsletterError(err.message || 'Something went wrong.')
                  setNewsletterStatus('error')
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-4 py-2 rounded-lg text-sm border-0 focus:ring-2 focus:ring-primary/50 w-64"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {newsletterStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}
          {newsletterStatus === 'error' && (
            <p className="text-red-800 text-xs">{newsletterError}</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Dealer info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Anchor className="h-6 w-6 text-accent" />
                <h3 className="text-white text-lg font-bold">{dealer.name}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your trusted dealer for sales and service
                {dealer.city ? ` in ${dealer.city}` : ''}.
              </p>

              {/* Social Icons */}
              {dealer.socialLinks && (
                <div className="flex items-center gap-3 mt-4">
                  {dealer.socialLinks.facebook && (
                    <a
                      href={dealer.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Facebook"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {dealer.socialLinks.instagram && (
                    <a
                      href={dealer.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Instagram"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                  {dealer.socialLinks.youtube && (
                    <a
                      href={dealer.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="YouTube"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                  )}
                  {dealer.socialLinks.tiktok && (
                    <a
                      href={dealer.socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="TikTok"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.64a6.34 6.34 0 0 0 6.34-6.34V8.7a8.16 8.16 0 0 0 3.76.92V6.2a4.84 4.84 0 0 1 0 .49z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                {dealer.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>
                      {dealer.address}
                      {dealer.city && `, ${dealer.city}`}
                      {dealer.state && `, ${dealer.state}`}
                      {dealer.zip && ` ${dealer.zip}`}
                    </span>
                  </li>
                )}
                {dealer.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent shrink-0" />
                    <a href={`tel:${dealer.phone}`} className="hover:text-white transition-colors">
                      {dealer.phone}
                    </a>
                  </li>
                )}
                {dealer.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-accent shrink-0" />
                    <a href={`mailto:${dealer.email}`} className="hover:text-white transition-colors">
                      {dealer.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-white font-semibold mb-4">Hours</h4>
              {dealer.hours && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <div className="space-y-1">
                    {dealer.hours.split('|').map((line, i) => (
                      <p key={i}>{line.trim()}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} {dealer.name}. All rights reserved.
            </p>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <span>Powered by</span>
              <span className="font-semibold text-accent">Talos</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
