import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    group: 'Services & Booking',
    useAsTitle: 'title',
    description:
      'Track each client engagement from inquiry through delivery - sessions, payments, and documents all live on the project record.',
    defaultColumns: ['title', 'clientName', 'projectType', 'status', 'projectDate'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Project Name',
      required: true,
      admin: {
        description: 'A short name for this project. Example: "Smith Wedding" or "Javan Graduation Session".',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'inquiry',
      admin: {
        position: 'sidebar',
        description: 'Where this project is in your pipeline.',
      },
      options: [
        { label: 'Inquiry', value: 'inquiry' },
        { label: 'Booked', value: 'booked' },
        { label: 'Post-Production', value: 'post-production' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'clientName',
      type: 'text',
      label: 'Client Name',
      required: true,
    },
    {
      name: 'clientEmail',
      type: 'email',
      label: 'Client Email',
      required: true,
    },
    {
      name: 'projectType',
      type: 'select',
      label: 'Project Type',
      admin: {
        description: 'The type of session this project is for.',
      },
      options: [
        { label: 'Portrait', value: 'portrait' },
        { label: 'Wedding', value: 'wedding' },
        { label: 'Family', value: 'family' },
        { label: 'Couples', value: 'couples' },
        { label: 'Brand', value: 'brand' },
      ],
    },
    {
      name: 'projectDate',
      type: 'date',
      label: 'Project Date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Location',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Notes about this project. Visible to the client if you choose to share it - not private.',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Private notes for you only. Never shown to clients.',
      },
    },
    {
      name: 'sessions',
      type: 'array',
      label: 'Sessions',
      labels: { singular: 'Session', plural: 'Sessions' },
      admin: {
        description: 'Scheduled or completed sessions for this project.',
        components: {
          RowLabel: './collections/Projects/SessionRowLabel#SessionRowLabel',
        },
      },
      fields: [
        {
          name: 'sessionDate',
          type: 'date',
          label: 'Session Date',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'location',
          type: 'text',
          label: 'Location',
        },
        {
          name: 'sessionType',
          type: 'select',
          label: 'Session Type',
          options: [
            { label: 'Portrait', value: 'portrait' },
            { label: 'Engagement', value: 'engagement' },
            { label: 'Wedding Ceremony', value: 'wedding-ceremony' },
            { label: 'Wedding Reception', value: 'wedding-reception' },
            { label: 'Family', value: 'family' },
            { label: 'Couples', value: 'couples' },
            { label: 'Brand', value: 'brand' },
          ],
        },
        {
          name: 'duration',
          type: 'number',
          label: 'Duration (minutes)',
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notes',
        },
      ],
    },
    {
      name: 'payments',
      type: 'array',
      label: 'Payments',
      labels: { singular: 'Payment', plural: 'Payments' },
      admin: {
        description: 'Record-keeping only - actual payment processing happens through Stripe on the booking page.',
        components: {
          RowLabel: './collections/Projects/PaymentRowLabel#PaymentRowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          required: true,
          admin: { description: 'Example: "Deposit", "Final Payment", "Travel Fee".' },
        },
        {
          name: 'amount',
          type: 'number',
          label: 'Amount (USD)',
          required: true,
        },
        {
          name: 'dueDate',
          type: 'date',
          label: 'Due Date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status',
          required: true,
          defaultValue: 'upcoming',
          options: [
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Paid', value: 'paid' },
            { label: 'Past Due', value: 'past-due' },
          ],
        },
        {
          name: 'notes',
          type: 'text',
          label: 'Notes',
        },
      ],
    },
    {
      name: 'documents',
      type: 'array',
      label: 'Documents',
      labels: { singular: 'Document', plural: 'Documents' },
      admin: {
        description: 'Track contracts and invoices for this project. Store the actual file/signature in DocuSign, Google Drive, or wherever it lives, and link to it here.',
        components: {
          RowLabel: './collections/Projects/DocumentRowLabel#DocumentRowLabel',
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
          admin: { description: 'Example: "Smith Wedding Contract", "Invoice #1006".' },
        },
        {
          name: 'documentType',
          type: 'select',
          label: 'Document Type',
          required: true,
          defaultValue: 'contract',
          options: [
            { label: 'Contract', value: 'contract' },
            { label: 'Invoice', value: 'invoice' },
            { label: 'Model Release', value: 'model-release' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status',
          required: true,
          defaultValue: 'draft',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Sent', value: 'sent' },
            { label: 'Signed', value: 'signed' },
            { label: 'Void', value: 'void' },
          ],
        },
        {
          name: 'documentDate',
          type: 'date',
          label: 'Date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'amount',
          type: 'number',
          label: 'Amount (USD)',
          admin: { description: 'For invoices: the invoice total.' },
        },
        {
          name: 'externalLink',
          type: 'text',
          label: 'Link',
          admin: { description: 'Link to the document in DocuSign, Google Drive, or wherever it lives.' },
        },
        {
          name: 'notes',
          type: 'text',
          label: 'Notes',
        },
      ],
    },
  ],
}
