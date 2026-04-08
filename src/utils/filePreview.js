import { AvailableFormatsEnum } from '@/[fsd]/features/artifacts/lib/constants/filePreviewCanvas.constants';
import { clearBaseUrlPrefix } from '@/common/utils';
import { getFileExtensionWithoutDot } from '@/utils/fileUtils';

/**
 * Utility functions for file preview functionality
 */

// File extensions that support preview
export const PREVIEWABLE_EXTENSIONS = [
  // Text files
  'txt',
  'text',

  // Markdown
  'md',
  'markdown',

  // JSON
  'json',

  // Programming languages
  'js',
  'jsx',
  'javascript',
  'ts',
  'tsx',
  'typescript',
  'py',
  'python',
  'java',
  'c',
  'cpp',
  'cxx',
  'cc',
  'h',
  'hpp',
  'cs',
  'csharp',
  'php',
  'rb',
  'ruby',
  'go',
  'rs',
  'rust',
  'kt',
  'kotlin',
  'swift',
  'r',
  'scala',
  'sh',
  'bash',
  'zsh',
  'ps1',
  'powershell',

  // Web technologies
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  'xml',

  // Configuration files
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'config',
  'env',
  'properties',

  // Documentation
  'rst',
  'tex',

  // Data formats
  'csv',
  'tsv',
  'jsonl',
  'ndjson',

  // BDD/Testing files
  'feature',
  'gherkin',

  // Log files - IMPORTANT ADDITION
  'log',
  'logs',

  // Additional programming languages
  'pl',
  'perl',
  'lua',
  'vim',
  'dart',

  // Additional markup and data formats
  'rdf',
  'owl',
  'n3',
  'ttl',
  'sparql',

  // Build and dependency files
  'gradle',
  'mvn',
  'pom',
  'cmake',
  'gyp',

  // Additional configuration formats
  'cfg',
  'cnf',
  'rc',
  'profile',
  'bashrc',
  'zshrc',
  'vimrc',
  'gitconfig',
  'npmrc',
  'yarnrc',

  // License and legal files
  'license',
  'licence',
  'copyright',
  'notice',
  'authors',
  'contributors',
  'changelog',
  'changes',
  'history',

  // Documentation formats
  'adoc',
  'asciidoc',
  'org',
  'wiki',

  // Database and query files
  'sql',
  'cql',
  'hql',
  'psql',

  // Container and deployment files
  'dockerignore',
  'k8s',
  'kube',
  'helm',

  // CI/CD files
  'jenkins',
  'jenkinsfile',
  'travis',
  'circleci',
  'github',
  'gitlab-ci',

  // Testing files
  'spec',
  'test',

  // Patch/Diff files
  'patch',
  'diff',

  // Diagram formats
  'mermaid',
  'mmd',
  'dot',
  'gv',
  'puml',
  'plantuml',

  // Web assembly and binary formats (text representations)
  'wat',
  'wast',

  // Protocol and schema files
  'proto',
  'protobuf',
  'thrift',
  'avsc',
  'avro',
  'xsd',
  'wsdl',

  // Other
  'dockerfile',
  'makefile',
  'gitignore',
  'editorconfig',
  'eslintrc',

  // Image files
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'ico',
  'svg',
  'tiff',
  'tif',
  'apng',
  'avif',
  'prettierrc',
  'babelrc',

  // DOC
  'docx',
];

/**
 * Check if a file can be previewed based on its extension or name
 * @param {string} filename - The name of the file
 * @returns {boolean} - Whether the file can be previewed
 */
export const canPreviewFile = filename => {
  if (!filename || typeof filename !== 'string') return false;

  // Check by extension first
  const extension = getFileExtensionWithoutDot(filename);

  if (extension && PREVIEWABLE_EXTENSIONS.includes(extension.toLowerCase())) {
    return true;
  }

  // Special case: files without extensions that are commonly text-based
  const filenameWithoutPath = filename.toLowerCase().split('/').pop() || '';
  const specialFiles = [
    // Common configuration files without extensions
    'dockerfile',
    'makefile',
    'gemfile',
    'rakefile',
    'vagrantfile',
    'procfile',
    'gruntfile',
    'gulpfile',
    'webpack',

    // Version control and Git files
    'gitignore',
    'gitattributes',
    'gitmodules',
    'gitkeep',

    // Documentation files
    'readme',
    'license',
    'licence',
    'copyright',
    'authors',
    'contributors',
    'changelog',
    'changes',
    'history',
    'news',
    'todo',
    'notice',

    // Configuration files
    'editorconfig',
    'prettierrc',
    'eslintrc',
    'babelrc',
    'npmrc',
    'yarnrc',
    'dockerignore',
    'gitignore',
    'npmignore',
    'eslintignore',

    // CI/CD files
    'jenkinsfile',
    'circleci',
    'travis',

    // Shell and system files
    'bashrc',
    'zshrc',
    'profile',
    'vimrc',
    'tmux',
    'screenrc',
  ];

  return specialFiles.includes(filenameWithoutPath);
};

/**
 * Map file extension or filename to CodeMirror language mode
 * @param {string} filename - The name of the file
 * @returns {string} - The CodeMirror language mode
 */
export const getLanguageFromFilename = filename => {
  const extension = getFileExtensionWithoutDot(filename);

  // Extension to language mapping
  const extensionMap = {
    // Text
    txt: 'text',
    text: 'text',

    // Markdown
    md: 'markdown',
    markdown: 'markdown',

    // JSON
    json: 'json',
    jsonl: 'json',
    ndjson: 'json',

    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'jsx',
    javascript: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    typescript: 'typescript',

    // Python
    py: 'python',
    python: 'python',

    // Java
    java: 'java',

    // C/C++
    c: 'cpp',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    h: 'cpp',
    hpp: 'cpp',

    // C#
    cs: 'csharp',
    csharp: 'csharp',

    // PHP
    php: 'php',

    // Ruby
    rb: 'ruby',
    ruby: 'ruby',

    // Go
    go: 'go',

    // Rust
    rs: 'rust',
    rust: 'rust',

    // Kotlin
    kt: 'kotlin',
    kotlin: 'kotlin',

    // Swift
    swift: 'swift',

    // R
    r: 'r',

    // Scala
    scala: 'scala',

    // Perl
    pl: 'perl',
    perl: 'perl',

    // Lua
    lua: 'lua',

    // Vim
    vim: 'vim',
    vimrc: 'vim',

    // Dart
    dart: 'dart',

    // Shell
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    bashrc: 'shell',
    zshrc: 'shell',
    profile: 'shell',

    // PowerShell
    ps1: 'powershell',
    powershell: 'powershell',

    // HTML
    html: 'html',
    htm: 'html',

    // CSS
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',

    // XML (excluding SVG which is treated as image)
    xml: 'xml',
    xsd: 'xml',
    wsdl: 'xml',

    // YAML
    yaml: 'yaml',
    yml: 'yaml',

    // TOML
    toml: 'toml',

    // Config files
    ini: 'ini',
    conf: 'ini',
    config: 'ini',
    cfg: 'ini',
    cnf: 'ini',
    rc: 'ini',
    npmrc: 'ini',
    yarnrc: 'ini',
    gitconfig: 'ini',
    env: 'shell',
    properties: 'properties',

    // Documentation
    rst: 'rst',
    tex: 'latex',
    adoc: 'text',
    asciidoc: 'text',
    org: 'text',
    wiki: 'text',

    // Data formats
    csv: 'csv',
    tsv: 'tsv',

    // Database/SQL
    sql: 'sql',
    cql: 'sql',
    hql: 'sql',
    psql: 'sql',

    // RDF/Semantic Web
    rdf: 'xml',
    owl: 'xml',
    n3: 'text',
    ttl: 'text',
    sparql: 'sql',

    // Log files - Important for debugging and monitoring
    log: 'text',
    logs: 'text',

    // Image files
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image',
    ico: 'image',
    svg: 'image',
    tiff: 'image',
    tif: 'image',
    apng: 'image',
    avif: 'image',

    // Build files
    gradle: 'text',
    mvn: 'xml',
    pom: 'xml',
    cmake: 'cmake',
    gyp: 'json',

    // License and documentation files
    license: 'text',
    licence: 'text',
    copyright: 'text',
    notice: 'text',
    authors: 'text',
    contributors: 'text',
    changelog: 'text',
    changes: 'text',
    history: 'text',

    // Testing
    spec: 'text',
    test: 'text',

    // CI/CD files
    jenkins: 'text',
    jenkinsfile: 'text',
    travis: 'yaml',
    circleci: 'yaml',
    github: 'yaml',
    'gitlab-ci': 'yaml',

    // Container files
    dockerignore: 'text',
    k8s: 'yaml',
    kube: 'yaml',
    helm: 'yaml',

    // Protocol/Schema files
    proto: 'text',
    protobuf: 'text',
    thrift: 'text',
    avsc: 'json',
    avro: 'json',

    // WebAssembly
    wat: 'text',
    wast: 'text',

    // Patch/Diff files
    patch: 'diff',
    diff: 'diff',

    // Diagram formats
    mermaid: 'mermaid',
    mmd: 'mermaid',
    dot: 'text',
    gv: 'text',
    puml: 'text',
    plantuml: 'text',

    // Special files (treat as shell/text)
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    gitignore: 'text',
    editorconfig: 'ini',
    eslintrc: 'json',
    prettierrc: 'json',
    babelrc: 'json',

    // DOCX
    docx: 'docx',
  };

  // Check by extension first
  if (extension) {
    const languageFromExtension = extensionMap[extension.toLowerCase()];
    if (languageFromExtension) {
      return languageFromExtension;
    }
  }

  // Special case: files without extensions
  const filenameWithoutPath = filename.toLowerCase().split('/').pop() || '';
  const specialFileLanguageMap = {
    // Build and configuration files
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    gemfile: 'ruby',
    rakefile: 'ruby',
    vagrantfile: 'ruby',
    procfile: 'yaml',
    gruntfile: 'javascript',
    gulpfile: 'javascript',
    webpack: 'javascript',

    // Documentation files (treat as markdown if common documentation names)
    readme: 'markdown',
    changelog: 'markdown',
    changes: 'markdown',
    history: 'markdown',
    news: 'markdown',
    todo: 'markdown',

    // License and legal files
    license: 'text',
    licence: 'text',
    copyright: 'text',
    notice: 'text',
    authors: 'text',
    contributors: 'text',

    // Configuration files
    editorconfig: 'ini',
    prettierrc: 'json',
    eslintrc: 'json',
    babelrc: 'json',
    npmrc: 'ini',
    yarnrc: 'ini',

    // Ignore files
    gitignore: 'text',
    dockerignore: 'text',
    npmignore: 'text',
    eslintignore: 'text',

    // Version control files
    gitattributes: 'text',
    gitmodules: 'text',
    gitkeep: 'text',
    gitconfig: 'ini',

    // CI/CD files
    jenkinsfile: 'text',
    circleci: 'yaml',
    travis: 'yaml',

    // Shell configuration files
    bashrc: 'shell',
    zshrc: 'shell',
    profile: 'shell',
    vimrc: 'vim',
    tmux: 'text',
    screenrc: 'text',
  };

  const specialLanguage = specialFileLanguageMap[filenameWithoutPath];
  if (specialLanguage) {
    return specialLanguage;
  }

  return 'text'; // Default fallback
};

/**
 * Parse a formatted file size string (like "1.2 MB") back to bytes
 * @param {string} sizeString - Formatted size string
 * @returns {number} - Size in bytes, or 0 if unable to parse
 */
export const parseFormattedFileSize = sizeString => {
  if (typeof sizeString !== 'string') {
    return 0;
  }

  // Updated pattern to handle both "3M" and "3MB" formats
  const sizePattern = /^(\d+(?:\.\d+)?)\s*([KMGT]?)B?$/i;
  const match = sizeString.trim().match(sizePattern);

  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = {
    '': 1, // No unit means bytes
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
    T: 1024 * 1024 * 1024 * 1024,
  };

  return Math.round(value * (multipliers[unit] || 1));
};

/**
 * Check if file size is within preview limits (handles both numbers and formatted strings)
 * @param {number|string} fileSize - File size in bytes (number) or formatted string
 * @returns {boolean} - Whether the file size is acceptable for preview
 */
export const isFileSizePreviewableFlexible = file => {
  const fileSize = file.size;

  const isDocxFile =
    file && [AvailableFormatsEnum.DOCX].some(f => file?.name?.toLowerCase()?.endsWith(`.${f}`));

  let sizeInBytes;

  if (isDocxFile) return true;

  if (typeof fileSize === 'number') {
    sizeInBytes = fileSize;
  } else if (typeof fileSize === 'string') {
    sizeInBytes = parseFormattedFileSize(fileSize);
  } else {
    // If size is unknown/invalid, allow preview (be permissive)
    return true;
  }

  return sizeInBytes <= getPreviewSizeLimit();
};

/**
 * Get appropriate file size limit for preview (in bytes)
 * Large files should not be previewed for performance reasons
 * @returns {number} - Maximum file size in bytes (2MB)
 */
export const getPreviewSizeLimit = () => {
  return 2 * 1024 * 1024; // 2MB
};

/**
 * Check if file size is within preview limits
 * @param {number} sizeInBytes - File size in bytes
 * @returns {boolean} - Whether the file size is acceptable for preview
 */
export const isFileSizePreviewable = sizeInBytes => {
  if (typeof sizeInBytes !== 'number' || sizeInBytes < 0) {
    return false;
  }

  return sizeInBytes <= getPreviewSizeLimit();
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = bytes => {
  if (typeof bytes !== 'number' || bytes < 0) {
    return '0 B';
  }

  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

// Re-export from centralized utility to maintain API compatibility
export { isFileObjectImage as isImageFile } from '@/utils/attachmentImageUtils';

/**
 * Get image URL for preview
 * @param {Object} file - File object
 * @param {string} projectId - Project ID
 * @param {string} bucket - Bucket name
 * @returns {string} - URL for image preview
 */
export const getImagePreviewUrl = (file, projectId, bucket) => {
  if (!file || !projectId || !bucket) return '';

  const { VITE_SERVER_URL, DEV, VITE_DEV_TOKEN } = import.meta.env;
  let url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}/artifacts/artifact/default/${projectId}/${encodeURI(bucket)}/${encodeURI(file.name)}`;

  // Add authentication token as query parameter in development
  if (DEV && VITE_DEV_TOKEN) {
    url += `?auth=${encodeURIComponent(VITE_DEV_TOKEN)}`;
  }

  return url;
};
