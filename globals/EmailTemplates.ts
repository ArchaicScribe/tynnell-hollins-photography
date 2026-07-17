import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/app/lib/access'

export const EmailTemplates: GlobalConfig = {
  slug: 'email-templates',
  label: 'Email Templates',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    group: 'My Portfolio',
    description:
      'Copy for the emails sent when you share a gallery with a client, and the automatic reminder sent before it expires. Edited from Settings.',
  },
  fields: [
    {
      name: 'shareSubject',
      type: 'text',
      label: 'Collection Sharing: Subject',
      defaultValue: 'Your {{galleryTitle}} Gallery Is Ready!',
      admin: {
        description: 'Available variables: {{clientName}}, {{galleryTitle}}',
      },
    },
    {
      name: 'shareHeading',
      type: 'text',
      label: 'Collection Sharing: Heading',
      defaultValue: 'Your photos are ready.',
      admin: {
        description: 'Available variables: {{clientName}}, {{galleryTitle}}',
      },
    },
    {
      name: 'shareBody',
      type: 'textarea',
      label: 'Collection Sharing: Body',
      defaultValue:
        "Hi {{clientName}},\n\nI'm so excited to share your {{galleryTitle}} gallery with you! Click below to view and enjoy your photos.\n\n{{passwordNote}}",
      admin: {
        description: 'Available variables: {{clientName}}, {{galleryTitle}}, {{passwordNote}} (only appears if the gallery is password protected)',
      },
    },
    {
      name: 'shareButtonLabel',
      type: 'text',
      label: 'Collection Sharing: Button Label',
      defaultValue: 'View Your Gallery',
    },
    {
      name: 'reminderSubject',
      type: 'text',
      label: 'Expiry Reminder: Subject',
      defaultValue: 'Reminder: Your {{galleryTitle}} Gallery Expires Soon',
      admin: {
        description: 'Available variables: {{clientName}}, {{galleryTitle}}, {{expiresAt}}',
      },
    },
    {
      name: 'reminderHeading',
      type: 'text',
      label: 'Expiry Reminder: Heading',
      defaultValue: "Don't forget your photos.",
      admin: {
        description: 'Available variables: {{clientName}}, {{galleryTitle}}, {{expiresAt}}',
      },
    },
    {
      name: 'reminderBody',
      type: 'textarea',
      label: 'Expiry Reminder: Body',
      defaultValue:
        'Hi {{clientName}},\n\nJust a friendly reminder that your {{galleryTitle}} gallery will expire on {{expiresAt}}. Be sure to view and download your favorites before then!',
      admin: {
        description: 'Available variables: {{clientName}}, {{galleryTitle}}, {{expiresAt}}',
      },
    },
    {
      name: 'reminderButtonLabel',
      type: 'text',
      label: 'Expiry Reminder: Button Label',
      defaultValue: 'View Your Gallery',
    },
    {
      name: 'reminderDaysBefore',
      type: 'number',
      label: 'Send Reminder (Days Before Expiry)',
      defaultValue: 3,
      min: 0,
      admin: {
        description: 'How many days before a gallery expires to send the reminder email.',
      },
    },
  ],
}
