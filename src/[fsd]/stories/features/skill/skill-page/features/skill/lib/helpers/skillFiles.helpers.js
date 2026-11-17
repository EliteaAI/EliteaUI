// Pure helpers for the files of a skill version: [{ path, size, binary, content }]

const folderOf = path => {
  const slash = path.lastIndexOf('/');
  return slash > 0 ? path.slice(0, slash) : '';
};

export const fileBaseName = path => path.slice(path.lastIndexOf('/') + 1);

export const fileFolderPrefix = path => {
  const folder = folderOf(path);
  return folder ? `${folder}/` : '';
};

// Folders first in the order they appear, then the files at the root
export const buildSkillFileTree = (files = []) => {
  const folders = [];
  const byName = {};
  const rootFiles = [];
  files.forEach(file => {
    const folder = folderOf(file.path);
    if (!folder) {
      rootFiles.push(file);
      return;
    }
    if (!byName[folder]) {
      byName[folder] = { name: folder, files: [] };
      folders.push(byName[folder]);
    }
    byName[folder].files.push(file);
  });
  return { folders, rootFiles };
};

export const countTextLines = text => (text ? text.split('\n').length : 0);

export const formatFileSize = bytes => {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

export const fileMetaLabel = file => {
  if (!file) return '';
  if (file.binary) return formatFileSize(file.size);
  const lines = countTextLines(file.content);
  return `${lines} ${lines === 1 ? 'line' : 'lines'}`;
};

// 1-based numbers of the instruction lines that mention the path
export const findMentionLines = (text, path) => {
  if (!text || !path) return [];
  return text
    .split('\n')
    .reduce((lines, line, index) => (line.includes(path) ? [...lines, index + 1] : lines), []);
};

const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);

// "References 2 · Scripts 7 · Assets 2 · Other 1": the line under the instructions in Settings
export const describeSkillFiles = (files = []) => {
  const { folders, rootFiles } = buildSkillFileTree(files);
  return [
    ...folders.map(folder => `${capitalize(folder.name)} ${folder.files.length}`),
    ...(rootFiles.length ? [`Other ${rootFiles.length}`] : []),
  ].join(' · ');
};
