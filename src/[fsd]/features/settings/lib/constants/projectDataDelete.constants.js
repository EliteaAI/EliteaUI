export const PROJECT_DATA_TYPE = {
  chats: 'chats',
  agents: 'agents',
  pipelines: 'pipelines',
  skills: 'skills',
  toolkits: 'toolkits',
  mcps: 'mcps',
  credentials: 'credentials',
};

export const CREDENTIALS_TOOLTIP =
  'Credentials, tokens, and other secrets are excluded from project backups and cannot be restored from them. Ensure you can recreate required credentials before deleting them.';

export const SKIP_REASON = {
  published: {
    hint: 'published, will be skipped',
    note: 'published or embedded will be skipped; unpublish them first',
  },
  internal: {
    hint: 'will be skipped',
    note: 'created by ELITEA for internal use (e.g. S3 access keys) will be kept',
  },
};

// Types the section offers, in display order (also the order the backend deletes them in)
export const PROJECT_DATA_TYPES = [
  { key: PROJECT_DATA_TYPE.chats, label: 'Chats' },
  { key: PROJECT_DATA_TYPE.agents, label: 'Agents', skipReason: SKIP_REASON.published },
  { key: PROJECT_DATA_TYPE.pipelines, label: 'Pipelines', skipReason: SKIP_REASON.published },
  { key: PROJECT_DATA_TYPE.skills, label: 'Skills', skipReason: SKIP_REASON.published },
  { key: PROJECT_DATA_TYPE.toolkits, label: 'Toolkits' },
  { key: PROJECT_DATA_TYPE.mcps, label: 'MCPs' },
  {
    key: PROJECT_DATA_TYPE.credentials,
    label: 'Credentials',
    tooltip: CREDENTIALS_TOOLTIP,
    skipReason: SKIP_REASON.internal,
  },
];

export const CONFIRMATION_VALUE = 'DELETE';

export const SECTION_DESCRIPTION =
  'Permanently delete all items of the selected types from this project. In team projects, this includes items created by other project members. The project itself will not be deleted.';

export const SECTION_TOOLTIP =
  'Deletes all project-owned items of the selected types, not just your own items, including copies taken from other projects. Data stored in other projects is not deleted.';

export const CHATS_RESTORE_NOTE =
  'Chats and attachments can only be restored if they were included in the backup.';

export const CREDENTIALS_WARNING = 'Toolkits and MCPs that use these credentials will stop working.';

export const COUNT_UNAVAILABLE = '–';
