import { parse } from 'espree';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

/**
 * ONE property, chosen because it is the only thing about this call that a value
 * test cannot reach: every input must be passed as ES6 **shorthand**, so the local
 * named `x` is what feeds the key `x`.
 *
 * This replaces an earlier guard that asserted call counts, argument arity, an
 * identifier's spelling and two raw regexes. That one passed on a verbatim revert
 * and failed on a prettier reflow — it pinned shape, not meaning. Shorthand
 * integrity is immune to formatting, and mis-wiring a key (`localMetaOverride:
 * serverSupersedes`), neutralising one (`buildBlockedReason: null`) or swapping two
 * all break it, because each stops being shorthand.
 *
 * What it deliberately does NOT assert: how many arguments anything takes, what any
 * identifier is called, or anything about the banner call. Renaming a panel local is
 * a real signal to update this list, not a false alarm.
 */
const REQUIRED_SHORTHAND = [
  // Widest blast radius of the eight: mis-wire this and runIsLive goes false, which
  // arms Delete while the panel still renders the spinner and "Indexing…" from the
  // same local. It is in this list only because the panel's local was renamed to
  // match the key — a value assertion here would be the spelling check that made the
  // previous guard fire on honest renames.
  'isIndexing',
  'index',
  'localMetaOverride',
  'serverSupersedes',
  'buildBlockedReason',
  'isDeleting',
  'isRunning',
  'isWaitingForTaskStart',
];

const SOURCE = readFileSync(fileURLToPath(new URL('../RunIndexPanel.jsx', import.meta.url)), 'utf8');

const findCall = calleeName => {
  const found = [];
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type === 'CallExpression' && node.callee?.name === calleeName) found.push(node);
    Object.values(node).forEach(walk);
  })(parse(SOURCE, { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } }));
  return found;
};

describe('RunIndexPanel — every gate input reaches the helper unaltered', () => {
  const [call] = findCall('indexRunControls');
  const properties = call?.arguments?.[0]?.properties ?? [];
  const shorthandKeys = properties.filter(p => p.shorthand).map(p => p.key.name);

  it.each(REQUIRED_SHORTHAND)('passes %s straight through', key => {
    expect(shorthandKeys).toContain(key);
  });
});
