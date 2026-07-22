export const PERMISSION_OPTIONS = {
  READ_WRITE: 'read_write',
  READ: 'read',
  NO_ACCESS: 'no_access',
};

export const ADD_EXCEPTION_OPTIONS = [
  { value: PERMISSION_OPTIONS.READ, label: 'Read-only' },
  { value: PERMISSION_OPTIONS.NO_ACCESS, label: 'No access' },
];

export const EDIT_EXCEPTION_OPTIONS = [
  { value: PERMISSION_OPTIONS.READ_WRITE, label: 'Read/write (default)' },
  { value: PERMISSION_OPTIONS.READ, label: 'Read-only' },
  { value: PERMISSION_OPTIONS.NO_ACCESS, label: 'No access' },
];
