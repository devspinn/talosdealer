import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Sparkles,
  FileText,
  ArrowLeftRight,
  Send,
  CheckCircle,
} from 'lucide-react'
import { cn, formatPrice, formatCondition } from '@/lib/utils'
import { useDealerPath } from '@/DealerContext'
import { submitLead } from '@/lib/api'
import type { Unit, DealerInfo } from '@/types'

interface UnitDetailProps {
  units: Unit[]
  dealer: DealerInfo
}

export default function UnitDetail({ units, dealer }: UnitDetailProps) {
  const { id } = useParams<{ id: string }>()
  const dp = useDealerPath()
  const unit = units.find((u) => u.id === id)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [inquiryName, setInquiryName] = useState('')
  const [inquiryPhone, setInquiryPhone] = useState('')
  const [inquiryEmail, setInquiryEmail] = useState('')
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquiryWebsite, setInquiryWebsite] = useState('') // honeypot
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquirySubmitted, setInquirySubmitted] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)

  if (!unit) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Unit Not Found
        </h1>
        <Link
          to={dp('/inventory')}
          className="text-accent hover:text-amber-600 font-semibold"
        >
          &larr; Back to Inventory
        </Link>
      </div>
    )
  }

  const title = [unit.year, unit.make, unit.model].filter(Boolean).join(' ')
  const photos =
    unit.photos.length > 0
      ? unit.photos
      : ['https://placehold.co/800x600/94a3b8/white?text=No+Photo']

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to={dp('/inventory')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Inventory
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Photo Gallery */}
          <div>
            {/* Main Image */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <img
                src={photos[activePhoto]}
                alt={`${title} - Photo ${activePhoto + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="flex gap-3 mt-4">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhoto(index)}
                    className={cn(
                      'relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all',
                      activePhoto === index
                        ? 'border-accent shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={photo}
                      alt={`${title} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-white',
                  unit.condition === 'new' ? 'bg-emerald-500' : 'bg-sky-500'
                )}
              >
                {formatCondition(unit.condition)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                {unit.type}
              </span>
              {unit.stockNumber && (
                <span className="text-xs text-gray-400">
                  Stock# {unit.stockNumber}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {title}
            </h1>
            {unit.trim && (
              <p className="text-lg text-gray-500 mt-1">{unit.trim}</p>
            )}

            {/* Price */}
            <p className="text-3xl font-bold text-primary mt-4">
              {formatPrice(unit.price)}
            </p>

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* AI Description */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Description
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent uppercase tracking-wider">
                    AI-Enhanced
                  </span>
                </div>

                {/* Before/After Toggle */}
                {unit.originalDescription && (
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      showOriginal
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {showOriginal ? 'Show AI Version' : 'Show Original'}
                  </button>
                )}
              </div>

              {showOriginal && unit.originalDescription ? (
                <div className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gray-300 rounded-full" />
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Original Dealer Description
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {unit.originalDescription}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  {unit.aiDescription}
                </p>
              )}
            </div>

            {/* Specs Table */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Specifications
              </h2>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {Object.entries(unit.specs).map(([key, value], index) => (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    )}
                  >
                    <span className="font-medium text-gray-500 w-1/2">
                      {key}
                    </span>
                    <span className="text-gray-900 w-1/2">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Interested in this {unit.make} {unit.model}?
              </h2>
              <p className="text-gray-500 mb-6">
                Fill out the form below and our team will get back to you within
                one business day. Or call us directly at{' '}
                <a
                  href={`tel:${dealer.phone}`}
                  className="text-accent font-semibold hover:text-amber-600"
                >
                  {dealer.phone}
                </a>
                .
              </p>
              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Unit:</span>{' '}
                  {title}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Price:</span>{' '}
                  {formatPrice(unit.price)}
                </p>
                {unit.stockNumber && (
                  <p>
                    <span className="font-medium text-gray-900">
                      Stock #:
                    </span>{' '}
                    {unit.stockNumber}
                  </p>
                )}
              </div>
            </div>

            {inquirySubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Inquiry Sent!
                </h3>
                <p className="text-gray-500 text-sm">
                  We'll get back to you about this {unit.make} {unit.model} within one business day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setInquiryError(null)
                  setInquirySubmitting(true)
                  try {
                    const parts = inquiryName.trim().split(/\s+/)
                    const firstName = parts[0] || ''
                    const lastName = parts.slice(1).join(' ') || '-'
                    await submitLead(dealer.slug, {
                      firstName,
                      lastName,
                      email: inquiryEmail,
                      phone: inquiryPhone,
                      message: inquiryMessage || `I'm interested in the ${title}. Please send me more information.`,
                      unitId: unit.id,
                      source: 'unit_inquiry',
                      website: inquiryWebsite,
                    })
                    setInquirySubmitted(true)
                  } catch (err: any) {
                    setInquiryError(err.message || 'Something went wrong.')
                  } finally {
                    setInquirySubmitting(false)
                  }
                }}
                className="space-y-4"
              >
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={inquiryWebsite}
                  onChange={(e) => setInquiryWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="(406) 555-1234"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={`I'm interested in the ${title}. Please send me more information...`}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                  />
                </div>

                {inquiryError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {inquiryError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {inquirySubmitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
