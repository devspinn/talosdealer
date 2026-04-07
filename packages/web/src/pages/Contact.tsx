import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import type { DealerInfo } from '@/types'
import { submitLead } from '@/lib/api'

interface ContactProps {
  dealer: DealerInfo
}

export default function Contact({ dealer }: ContactProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await submitLead(dealer.slug, {
        firstName,
        lastName,
        email,
        phone,
        interest,
        message,
        website,
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Contact Us
          </h1>
          <p className="mt-2 text-white/60 text-lg">
            We'd love to hear from you. Get in touch today.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {dealer.name}
              </h2>

              <div className="space-y-5">
                {dealer.address && (
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Address
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {dealer.address}
                        <br />
                        {dealer.city}, {dealer.state} {dealer.zip}
                      </p>
                    </div>
                  </div>
                )}

                {dealer.phone && (
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <a
                        href={`tel:${dealer.phone}`}
                        className="text-sm text-accent hover:text-amber-600 font-medium mt-0.5 block"
                      >
                        {dealer.phone}
                      </a>
                    </div>
                  </div>
                )}

                {dealer.email && (
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a
                        href={`mailto:${dealer.email}`}
                        className="text-sm text-accent hover:text-amber-600 font-medium mt-0.5 block"
                      >
                        {dealer.email}
                      </a>
                    </div>
                  </div>
                )}

                {dealer.hours && (
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hours</p>
                      <div className="text-sm text-gray-500 mt-0.5 space-y-0.5">
                        {dealer.hours.split('|').map((line, i) => (
                          <p key={i}>{line.trim()}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center">
                <div className="text-center px-6">
                  <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    Interactive Map
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Message Sent!
                  </h2>
                  <p className="text-gray-500">
                    Thank you for reaching out. We'll get back to you within one
                    business day.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Send Us a Message
                  </h2>
                  <p className="text-gray-500 text-sm mb-8">
                    Fill out the form below and we'll get back to you within one
                    business day.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot — hidden from real users */}
                    <input
                      type="text"
                      name="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Smith"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(406) 555-1234"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        What are you interested in?
                      </label>
                      <select
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                      >
                        <option value="">Select an option...</option>
                        <option value="new-boat">Buying a New Boat</option>
                        <option value="used-boat">Buying a Used Boat</option>
                        <option value="pwc">Personal Watercraft</option>
                        <option value="service">Service &amp; Repairs</option>
                        <option value="trade">Trade-In</option>
                        <option value="financing">Financing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us how we can help you..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
