// Versions of the saved story screenshots from git: every commit that changed a baseline PNG is a version (v1 is the
// first). Stories import them from 'virtual:screenshot-history'; the images of old versions are read with git show,
// served under /screenshot-history/ in dev and emitted there by the build. A baseline changed but not committed yet
// is the last version, marked uncommitted. The build needs the whole history (CI: fetch-depth 0).
import { execFileSync } from 'child_process';
import { unwatchFile, watchFile } from 'fs';
import { basename, join } from 'path';

const VIRTUAL_ID = 'virtual:screenshot-history';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const URL_DIR = 'screenshot-history';
const BASELINES = ':(glob)src/**/__screenshots__/*.png';
const RECORD = '\x1e';
const FIELD = '\x1f';

const git = (root, args, encoding = 'utf8') =>
  execFileSync('git', args, {
    cwd: root,
    encoding,
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

const tryGit = (root, args) => {
  try {
    return git(root, args).trim();
  } catch {
    return null;
  }
};

const readFileVersions = (root, file) => {
  const log = tryGit(root, [
    'log',
    '--follow',
    `--format=${RECORD}%H${FIELD}%ad${FIELD}%an${FIELD}%s`,
    '--date=short',
    '--name-only',
    '--',
    file,
  ]);
  const commits = (log || '')
    .split(RECORD)
    .filter(Boolean)
    .map(entry => {
      const [header, ...paths] = entry.trim().split('\n');
      const [sha, date, author, subject] = header.split(FIELD);
      return { sha, date, author, subject, path: paths.find(Boolean) };
    })
    // A merge lists no file, a deleting commit has no image
    .filter(({ sha, path }) => path && tryGit(root, ['cat-file', '-e', `${sha}:${path}`]) !== null)
    .reverse();

  const versions = commits.map(({ sha, date, author, subject, path }, index) => ({
    version: index + 1,
    date,
    author,
    subject,
    url: `${URL_DIR}/${sha.slice(0, 12)}/${basename(path)}`,
    sha,
    path,
  }));

  const committedBlob = tryGit(root, ['rev-parse', `HEAD:${file}`]);
  const workingBlob = tryGit(root, ['hash-object', file]);
  if (workingBlob && workingBlob !== committedBlob) {
    versions.push({ version: versions.length + 1, uncommitted: true });
  }
  return versions;
};

const readHistory = root => {
  const files = (tryGit(root, ['ls-files', '-co', '--exclude-standard', '--', BASELINES]) || '')
    .split('\n')
    .filter(Boolean);
  return Object.fromEntries(files.map(file => [basename(file), readFileVersions(root, file)]));
};

// What the stories get: no git paths or full hashes
const toModule = history =>
  `export default ${JSON.stringify(
    Object.fromEntries(
      Object.entries(history).map(([name, versions]) => [
        name,
        versions.map(({ sha, path, ...version }) => ({ ...version, commit: sha?.slice(0, 8) })),
      ]),
    ),
  )};`;

// Older versions only: the newest one is the saved file, which the stories import themselves
const olderVersions = history =>
  Object.values(history).flatMap(versions => versions.slice(0, -1).filter(version => version.sha));

export const screenshotHistory = (root = process.cwd()) => {
  let history = null;
  const getHistory = () => (history ??= readHistory(root));

  return {
    name: 'elitea-screenshot-history',
    resolveId: id => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load: id => (id === RESOLVED_ID ? toModule(getHistory()) : null),

    configureServer(server) {
      const refresh = () => {
        history = null;
        const module = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (!module) return;
        server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      // New shots change the files; a commit changes only git, so its log is polled
      server.watcher.on('all', (event, file) => /__screenshots__[/\\].+\.png$/.test(file) && refresh());
      const gitLog = join(root, '.git', 'logs', 'HEAD');
      watchFile(gitLog, { interval: 2000 }, refresh);
      server.httpServer?.on('close', () => unwatchFile(gitLog, refresh));

      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\//, '');
        if (!url.startsWith(`${URL_DIR}/`)) return next();
        const version = olderVersions(getHistory()).find(item => item.url === url);
        if (!version) return next();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(git(root, ['show', `${version.sha}:${version.path}`], 'buffer'));
      });
    },

    generateBundle() {
      const emitted = new Set();
      olderVersions(getHistory()).forEach(({ sha, path, url }) => {
        if (emitted.has(url)) return;
        emitted.add(url);
        this.emitFile({
          type: 'asset',
          fileName: url,
          source: git(root, ['show', `${sha}:${path}`], 'buffer'),
        });
      });
    },
  };
};
