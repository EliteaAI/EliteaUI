import { getFileExtensionLowerCase } from '@/utils/fileUtils';

/**
 * Utility functions for file type detection and display
 */

/**
 * Map file extension to full type name
 * @param {string} filename - The name of the file
 * @returns {string} - The full file type name
 */
export const getFileTypeName = filename => {
  const extension = getFileExtensionLowerCase(filename);

  // Extension to full type name mapping
  const typeMap = {
    // Text files
    txt: 'Text',
    text: 'Text',

    // Markdown
    md: 'Markdown',
    markdown: 'Markdown',

    // JSON
    json: 'JSON',

    // JavaScript/TypeScript
    js: 'JavaScript',
    jsx: 'JavaScript (JSX)',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript (TSX)',
    typescript: 'TypeScript',

    // Python
    py: 'Python',
    python: 'Python',

    // Java
    java: 'Java',

    // C/C++
    c: 'C',
    cpp: 'C++',
    cxx: 'C++',
    cc: 'C++',
    h: 'C Header',
    hpp: 'C++ Header',

    // C#
    cs: 'C#',
    csharp: 'C#',

    // PHP
    php: 'PHP',

    // Ruby
    rb: 'Ruby',
    ruby: 'Ruby',

    // Go
    go: 'Go',

    // Rust
    rs: 'Rust',
    rust: 'Rust',

    // Kotlin
    kt: 'Kotlin',
    kotlin: 'Kotlin',

    // Swift
    swift: 'Swift',

    // R
    r: 'R',

    // Scala
    scala: 'Scala',

    // Shell scripts
    sh: 'Shell Script',
    bash: 'Bash Script',
    zsh: 'Zsh Script',
    ps1: 'PowerShell',
    powershell: 'PowerShell',

    // Web technologies
    html: 'HTML',
    htm: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    less: 'Less',
    xml: 'XML',
    svg: 'SVG',

    // Configuration files
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    ini: 'INI',
    conf: 'Configuration',
    config: 'Configuration',
    env: 'Environment',
    properties: 'Properties',

    // Documentation
    rst: 'reStructuredText',
    tex: 'LaTeX',

    // Data formats
    csv: 'CSV',
    tsv: 'TSV',
    sql: 'SQL',

    // Testing/BDD files
    feature: 'Feature File',
    gherkin: 'Gherkin',

    // Patch/Diff files
    patch: 'Patch File',
    diff: 'Diff File',

    // Archives
    zip: 'ZIP Archive',
    tar: 'TAR Archive',
    gz: 'Gzip Archive',
    rar: 'RAR Archive',
    '7z': '7-Zip Archive',

    // Images
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    png: 'PNG Image',
    gif: 'GIF Image',
    bmp: 'BMP Image',
    webp: 'WebP Image',
    ico: 'Icon',

    // Documents
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',

    // Audio
    mp3: 'MP3 Audio',
    wav: 'WAV Audio',
    flac: 'FLAC Audio',
    ogg: 'OGG Audio',

    // Video
    mp4: 'MP4 Video',
    avi: 'AVI Video',
    mkv: 'MKV Video',
    mov: 'QuickTime Video',
    wmv: 'WMV Video',

    // Special files
    dockerfile: 'Dockerfile',
    makefile: 'Makefile',
    gitignore: 'Git Ignore',
    editorconfig: 'Editor Config',
    eslintrc: 'ESLint Config',
    prettierrc: 'Prettier Config',
    babelrc: 'Babel Config',

    // Log files
    log: 'Log File',
    logs: 'Log File',

    // Additional programming languages
    pl: 'Perl',
    perl: 'Perl',
    lua: 'Lua',
    vim: 'Vim Script',
    dart: 'Dart',

    // Data formats
    jsonl: 'JSON Lines',
    ndjson: 'Newline Delimited JSON',

    // Build files
    gradle: 'Gradle Build',
    mvn: 'Maven',
    pom: 'Maven POM',
    cmake: 'CMake',

    // License and documentation
    license: 'License',
    licence: 'License',
    copyright: 'Copyright',
    changelog: 'Changelog',
    readme: 'README',

    // Additional config formats
    cfg: 'Config File',
    cnf: 'Config File',
    rc: 'RC File',
    profile: 'Profile',
    bashrc: 'Bash RC',
    zshrc: 'Zsh RC',
    vimrc: 'Vim RC',
    gitconfig: 'Git Config',
    npmrc: 'NPM Config',
    yarnrc: 'Yarn Config',

    // Documentation formats
    adoc: 'AsciiDoc',
    asciidoc: 'AsciiDoc',
    org: 'Org Mode',
    wiki: 'Wiki',

    // Database files
    cql: 'Cassandra Query Language',
    hql: 'Hive Query Language',
    psql: 'PostgreSQL',

    // RDF/Semantic Web
    rdf: 'RDF',
    owl: 'OWL Ontology',
    n3: 'Notation3',
    ttl: 'Turtle',
    sparql: 'SPARQL',

    // Protocol files
    proto: 'Protocol Buffer',
    protobuf: 'Protocol Buffer',
    thrift: 'Apache Thrift',
    avsc: 'Avro Schema',
    avro: 'Avro',

    // Container files
    dockerignore: 'Docker Ignore',
    k8s: 'Kubernetes',
    kube: 'Kubernetes',
    helm: 'Helm Chart',

    // CI/CD files
    jenkins: 'Jenkins',
    jenkinsfile: 'Jenkinsfile',
    travis: 'Travis CI',
    circleci: 'CircleCI',
    github: 'GitHub Actions',
    'gitlab-ci': 'GitLab CI',

    // WebAssembly
    wat: 'WebAssembly Text',
    wast: 'WebAssembly Script',

    // Schema files
    xsd: 'XML Schema',
    wsdl: 'WSDL',

    // Diagram formats
    mermaid: 'Mermaid Diagram',
    mmd: 'Mermaid Diagram',
    dot: 'Graphviz',
    gv: 'Graphviz',
    puml: 'PlantUML',
    plantuml: 'PlantUML',
  };

  return typeMap[extension] || (extension ? extension.toUpperCase() : 'Unknown');
};

/**
 * Get file type icon name/class based on extension
 * @param {string} filename - The name of the file
 * @returns {string} - Icon identifier for the file type
 */
export const getFileTypeIcon = filename => {
  const extension = getFileExtensionLowerCase(filename);

  // Extension to icon mapping
  const iconMap = {
    // Code files
    js: 'code',
    jsx: 'code',
    ts: 'code',
    tsx: 'code',
    py: 'code',
    java: 'code',
    php: 'code',
    rb: 'code',
    go: 'code',
    rs: 'code',
    c: 'code',
    cpp: 'code',
    cs: 'code',

    // Text/Markdown
    md: 'text',
    txt: 'text',
    rst: 'text',

    // Data/Config
    json: 'data',
    yaml: 'data',
    yml: 'data',
    xml: 'data',
    csv: 'data',
    sql: 'data',

    // Images
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    bmp: 'image',
    webp: 'image',

    // Documents
    pdf: 'document',
    doc: 'document',
    docx: 'document',
    xls: 'document',
    xlsx: 'document',
    ppt: 'document',
    pptx: 'document',

    // Archives
    zip: 'archive',
    tar: 'archive',
    gz: 'archive',
    rar: 'archive',
    '7z': 'archive',

    // Audio/Video
    mp3: 'audio',
    wav: 'audio',
    mp4: 'video',
    avi: 'video',
    mkv: 'video',
  };

  return iconMap[extension] || 'file';
};
