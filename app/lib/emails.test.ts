import { describe, it, expect } from 'vitest'
import { inquiryEmailHtml, clientAcknowledgmentEmailHtml } from './emails'

describe('inquiryEmailHtml', () => {
  const fields = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
    contactPreference: 'Email',
    sessionType: 'Wedding',
    date: '2026-08-15',
    location: 'Albuquerque, NM',
    howHeard: 'Instagram',
    message: 'We would love to book a session!',
  }

  it('contains the expected field values', () => {
    const html = inquiryEmailHtml(fields)
    expect(html).toContain('Jane Doe')
    expect(html).toContain('jane@example.com')
    expect(html).toContain('Wedding')
    expect(html).toContain('We would love to book a session!')
  })

  it('omits optional rows when location and howHeard are blank', () => {
    const html = inquiryEmailHtml({ ...fields, location: '', howHeard: '' })
    expect(html).not.toContain('How They Found You')
  })
})

describe('clientAcknowledgmentEmailHtml', () => {
  const fields = {
    name: 'Jane Doe',
    sessionType: 'Wedding',
    date: '2026-08-15',
  }

  it('renders the default response note when no OOO message is set', () => {
    const html = clientAcknowledgmentEmailHtml(fields)
    expect(html).toContain('Jane Doe')
    expect(html).toContain('Wedding')
    expect(html).toContain("I'll be in touch within 48 hours")
  })

  it('renders the OOO message when provided', () => {
    const html = clientAcknowledgmentEmailHtml({ ...fields, oooMessage: 'I am away until August 1st.' })
    expect(html).toContain('I am away until August 1st.')
    expect(html).not.toContain("I'll be in touch within 48 hours")
  })
})

describe('inquiry emails without phone, preference or date', () => {
  it('leaves the phone, preference and date rows out of the notification', () => {
    const html = inquiryEmailHtml({ name: 'Ana', email: 'ana@example.com', sessionType: 'Wedding', partnerName: 'Sam', message: 'Hi', location: '', howHeard: '' })

    expect(html).toContain('Sam')
    expect(html).not.toContain('Phone')
    expect(html).not.toContain('Preferred Contact')
    expect(html).not.toContain('Desired Date')
    expect(html).not.toContain('undefined')
  })

  it('leaves the "on <date>" phrase out of the acknowledgment when no date was sent', () => {
    const html = clientAcknowledgmentEmailHtml({ name: 'Ana', sessionType: 'Wedding' })

    expect(html).toContain('Wedding</strong> session')
    expect(html).not.toContain(' on <strong>')
    expect(html).not.toContain('undefined')
  })
})
