import type { Lead, Dealer, Unit } from '@roostdealer/db'

interface AdfInput {
  lead: Lead
  dealer: Dealer
  unit?: Unit | null
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function mapInterestToAdf(interest: string | null): string {
  if (!interest) return 'buy'
  switch (interest) {
    case 'service': return 'service'
    case 'trade': return 'trade-in'
    case 'financing': return 'finance'
    default: return 'buy'
  }
}

function mapStatusToAdf(status: string): string {
  switch (status) {
    case 'new': return 'new'
    case 'contacted': return 'open'
    case 'qualified': return 'open'
    case 'closed': return 'sold'
    default: return 'new'
  }
}

export function buildAdfXml({ lead, dealer, unit }: AdfInput): string {
  const requestDate = lead.createdAt.toISOString()
  const prospectStatus = mapStatusToAdf(lead.status)

  let vehicleBlock = ''
  if (unit) {
    const interest = mapInterestToAdf(lead.interest)
    const condition = unit.condition === 'new' ? 'new' : 'used'
    vehicleBlock = `
    <vehicle interest="${interest}" status="${condition}">
      <year>${unit.year ?? ''}</year>
      <make>${escapeXml(unit.make)}</make>
      <model>${escapeXml(unit.model)}</model>${unit.trim ? `
      <trim>${escapeXml(unit.trim)}</trim>` : ''}${unit.stockNumber ? `
      <stock>${escapeXml(unit.stockNumber)}</stock>` : ''}${unit.price ? `
      <price type="asking" currency="USD">${unit.price}</price>` : ''}
    </vehicle>`
  }

  const phoneBlock = lead.phone
    ? `
        <phone type="voice">${escapeXml(lead.phone)}</phone>`
    : ''

  const commentsBlock = lead.message
    ? `
      <comments>${escapeXml(lead.message)}</comments>`
    : ''

  const vendorAddress = [
    dealer.address ? `
          <street line="1">${escapeXml(dealer.address)}</street>` : '',
    dealer.city ? `
          <city>${escapeXml(dealer.city)}</city>` : '',
    dealer.state ? `
          <regioncode>${escapeXml(dealer.state)}</regioncode>` : '',
    dealer.zip ? `
          <postalcode>${escapeXml(dealer.zip)}</postalcode>` : '',
  ].filter(Boolean).join('')

  const vendorAddressBlock = vendorAddress
    ? `
        <address>${vendorAddress}
        </address>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect status="${prospectStatus}">
    <requestdate>${requestDate}</requestdate>${vehicleBlock}
    <customer>
      <contact>
        <name part="first">${escapeXml(lead.firstName)}</name>
        <name part="last">${escapeXml(lead.lastName)}</name>
        <email>${escapeXml(lead.email)}</email>${phoneBlock}
      </contact>${commentsBlock}
    </customer>
    <vendor>
      <contact>
        <name part="full">${escapeXml(dealer.name)}</name>${dealer.email ? `
        <email>${escapeXml(dealer.email)}</email>` : ''}${dealer.phone ? `
        <phone type="voice">${escapeXml(dealer.phone)}</phone>` : ''}${vendorAddressBlock}
      </contact>
    </vendor>
    <provider>
      <name part="full">RoostDealer</name>
      <url>https://roostdealer.com</url>
    </provider>
  </prospect>
</adf>`
}
