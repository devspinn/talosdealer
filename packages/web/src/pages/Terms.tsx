import { Link } from 'react-router-dom'
import { useMetaTags } from '@/hooks/use-meta-tags'

export default function Terms() {
  useMetaTags({
    title: 'Terms of Service | Talos',
    description: 'Terms of Service for the Talos dealer website platform.',
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-400 mt-2 mb-10">Last updated: April 22, 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("Dealer," "you," or "your") and Talos ("Company," "we," "us," or "our") governing your access to and use of the Talos platform, including our website, dealer website hosting, inventory management tools, and related services (collectively, the "Service").
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service. If you are accepting these Terms on behalf of a business entity, you represent that you have the authority to bind that entity.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Talos is an AI-powered website platform designed for powersports, marine, and outdoor equipment dealerships. The Service includes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Hosted dealer websites with inventory listings, contact forms, and lead capture</li>
            <li>AI-generated inventory descriptions and content enhancement</li>
            <li>Inventory data import via website scraping or direct integration</li>
            <li>Image hosting and optimization</li>
            <li>SEO optimization and analytics</li>
            <li>A dealer dashboard for managing inventory, leads, and site settings</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            To use the Service, you must create an account by providing accurate and complete information, including your name, email address, and dealership details. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            You must be at least 18 years of age and authorized to operate or represent a dealership to use the Service. We reserve the right to suspend or terminate accounts that contain inaccurate information or violate these Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Subscription and Billing</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The Service is offered on a <span className="font-semibold text-gray-900">month-to-month subscription</span> basis. By subscribing, you authorize us to charge the payment method on file at the beginning of each billing cycle.
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">No long-term contracts.</span> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</li>
            <li><span className="font-semibold text-gray-900">No refunds.</span> Fees already paid for the current billing period are non-refundable. You will retain access to the Service until the end of your paid period.</li>
            <li><span className="font-semibold text-gray-900">Price changes.</span> We may adjust subscription pricing with at least 30 days' written notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.</li>
            <li><span className="font-semibold text-gray-900">Failed payments.</span> If a payment fails, we will attempt to notify you and may suspend access to the Service until payment is resolved.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Dealer Content and Data</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            You retain ownership of all content you provide to the Service, including inventory data, photos, business information, logos, and dealer-specific copy ("Dealer Content"). By uploading Dealer Content, you grant us a non-exclusive, worldwide license to host, display, reproduce, and distribute that content solely for the purpose of providing the Service.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            You represent that you have the right to use and share all Dealer Content you provide and that it does not infringe on the intellectual property rights of any third party.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. AI-Generated Content</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The Service uses artificial intelligence to generate inventory descriptions, hero text, and other content based on your inventory data and dealership information. You acknowledge and agree that:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>AI-generated content is produced algorithmically and may contain inaccuracies, including incorrect specifications, pricing, or descriptions.</li>
            <li>You are solely responsible for reviewing, editing, and approving all AI-generated content before it is published on your dealer website.</li>
            <li>We do not guarantee the accuracy, completeness, or suitability of any AI-generated content.</li>
            <li>AI-generated descriptions are created using your inventory data as input. The resulting content is licensed to you for use on your Talos-hosted website.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Customer Data and Leads</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Your dealer website may collect information from visitors through contact forms, financing inquiries, and other lead capture mechanisms ("Customer Data"). You are the data controller for Customer Data collected through your dealer website.
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>We process Customer Data on your behalf solely to deliver leads and inquiries to you through the Service.</li>
            <li>You are responsible for complying with all applicable privacy laws regarding Customer Data you collect, including providing appropriate privacy notices to your website visitors.</li>
            <li>We will not sell, rent, or share Customer Data with third parties for marketing purposes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Acceptable Use</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Publish false, misleading, or fraudulent inventory listings</li>
            <li>Violate any applicable law or regulation, including consumer protection and advertising laws</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Distribute malware, spam, or other harmful content</li>
            <li>Attempt to gain unauthorized access to the Service or its underlying infrastructure</li>
            <li>Interfere with or disrupt the Service or other users' access to the Service</li>
            <li>Scrape, harvest, or extract data from the Service for purposes unrelated to your dealer website</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The Talos platform — including its software, design, branding, documentation, and all related intellectual property — is and remains the exclusive property of Talos. Your subscription grants you a limited, non-exclusive, non-transferable license to use the Service for the duration of your subscription.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            You may not copy, modify, reverse engineer, or create derivative works based on the Talos platform. The Talos name, logo, and associated trademarks may not be used without our prior written consent.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The Service relies on third-party infrastructure providers to deliver its functionality, including:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">Cloudflare</span> for website hosting, content delivery, and image storage</li>
            <li><span className="font-semibold text-gray-900">Amazon Web Services (AWS)</span> for AI content generation</li>
            <li><span className="font-semibold text-gray-900">Neon</span> for database hosting</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            We are not responsible for the availability, performance, or policies of third-party providers. Your use of the Service is also subject to the terms and policies of these providers to the extent they apply.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">11. Disclaimer of Warranties</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">12. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TALOS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">13. Termination</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Either party may terminate this agreement at any time:
          </p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li><span className="font-semibold text-gray-900">By you:</span> Cancel your subscription through the dashboard or by contacting us. Your access continues until the end of the current billing period.</li>
            <li><span className="font-semibold text-gray-900">By us:</span> We may suspend or terminate your account immediately if you violate these Terms, fail to pay fees, or if continued service would be impractical or illegal.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            Upon termination, your dealer website will be taken offline. You may request an export of your Dealer Content and Customer Data for up to 30 days following termination. After 30 days, we may delete your data in accordance with our retention policies.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">14. Modifications to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We may update these Terms from time to time. If we make material changes, we will notify you by email or through the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">15. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            These Terms are governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved in the state or federal courts located in Delaware.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">16. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you have questions about these Terms, contact us at:
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            <span className="font-semibold text-gray-900">Talos</span><br />
            Email: support@roostdealer.com
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
