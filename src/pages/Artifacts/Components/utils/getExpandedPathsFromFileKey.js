/**
 * Calculate expanded paths from a file or folder key
 * This is used to auto-expand folders in the file tree when a nested file or folder is selected
 * @param {string} key - The full file or folder path (e.g., 'folder1/folder2/file.txt' or 'folder1/folder2/')
 * @returns {string[]} Array of folder paths that should be expanded (e.g., ['folder1/', 'folder1/folder2/'])
 */
export const getExpandedPathsFromFileKey = key => {
  if (!key || typeof key !== 'string') return [];

  const parts = key.split('/').filter(Boolean);
  const paths = [];

  // Build paths for each folder level
  // For files (no trailing /), exclude the file itself
  // For folders (with trailing /), include all parts
  const isFolder = key.endsWith('/');
  const limit = isFolder ? parts.length : parts.length - 1;

  for (let i = 0; i < limit; i++) {
    const path = parts.slice(0, i + 1).join('/') + '/';
    paths.push(path);
  }

  return paths;
};
