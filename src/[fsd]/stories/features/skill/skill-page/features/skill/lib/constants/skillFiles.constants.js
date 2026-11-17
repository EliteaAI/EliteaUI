// The left zone of the skill editor: the skill's settings or its files. Instructions stay on the right in both.
export const SKILL_EDITOR_VIEWS = {
  settings: 'settings',
  files: 'files',
};

// Search params that open the page on a view and a file (links in the instructions, deep links)
export const SKILL_FILES_SEARCH_PARAMS = {
  view: 'view',
  file: 'file',
  panel: 'panel',
};

// What opens on the right of the open file in Files, one at a time; Test also opens beside the instructions in Settings
export const SKILL_SIDE_PANELS = {
  instructions: 'instructions',
  test: 'test',
};

export const SKILL_MD_FILE_NAME = 'SKILL.md';

// The counter turns to a warning at this share of the instructions limit
export const INSTRUCTIONS_WARNING_SHARE = 0.9;

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
