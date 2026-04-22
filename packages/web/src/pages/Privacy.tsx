import { Link } from 'react-router-dom'
import { useMetaTags } from '@/hooks/use-meta-tags'

export default function Privacy() {
  useMetaTags({
    title: 'Privacy Policy | Talos',
    description: 'Privacy Policy for the Talos dealer website platform.',
  })

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 sm:h-20">
            <Link to="/" className="text-xl font-bold text-white tracking-tight hover:text-white/90 transition-colors">
              Talos
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mt-2 mb-10">Last updated: April 22, 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Talos ("Company," "we," "us," or "our") operates an AI-powered website platform for powersports, marine, and outdoor equipment dealerships. This Privacy Policy describes how we collect, use, share, and protect information when you use our platform, visit our website, or interact with a dealer website hosted on our platform.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            This policy applies to two categories of people: <span className="font-semibold text-gray-900">dealers</span> who subscribe to and use the Talos platform, and <span className="font-semibold text-gray-900">website visitors</span> who browse dealer websites hosted on the platform. Where our practices differ for these groups, we note the distinction below.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Dealer Account Information</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            When you create an account, we collect:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Name and email address</li>
            <li>Business name, address, phone number, and hours of operation</li>
            <li>Payment information (processed by our payment provider — we do not store full card numbers)</li>
            <li>Logo and branding assets you upload</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Inventory Data</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            We collect and process inventory data that you provide or that we import from your existing website or dealer management system, including:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Unit details: year, make, model, condition, type, VIN, stock number, pricing</li>
            <li>Unit descriptions and specifications</li>
            <li>Photos and images of inventory items</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Customer and Lead Data</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            When visitors submit forms on your dealer website (contact forms, financing inquiries, trade-in requests), we collect the information they provide, which may include:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Name, email address, and phone number</li>
            <li>Message content and inquiry details</li>
            <li>Information about the unit or service they are interested in</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            The dealer is the data controller for Customer and Lead Data. We process this data on the dealer's behalf to deliver leads through the platform.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Usage Data</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            We automatically collect certain information when you or your website visitors use the Service, including:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>IP address, browser type, operating system, and device information</li>
            <li>Pages visited, time spent on pages, and navigation paths</li>
            <li>Referring URLs and search terms</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Cookies and Similar Technologies</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            We use cookies and similar technologies for session management, authentication, and analytics. These include:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">Essential cookies:</span> Required for login, session management, and core platform functionality</li>
            <li><span className="font-semibold text-gray-900">Analytics cookies:</span> Help us understand how the platform is used so we can improve the Service</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">Provide the Service:</span> Host your dealer website, display your inventory, deliver leads and inquiries to your dashboard</li>
            <li><span className="font-semibold text-gray-900">Generate AI content:</span> Your inventory data (year, make, model, specifications, condition) is sent to AI models to generate descriptions, hero text, and other content for your dealer website. This processing is performed by Amazon Web Services (AWS) through their Bedrock service.</li>
            <li><span className="font-semibold text-gray-900">Process payments:</span> Charge your subscription and manage billing</li>
            <li><span className="font-semibold text-gray-900">Communicate with you:</span> Send account notifications, billing receipts, service updates, and respond to support requests</li>
            <li><span className="font-semibold text-gray-900">Improve the Service:</span> Analyze usage patterns, diagnose technical issues, and develop new features</li>
            <li><span className="font-semibold text-gray-900">Ensure security:</span> Detect and prevent fraud, abuse, and unauthorized access</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. How We Share Your Information</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We share your information only in the following circumstances:
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Service Providers</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            We use trusted third-party providers to operate the Service:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">Amazon Web Services (AWS):</span> AI content generation via the Bedrock service. Inventory data is sent to AI models to produce descriptions. AWS processes this data in accordance with their service terms.</li>
            <li><span className="font-semibold text-gray-900">Cloudflare:</span> Website hosting, content delivery, and image storage (R2). Your dealer website, inventory images, and static assets are served through Cloudflare's infrastructure.</li>
            <li><span className="font-semibold text-gray-900">Neon:</span> Database hosting. Your account data, inventory records, and lead data are stored in a Neon-hosted PostgreSQL database.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Public Information</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            Your dealer website is publicly accessible. Information you choose to publish — including your business name, contact information, inventory listings, and photos — is visible to anyone who visits your site.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Legal Requirements</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            We may disclose information if required by law, regulation, legal process, or governmental request, or if we believe disclosure is necessary to protect the rights, property, or safety of Talos, our users, or the public.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Business Transfers</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            If Talos is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.
          </p>

          <p className="text-gray-600 leading-relaxed mb-4">
            <span className="font-semibold text-gray-900">We do not sell your personal information.</span> We do not rent, trade, or otherwise share your data with third parties for their marketing purposes.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Data Storage and Security</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Your data is stored on infrastructure provided by Neon (database) and Cloudflare (images and static assets), both hosted in the United States. All data is encrypted in transit via HTTPS/TLS. We implement commercially reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            No method of transmission or storage is completely secure. While we strive to protect your data, we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We retain your information for as long as your account is active and as needed to provide the Service. After account termination:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>You may request an export of your data for up to 30 days following termination</li>
            <li>We will delete or anonymize your data within 90 days of termination, unless retention is required by law</li>
            <li>Certain data may be retained in backups for a limited period and will be deleted in the normal course of backup rotation</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">Access</span> the personal information we hold about you</li>
            <li><span className="font-semibold text-gray-900">Correct</span> inaccurate or incomplete information</li>
            <li><span className="font-semibold text-gray-900">Delete</span> your personal information, subject to certain exceptions</li>
            <li><span className="font-semibold text-gray-900">Export</span> your data in a portable format</li>
            <li><span className="font-semibold text-gray-900">Object</span> to or restrict certain processing of your information</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            To exercise any of these rights, contact us at the email address below. We will respond to your request within 30 days.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The Service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete it promptly. If you believe a child under 13 has provided us with personal information, please contact us.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Third-Party Links</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Dealer websites hosted on our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party sites you visit.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We may update this Privacy Policy from time to time. If we make material changes, we will notify dealers by email or through the Service at least 30 days before the changes take effect. The "Last updated" date at the top of this page reflects the most recent revision.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">11. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you have questions about this Privacy Policy or our data practices, contact us at:
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            <span className="font-semibold text-gray-900">Talos</span><br />
            Email: devon@talosdealer.com
          </p>
        </div>
      </main>

      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-semibold text-accent">Talos</span>.
              All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
              <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
