export const SHARE_TABS = {
  team: 'team',
  externally: 'externally',
};

export const SHARE_MODES = {
  owner: 'owner',
  linksOnly: 'linksOnly',
};

export const WHOLE_TEAM_ID = 'whole-team';

export const SHARE_MESSAGES = {
  ownerOnly: 'Link copied. Only you can access it for now.',
  unsaved: 'Link copied. Save changes to grant access to added people.',
  saved: 'Link copied. Only people with access can open it.',
  accessUpdated: 'Access updated',
  accessFailed: 'Some changes may have been applied. Please refresh and try again.',
  linkCopied: 'Link copied',
  linkCreated: 'Link created',
  linkCreateFailed: 'Failed to create share link. Please try again.',
  linkRevoked: 'Link revoked',
  linkDeleted: 'Link deleted',
  linkRevokeFailed: 'Failed to revoke link. Please try again.',
  passwordCopied: 'Password copied',
  copyFailed: 'Failed to copy to the clipboard.',
  linksLoadFailed: 'Failed to load the links of this chat.',
  externalInfo:
    'Each link provides read-only access to selected chat content. Avoid sharing links that contain sensitive data.',
  revokeTitle: 'Revoke this link?',
  revokeText: "People who have this link will lose access. This can't be undone.",
  expirationInfo: 'After this time the link stops working',
};

export const LINK_SCOPES = {
  all: 'all',
  messages: 'messages',
  attachments: 'attachments',
  partial: 'partial',
};

export const WHICH_MESSAGES = {
  all: 'all',
  selected: 'selected',
};

export const DEFAULT_LINK_FORM = {
  includeMessages: true,
  includeAttachments: true,
  whichMessages: WHICH_MESSAGES.all,
  selectedIds: [],
  expiry: '7d',
  password: '',
};

export const MIN_PASSWORD_LENGTH = 8;
