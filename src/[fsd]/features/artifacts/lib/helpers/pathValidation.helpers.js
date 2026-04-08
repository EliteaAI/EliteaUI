const SECURITY_CONFIG = {
  MAX_FOLDER_DEPTH: 10,
  FORBIDDEN_PATTERNS: [
    '..', // Parent directory traversal
    '../', // Parent directory traversal with slash
    '/..', // Absolute parent directory traversal
    '/../', // Absolute parent directory traversal with slash
    '\\..', // Windows-style parent directory traversal
    '\\..\\', // Windows-style parent directory traversal with backslash
    '%2e%2e', // URL-encoded parent directory traversal
    '%2E%2E', // URL-encoded parent directory traversal (uppercase)
    '~', // Home directory reference
    '\\', // Backslash (Windows path separator - not allowed)
  ],
  FORBIDDEN_SEGMENTS: [
    '.', // Current directory reference
    '..', // Parent directory reference
    '', // Empty segment (double slashes)
  ],
  VALID_SEGMENT_PATTERN: /^[a-zA-Z0-9._-]+$/,
  FORBIDDEN_CHARACTERS: [':', '*', '?', '"', '<', '>', '|', '\0'],
};

const sanitizeAndValidatePath = (path, currentPrefix = '') => {
  if (!path || typeof path !== 'string') return '';

  const validationError = validateFolderPath(path, currentPrefix);
  if (validationError) return null;

  const normalizedPath = path
    .replace(/\\/g, '/') // Convert backslashes to forward slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+$/, '') // Remove trailing slashes
    .replace(/\/+/g, '/'); // Replace multiple slashes with single slash

  return normalizedPath;
};

const isValidPathSegment = segment => {
  if (!segment || typeof segment !== 'string') return false;

  if (SECURITY_CONFIG.FORBIDDEN_SEGMENTS.includes(segment)) return false;
  if (SECURITY_CONFIG.FORBIDDEN_CHARACTERS.some(char => segment.includes(char))) return false;
  if (segment === '.' || segment === '..' || /^\.+$/.test(segment)) return false;
  if (!SECURITY_CONFIG.VALID_SEGMENT_PATTERN.test(segment)) return false;
  if (/^\.\./.test(segment)) return false;

  return true;
};

export const validateFolderPath = (path, currentPrefix = '') => {
  if (!path) return '';

  const normalizedPath = path.toLowerCase().replace(/\\/g, '/');

  for (const pattern of SECURITY_CONFIG.FORBIDDEN_PATTERNS) {
    if (normalizedPath.includes(pattern.toLowerCase()))
      return `Path contains forbidden pattern "${pattern}". Path traversal is not allowed.`;
  }

  if (path.startsWith('/') || path.startsWith('\\'))
    return 'Absolute paths are not allowed. Path must be relative to current location.';

  if (path.includes('//') || path.includes('\\\\')) return 'Path must not contain consecutive separators.';

  const getCurrentDepth = prefix => (prefix ? prefix.split('/').filter(Boolean).length : 0);

  const currentDepth = getCurrentDepth(currentPrefix);

  const pathToValidate = path.endsWith('/') ? path.slice(0, -1) : path;
  const segments = pathToValidate.split('/').filter(segment => segment !== '');
  const totalDepth = currentDepth + segments.length;

  if (totalDepth > SECURITY_CONFIG.MAX_FOLDER_DEPTH)
    return `Maximum folder depth is ${SECURITY_CONFIG.MAX_FOLDER_DEPTH} levels. Current location already has ${currentDepth} level(s). Cannot add ${segments.length} more.`;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (!isValidPathSegment(segment)) {
      if (segment === '.' || segment === '..')
        return `"${segment}" is not allowed. Relative path references are forbidden for security reasons.`;

      if (SECURITY_CONFIG.FORBIDDEN_CHARACTERS.some(char => segment.includes(char))) {
        const forbiddenChar = SECURITY_CONFIG.FORBIDDEN_CHARACTERS.find(char => segment.includes(char));
        return `"${segment}" contains forbidden character "${forbiddenChar}". Only letters, numbers, dots, hyphens, and underscores are allowed.`;
      }

      return `"${segment}" contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed.`;
    }
  }

  return '';
};

export const computeSecurePath = (folderPath, currentPrefix = '') => {
  const validationError = validateFolderPath(folderPath, currentPrefix);

  if (validationError) throw new Error(`Invalid path: ${validationError}`);

  const sanitizedPath = sanitizeAndValidatePath(folderPath, currentPrefix);

  if (sanitizedPath === null) throw new Error('Path could not be sanitized safely');
  if (currentPrefix && sanitizedPath) return `${currentPrefix.replace(/\/+$/, '')}/${sanitizedPath}`;
  if (currentPrefix) return currentPrefix.replace(/\/+$/, '');
  if (sanitizedPath) return sanitizedPath;

  return '';
};

export const isSecureUploadPath = folderPath => {
  if (!folderPath) return true;

  const path = folderPath.toLowerCase();
  const dangerousPatterns = ['..', '~', '\\', '%2e', '%2f'];

  if (dangerousPatterns.some(pattern => path.includes(pattern))) return false;
  if (folderPath.startsWith('/') || folderPath.startsWith('\\')) return false;
  return true;
};

// Characters that cause actual problems in HTTP paths or S3 keys when used in filenames.
// More permissive than VALID_SEGMENT_PATTERN (which is for folder paths) — spaces, parentheses, etc. are fine.
export const FORBIDDEN_FILENAME_CHARS = [
  ...SECURITY_CONFIG.FORBIDDEN_CHARACTERS, // :  *  ?  "  <  >  |  \0
  '#', // Fragment separator — breaks URL routing, causes 403 on the backend
  '~', // Home directory reference — security risk
  '/', // Path separator — would escape the intended folder
  '\\', // Windows path separator
];

export const FORBIDDEN_FILENAME_HINT = `Forbidden symbols: # ~ .. / \\ ${SECURITY_CONFIG.FORBIDDEN_CHARACTERS.filter(c => c !== '\0').join(' ')}`;

export const validateFileName = name => {
  if (!name || typeof name !== 'string') return 'Filename is empty or invalid.';

  if (name.includes('..'))
    return 'Filenames cannot contain consecutive dots (..). Please rename your file and try again.';

  const forbiddenChar = FORBIDDEN_FILENAME_CHARS.find(c => name.includes(c));
  if (forbiddenChar)
    return `Filenames cannot contain "${forbiddenChar}". Please rename your file and try again.`;

  return '';
};
