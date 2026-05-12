/**
 * Email HTML templates for transactional emails sent via Resend.
 *
 * All values passed in must already be HTML-escaped by the caller.
 * Templates use inline styles for maximum email client compatibility.
 */

import { CONTACT_EMAIL } from '@/app/lib/constants'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function wrapper(content: string): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">${content}</div>`
}

function tableRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 8px 0; font-weight: bold; width: 160px;">${label}</td>
      <td style="padding: 8px 0;">${value}</td>
    </tr>`
}

function table(rows: string): string {
  return `<table style="width: 100%; border-collapse: collapse;">${rows}</table>`
}

// ---------------------------------------------------------------------------
// Contact form inquiry notification (sent to Tynnell)
// ---------------------------------------------------------------------------

export interface InquiryEmailFields {
  name: string
  email: string
  phone: string
  contactPreference: string
  sessionType: string
  date: string
  location: string
  howHeard: string
  message: string
}

export function inquiryEmailHtml(f: InquiryEmailFields): string {
  const optionalRows = [
    f.location ? tableRow('Location / Venue', f.location) : '',
    f.howHeard ? tableRow('How They Found You', f.howHeard) : '',
  ].join('')

  return wrapper(`
    <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">New Session Inquiry</h2>
    ${table([
      tableRow('Name', f.name),
      tableRow('Email', `<a href="mailto:${f.email}">${f.email}</a>`),
      tableRow('Phone', f.phone),
      tableRow('Preferred Contact', f.contactPreference),
      tableRow('Session Type', f.sessionType),
      tableRow('Desired Date', f.date),
      optionalRows,
    ].join(''))}
    <h3 style="margin-top: 1.5rem;">Message</h3>
    <p style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 4px;">${f.message}</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.875rem;">
      Reply directly to this email to respond to ${f.name}.
    </p>
  `)
}

// ---------------------------------------------------------------------------
// Booking deposit notification (sent to Tynnell after Stripe payment)
// ---------------------------------------------------------------------------

export interface BookingConfirmEmailFields {
  clientName: string
  clientEmail: string
  packageName: string
  amountPaid: string
}

export function bookingConfirmEmailHtml(f: BookingConfirmEmailFields): string {
  return wrapper(`
    <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">New Booking Deposit Received</h2>
    ${table([
      tableRow('Client', f.clientName),
      tableRow('Email', `<a href="mailto:${f.clientEmail}">${f.clientEmail}</a>`),
      tableRow('Package', f.packageName),
      tableRow('Deposit Paid', f.amountPaid),
    ].join(''))}
    <p style="margin-top: 1.5rem; color: #555;">Reach out to ${f.clientName} to confirm the date and next steps.</p>
  `)
}

// ---------------------------------------------------------------------------
// Booking deposit receipt (sent to the client after Stripe payment)
// ---------------------------------------------------------------------------

export interface ClientReceiptEmailFields {
  clientName: string
  packageName: string
  amountPaid: string
}

export function clientReceiptEmailHtml(f: ClientReceiptEmailFields): string {
  return wrapper(`
    <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">You're officially on the calendar.</h2>
    <p>Hi ${f.clientName},</p>
    <p>Your ${f.amountPaid} deposit for a <strong>${f.packageName}</strong> session has been received. Your date is now held.</p>
    <p>I'll be reaching out shortly to confirm all the details and start planning your session.</p>
    <p style="margin-top: 2rem;">Talk soon,<br/><strong>Tynnell Hollins</strong><br/>Tynnell Hollins Photography</p>
    <hr style="margin: 2rem 0; border: none; border-top: 1px solid #eee;" />
    <p style="color: #999; font-size: 0.8rem;">Questions? Reply to this email or reach out at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
  `)
}
