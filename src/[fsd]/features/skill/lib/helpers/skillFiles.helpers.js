import { SKILL_RUN_SEARCH_PARAMS } from '../constants/skill.constants';
import { SKILL_FILES_SEARCH_PARAMS } from '../constants/skillFiles.constants';

const PATH_CHAR = /[\w\-/]/;
const WORD_CHAR = /\w/;

const compareNames = (left, right) =>
  left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });

const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);

export const BYTE_ORDER_MARK = '\uFEFF';

export const withoutByteOrderMark = text => (text?.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);

export const fileBaseName = path => path.slice(path.lastIndexOf('/') + 1);

const createFolder = (path, name) => ({ path, name, folders: [], files: [] });

const sortFolder = folder => {
  folder.folders.sort((left, right) => compareNames(left.name, right.name)).forEach(sortFolder);
  folder.files.sort((left, right) => compareNames(left.path, right.path));
  return folder;
};

export const buildSkillFileTree = (files = []) => {
  const root = createFolder('', '');
  const folders = { '': root };
  files.forEach(file => {
    const segments = file.path.split('/');
    let parent = root;
    segments.slice(0, -1).forEach(segment => {
      const path = parent.path ? `${parent.path}/${segment}` : segment;
      if (!folders[path]) {
        folders[path] = createFolder(path, segment);
        parent.folders.push(folders[path]);
      }
      parent = folders[path];
    });
    parent.files.push(file);
  });
  return sortFolder(root);
};

export const countFolderFiles = folder =>
  folder.files.length + folder.folders.reduce((total, child) => total + countFolderFiles(child), 0);

export const describeSkillFiles = (files = []) => {
  const root = buildSkillFileTree(files);
  return [
    ...root.folders.map(folder => `${capitalize(folder.name)} ${countFolderFiles(folder)}`),
    ...(root.files.length ? [`Other ${root.files.length}`] : []),
  ].join(' · ');
};

export const isPathInFolder = (path, folderPath) => path.startsWith(`${folderPath}/`);

export const pathsOverlap = (path, otherPath) => {
  const lower = path.toLowerCase();
  const otherLower = otherPath.toLowerCase();
  return lower === otherLower || isPathInFolder(otherLower, lower) || isPathInFolder(lower, otherLower);
};

export const findSkillFile = (files = [], path) => {
  if (!path) return null;
  const lowerPath = path.toLowerCase();
  return (
    files.find(file => file.path === path) ||
    files.find(file => file.path.toLowerCase() === lowerPath) ||
    null
  );
};

const startsAtBoundary = (text, index) => {
  if (index === 0) return true;
  const before = text[index - 1];
  if (before === '/') return text.slice(Math.max(0, index - 2), index) === './';
  return !PATH_CHAR.test(before) && before !== '.';
};

const endsAtBoundary = (text, end) => {
  const after = text[end];
  if (after === undefined) return true;
  if (after === '.') return !WORD_CHAR.test(text[end + 1] ?? '');
  return !PATH_CHAR.test(after);
};

/** Every mention of a skill file as a whole path, in text order. */
export const findPathMentions = (text, paths = []) => {
  if (!text) return [];
  const mentions = [];
  paths.forEach(path => {
    for (let index = text.indexOf(path); index !== -1; index = text.indexOf(path, index + 1)) {
      const end = index + path.length;
      if (startsAtBoundary(text, index) && endsAtBoundary(text, end))
        mentions.push({ path, from: index, to: end });
    }
  });
  return mentions.sort((left, right) => left.from - right.from);
};

/** 1-based numbers of the instruction lines that mention the path as a whole path. */
export const findMentionLines = (text, path) => {
  if (!text || !path) return [];
  return text
    .split('\n')
    .reduce(
      (lines, line, index) => (findPathMentions(line, [path]).length ? [...lines, index + 1] : lines),
      [],
    );
};

/** The skill file a Markdown link points at, or null for any other link. */
export const resolveFileLink = (files, href) => {
  if (!href || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('/')) return null;
  const [withoutFragment] = href.split(/[?#]/);
  let path = withoutFragment.replace(/^\.\//, '');
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  return findSkillFile(files, path);
};

const RUN_VERSION_KEPT_PARAMS = [SKILL_FILES_SEARCH_PARAMS.view, SKILL_FILES_SEARCH_PARAMS.panel];

/** The address of a run opened on its own version: the tab and the side panel stay, the open file may not exist there. */
export const buildRunVersionSearch = (searchParams, conversationId) => {
  const search = new URLSearchParams({ [SKILL_RUN_SEARCH_PARAMS.run]: String(conversationId) });
  RUN_VERSION_KEPT_PARAMS.filter(key => searchParams.get(key)).forEach(key =>
    search.set(key, searchParams.get(key)),
  );
  return search;
};
