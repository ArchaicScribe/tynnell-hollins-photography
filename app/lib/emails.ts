/**
 * Email HTML templates for transactional emails sent via Resend.
 *
 * All values passed in must already be HTML-escaped by the caller.
 * Templates use inline styles for maximum email client compatibility.
 * Fonts: Georgia/serif for headings (email-safe), system sans for body.
 */

import { CONTACT_EMAIL } from './constants'

const SITE_URL = 'https://tynnellhollinsphotography.com'
const INSTAGRAM_URL = 'https://instagram.com/tynnellhollinsphotography'
const BRAND_ACCENT = '#9B9A9A'
const BRAND_DARK = '#1a1a1a'
const BODY_BG = '#faf9f7'
const CARD_BG = '#ffffff'
const BORDER = '#e8e5e1'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${BODY_BG};font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BODY_BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD_BG};border:1px solid ${BORDER};">

        <!-- Header -->
        <tr>
          <td style="padding:40px 48px 32px;border-bottom:1px solid ${BORDER};text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:1px;color:${BRAND_DARK};">
              Tynnell Hollins Photography
            </p>
            <p style="margin:6px 0 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${BRAND_ACCENT};">
              Albuquerque, New Mexico
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px 36px;border-top:1px solid ${BORDER};text-align:center;">
            <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ACCENT};">
              Questions? Reply to this email or reach us at
            </p>
            <p style="margin:0 0 12px;">
              <a href="mailto:${CONTACT_EMAIL}" style="font-family:'Courier New',monospace;font-size:11px;color:${BRAND_DARK};text-decoration:none;letter-spacing:0.5px;">${CONTACT_EMAIL}</a>
            </p>
            <p style="margin:0;">
              <a href="${INSTAGRAM_URL}" style="font-family:'Courier New',monospace;font-size:10px;color:${BRAND_ACCENT};text-decoration:none;letter-spacing:1px;">@tynnellhollinsphotography</a>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <a href="${SITE_URL}" style="font-family:'Courier New',monospace;font-size:10px;color:${BRAND_ACCENT};text-decoration:none;letter-spacing:1px;">tynnellhollinsphotography.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function internalWrapper(content: string): string {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;padding:24px;">${content}</div>`
}

function tableRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BRAND_ACCENT};width:140px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0 10px 16px;font-family:Georgia,serif;font-size:14px;color:${BRAND_DARK};vertical-align:top;">${value}</td>
    </tr>`
}

function table(rows: string): string {
  return `<table style="width:100%;border-collapse:collapse;border-top:1px solid ${BORDER};margin-bottom:8px;">${rows}</table>`
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${BRAND_ACCENT};">${text}</p>`
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:${BRAND_DARK};line-height:1.25;">${text}</h2>`
}

function body(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#444;">${text}</p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BORDER};margin:28px 0;" />`
}

function signature(): string {
  return `
    <p style="margin:28px 0 0;font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#444;">
      Talk soon,<br />
      <strong style="color:${BRAND_DARK};">Tynnell Hollins</strong><br />
      <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:${BRAND_ACCENT};">Tynnell Hollins Photography</span>
    </p>`
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
    f.location ? tableRow('Location', f.location) : '',
    f.howHeard ? tableRow('How They Found You', f.howHeard) : '',
  ].join('')

  return internalWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;">New Session Inquiry</h2>
    ${table([
      tableRow('Name', f.name),
      tableRow('Email', `<a href="mailto:${f.email}" style="color:#333;">${f.email}</a>`),
      tableRow('Phone', f.phone),
      tableRow('Preferred Contact', f.contactPreference),
      tableRow('Session Type', f.sessionType),
      tableRow('Desired Date', f.date),
      optionalRows,
    ].join(''))}
    <h3 style="margin:20px 0 8px;font-size:15px;">Message</h3>
    <p style="margin:0;white-space:pre-wrap;background:#f9f9f9;padding:16px;border-left:3px solid #ddd;font-size:14px;line-height:1.7;color:#444;">${f.message}</p>
    <p style="margin:20px 0 0;font-size:13px;color:#888;">Reply directly to this email to respond to ${f.name}.</p>
  `)
}

// ---------------------------------------------------------------------------
// Contact form acknowledgment (sent to the client on form submission)
// ---------------------------------------------------------------------------

export interface ClientAcknowledgmentEmailFields {
  name: string
  sessionType: string
  date: string
  oooMessage?: string
}

export function clientAcknowledgmentEmailHtml(f: ClientAcknowledgmentEmailFields): string {
  const responseNote = f.oooMessage
    ? body(f.oooMessage)
    : body("I'll be in touch within 48 hours to confirm availability and talk through all the details.")

  return emailWrapper(`
    ${eyebrow('Inquiry received')}
    ${heading('Thank you for reaching out.')}
    ${body(`Hi ${f.name}, I&rsquo;m so glad you connected with me about a <strong>${f.sessionType}</strong> session on <strong>${f.date}</strong>.`)}
    ${responseNote}
    ${body("In the meantime, feel free to <a href='${SITE_URL}/portfolio' style='color:" + BRAND_DARK + ";'>browse my portfolio</a> or <a href='${SITE_URL}/services' style='color:" + BRAND_DARK + ";'>review my services</a>.")}
    ${divider()}
    ${signature()}
  `.replace(/\$\{SITE_URL\}/g, SITE_URL))
}

// ---------------------------------------------------------------------------
// OOO return notification (sent to Tynnell when her return buffer expires)
// ---------------------------------------------------------------------------

export interface OooReturnNotificationFields {
  internalLabel: string
  returnDate: string
}

export function oooReturnNotificationEmailHtml(f: OooReturnNotificationFields): string {
  return internalWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;">You're back: availability is open again.</h2>
    <p>Your OOO period <strong>${f.internalLabel}</strong> has ended and your return buffer has expired.</p>
    <p>As of <strong>${f.returnDate}</strong>, the site is accepting new session inquiries and bookings again.</p>
    <p>Check your admin for any inquiries that came in while you were away. Reply to anyone who's waiting and lock in new sessions.</p>
    <p style="margin-top:20px;">
      <a href="${SITE_URL}/admin" style="color:#333;">Open the admin &rarr;</a>
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
  sessionDate?: string
}

export function bookingConfirmEmailHtml(f: BookingConfirmEmailFields): string {
  const rows = [
    tableRow('Client', f.clientName),
    tableRow('Email', `<a href="mailto:${f.clientEmail}" style="color:#333;">${f.clientEmail}</a>`),
    tableRow('Package', f.packageName),
    tableRow('Deposit Paid', f.amountPaid),
    ...(f.sessionDate ? [tableRow('Requested Date', f.sessionDate)] : []),
  ]
  return internalWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;">New Booking Deposit Received</h2>
    ${table(rows.join(''))}
    <p style="margin:20px 0 0;font-size:14px;color:#555;">Reach out to ${f.clientName} to confirm the date and next steps.</p>
  `)
}

// ---------------------------------------------------------------------------
// Booking deposit receipt (sent to the client after Stripe payment)
// ---------------------------------------------------------------------------

export interface ClientReceiptEmailFields {
  clientName: string
  packageName: string
  amountPaid: string
  sessionDate?: string
  oooMessage?: string
}

export function clientReceiptEmailHtml(f: ClientReceiptEmailFields): string {
  const followUpNote = f.oooMessage
    ? body(f.oooMessage)
    : body("I'll be reaching out shortly to confirm all the details and start planning your session together.")

  const dateNote = f.sessionDate
    ? body(`Your requested date is <strong>${f.sessionDate}</strong>. I&rsquo;ll be in touch to confirm availability and next steps.`)
    : ''

  return emailWrapper(`
    ${eyebrow("You're officially booked")}
    ${heading("Your date is held.")}
    ${body(`Hi ${f.clientName}, your <strong>${f.amountPaid}</strong> deposit for a <strong>${f.packageName}</strong> session has been received. I&rsquo;m so excited to work with you.`)}
    ${dateNote || followUpNote}
    ${divider()}
    ${signature()}
  `)
}
