/* eslint-disable no-undef */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { createTheme } from '@mui/material/styles';

import dark from '../src/darkPalette.js';
import light from '../src/lightPalette.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function flatKeys(obj, p = '') {
  return Object.keys(obj).flatMap(k => {
    const path = p ? `${p}.${k}` : k;
    return obj[k] && typeof obj[k] === 'object' ? flatKeys(obj[k], path) : [path];
  });
}

/* 1. dark and light must declare the same keys */
const dk = new Set(flatKeys(dark));
const lk = new Set(flatKeys(light));
const onlyDark = [...dk].filter(k => !lk.has(k));
const onlyLight = [...lk].filter(k => !dk.has(k));

/* 2. every palette.<path> read in src/ must resolve against the built theme */
const themes = {
  dark: createTheme({ palette: dark }).palette,
  light: createTheme({ palette: light }).palette,
};

// trailing segments that are method calls on a resolved value, not palette keys
const STOP = new Set(['map', 'filter', 'length', 'replace', 'includes', 'startsWith', 'split', 'slice']);
// roots MUI derives itself, never declared in the palette files
const MUI_ROOTS = new Set(['mode', 'getContrastText', 'augmentColor', 'contrastThreshold', 'tonalOffset']);

// Reads that were already broken before the palette refactor: the key has never existed, so these
// elements render with an inherited colour today. Pointing them at a real token would change how the
// app looks, which is out of scope for a pure refactor — they need their own fix (and design input on
// what colour they should be). Remove an entry here once its consumer is corrected.
const KNOWN_PREEXISTING = new Set([
  'background.button.hover',
  'background.errorCodeHighlight',
  'background.primary',
  'background.secondary',
  'boxShadow.elevated',
  'icon.fill.white',
  'text.button.selected',
  'text.deafult', // typo in the consumer, predates this refactor
  'text.tertiary',
  'text.tooltip.default',
]);

const files = execSync('git ls-files src', { cwd: ROOT, maxBuffer: 1 << 26 })
  .toString()
  .trim()
  .split('\n')
  .filter(f => /\.(jsx?|mjs)$/.test(f))
  .filter(f => !/(dark|light)Palette\.js$|__tests__|\.test\.|\.stories\./.test(f));

const missing = [];

const resolvePath = (segments, wantsObject) => {
  const usable = [];
  for (const seg of segments) {
    if (STOP.has(seg)) break;
    usable.push(seg);
  }
  if (!usable.length || MUI_ROOTS.has(usable[0])) return null;
  if (KNOWN_PREEXISTING.has(usable.join('.'))) return null;

  for (const [mode, palette] of Object.entries(themes)) {
    let value = palette;
    for (const seg of usable) {
      if (value === null || typeof value !== 'object') return { mode, path: usable.join('.') };
      value = value[seg];
    }
    if (value === undefined) return { mode, path: usable.join('.') };
    // palette.group[dynamicKey] — the group itself has to be an object
    if (wantsObject && (value === null || typeof value !== 'object')) return { mode, path: usable.join('.') };
  }
  return null;
};

for (const file of files) {
  const src = readFileSync(resolve(ROOT, file), 'utf8');
  const lineOf = index => src.slice(0, index).split('\n').length;

  // palette.a.b — also theme.palette.a?.b and palette.a[expr]
  for (const match of src.matchAll(/\bpalette((?:\??\.[A-Za-z_$][\w$]*)+)(\s*\?*\.?\[)?/g)) {
    const segments = match[1].replace(/\?/g, '').split('.').filter(Boolean);
    const bad = resolvePath(segments, Boolean(match[2]));
    if (bad) missing.push(`${file}:${lineOf(match.index)}  palette.${bad.path}  (${bad.mode})`);
  }

  // const { a, b } = palette / const { a } = theme.palette
  for (const match of src.matchAll(/const\s*\{([^}=]*)\}\s*=\s*(?:[\w$]+\.)?palette\b(?!\s*\.)/g)) {
    for (const part of match[1].split(',')) {
      const key = part.split(':')[0].trim();
      if (!key || key.startsWith('...')) continue;
      const bad = resolvePath([key], false);
      if (bad) missing.push(`${file}:${lineOf(match.index)}  { ${key} } = palette  (${bad.mode})`);
    }
  }
}

let failed = false;

if (onlyDark.length || onlyLight.length) {
  failed = true;
  if (onlyDark.length) console.error('ONLY IN DARK:\n' + onlyDark.map(k => `  ${k}`).join('\n'));
  if (onlyLight.length) console.error('ONLY IN LIGHT:\n' + onlyLight.map(k => `  ${k}`).join('\n'));
}

if (missing.length) {
  failed = true;
  const unique = [...new Set(missing)];
  console.error(
    `PALETTE KEYS READ BUT NOT DEFINED (${unique.length}):\n` + unique.map(m => `  ${m}`).join('\n'),
  );
}

if (failed) process.exit(1);

console.log(`✓ Palette parity OK (${dk.size} tokens, ${files.length} files checked)`);
