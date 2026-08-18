export const EXPIRY_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'never', label: 'Never expires' },
];

export const SCOPE_OPTIONS = [
  { value: 'all', label: 'Entire conversation (messages + attachments)' },
  { value: 'messages', label: 'Messages only' },
  { value: 'attachments', label: 'Attachments only' },
  { value: 'partial', label: 'Select specific messages…' },
];

export const SCOPE_LABELS = {
  all: 'Full conversation',
  messages: 'Messages only',
  attachments: 'Attachments only',
  partial: 'Selected messages',
};
