export const SKILL_EDITOR_VIEWS = {
  settings: 'settings',
  files: 'files',
};

export const SKILL_FILES_SEARCH_PARAMS = {
  view: 'view',
  file: 'file',
  panel: 'panel',
};

export const SKILL_SIDE_PANELS = {
  instructions: 'instructions',
  test: 'test',
};

export const SKILL_MD_FILE_NAME = 'SKILL.md';

// Larger text files would freeze the code editor; they open as a card with Download, like binaries
export const SKILL_FILE_PREVIEW_MAX_BYTES = 1024 * 1024;

// The backend refuses file writes on these versions
export const SKILL_FILES_READ_ONLY_STATUSES = ['published', 'embedded'];

export const SKILL_FILE_ACTIONS = {
  rename: 'rename',
  replace: 'replace',
  download: 'download',
  copyPath: 'copyPath',
  delete: 'delete',
  renameFolder: 'renameFolder',
  uploadHere: 'uploadHere',
  deleteFolder: 'deleteFolder',
};

export const SKILL_COMPARE_FILE_STATUS = {
  changed: 'changed',
  new: 'new',
  removed: 'removed',
  replaced: 'replaced',
  same: 'same',
};

export const SKILL_COMPARE_FILE_STATUS_LABELS = {
  [SKILL_COMPARE_FILE_STATUS.changed]: 'Changed',
  [SKILL_COMPARE_FILE_STATUS.new]: 'New',
  [SKILL_COMPARE_FILE_STATUS.removed]: 'Removed',
  [SKILL_COMPARE_FILE_STATUS.replaced]: 'Replaced',
};
