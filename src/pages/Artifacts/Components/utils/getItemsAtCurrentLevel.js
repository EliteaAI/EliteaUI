import { ARTIFACT_TYPES } from '@/pages/Artifacts/component/constants';

/**
 * Transforms a flat S3 contents list into items at the specified directory level
 * Handles both files and folders based on key paths
 * @param {Array<{key: string, lastModified: string, etag: string, size: number, storageClass: string}>} contents - Flat list of S3 objects
 * @param {string} prefix - Current directory prefix (e.g., 'folder1/' or 'folder1/subfolder/')
 * @returns {Array} Items at current directory level (folders first, then files, both alphabetically sorted)
 */
export const getItemsAtCurrentLevel = (contents, prefix = '') => {
  if (!Array.isArray(contents) || contents.length === 0) {
    return [];
  }
  const items = [];
  const folderNames = new Set();

  contents.forEach(item => {
    const { key } = item;

    // Skip items that don't start with the current prefix
    if (!key.startsWith(prefix)) {
      return;
    }

    // Get the remaining path after the prefix
    const remainingPath = key.slice(prefix.length);
    const parts = remainingPath.split('/').filter(Boolean);

    if (parts.length === 0) {
      // This is the prefix itself (a folder marker), skip it
      return;
    }

    if (parts.length === 1) {
      // Direct file at this level
      items.push({
        ...item,
        name: parts[0],
        isFile: true,
        type: 'File',
      });
    } else {
      // Item in subfolder - add the immediate folder as an item
      const folderName = parts[0];
      if (!folderNames.has(folderName)) {
        folderNames.add(folderName);
        items.push({
          key: `${prefix}${folderName}/`,
          name: folderName,
          isFile: false,
          type: 'Folder',
          size: 0,
          lastModified: null,
          storageClass: 'FOLDER',
        });
      }
    }
  });

  // Sort: folders first, then files, both alphabetically
  return items.sort((a, b) => {
    // Folders come first
    if (a.isFile !== b.isFile) {
      return a.isFile ? 1 : -1;
    }
    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};

export const parsePrefixToBreadcrumbs = prefix => {
  if (!prefix) return [];

  const parts = prefix.split('/').filter(Boolean);
  return parts.map((part, index) => ({
    name: part,
    path: parts.slice(0, index + 1).join('/') + '/',
  }));
};

export const getItemsUnderFolder = (contents, folderKey) => {
  if (!Array.isArray(contents) || !folderKey) {
    return [];
  }
  // Find all items that start with the folder prefix, excluding the folder key itself
  return contents
    .filter(item => item.key.startsWith(folderKey) && item.key !== folderKey)
    .map(item => item.key);
};

export const expandFoldersToAllItems = (selectedItems, bucketContents) => {
  return selectedItems.reduce((itemKeys, item) => {
    if (item.type === ARTIFACT_TYPES.FOLDER) {
      const itemsInFolder = getItemsUnderFolder(bucketContents, item.key);
      itemKeys.push(...itemsInFolder);
    } else {
      itemKeys.push(item.key);
    }

    return itemKeys;
  }, []);
};
