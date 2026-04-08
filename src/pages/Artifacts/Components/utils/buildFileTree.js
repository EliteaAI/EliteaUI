/**
 * Transforms a flat list of S3 object keys into a hierarchical tree structure
 * @param {Array<{key: string, lastModified: string, size: number, storageClass: string}>} contents - Flat list of S3 objects
 * @returns {Array} Tree structure of files and folders
 */
export const buildFileTree = (contents = []) => {
  const root = {};

  contents.forEach(item => {
    const parts = item.key.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;

      if (!current[part]) {
        current[part] = isFile
          ? {
              name: part,
              key: item.key,
              isFile: true,
              lastModified: item.lastModified,
              size: item.size,
              storageClass: item.storageClass,
              children: null,
            }
          : {
              name: part,
              key: parts.slice(0, index + 1).join('/') + '/',
              isFile: false,
              children: {},
            };
      }

      if (!isFile) {
        current = current[part].children;
      }
    });
  });

  // Convert object structure to array structure recursively
  const convertToArray = obj => {
    return Object.values(obj)
      .map(item => ({
        ...item,
        children: item.children ? convertToArray(item.children) : null,
      }))
      .sort((a, b) => {
        // Folders first, then files
        if (a.isFile !== b.isFile) {
          return a.isFile ? 1 : -1;
        }
        // Alphabetically by name
        return a.name.localeCompare(b.name);
      });
  };

  return convertToArray(root);
};

/**
 * Gets the display name from a file key (last part of the path)
 * @param {string} key - Full S3 object key
 * @returns {string} Display name
 */
export const getDisplayName = key => {
  if (!key) return '';
  const parts = key.split('/').filter(Boolean);
  return parts[parts.length - 1] || key;
};
