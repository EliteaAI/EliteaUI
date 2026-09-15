import { parse } from 'espree';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

/**
 * ONE property, chosen because it is the only thing about this call that a value
 * test cannot reach: every input must be passed as ES6 **shorthand**, so the local
 * named `x` is what feeds the key `x`.
 *
 * Mis-wiring a key (`localMetaOverride: serverSupersedes`), neutralising one
 * (`buildBlockedReason: null`) or swapping two all break it, because each stops being
 * shorthand — while formatting changes do not. Nothing here asserts arity or an
 * identifier's spelling, so renaming a panel local is a real signal to update this
 * list rather than a false alarm.
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
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type === 'CallExpression' && node.callee?.name === calleeName) found.push(node);
    Object.values(node).forEach(walk);
  };

  walk(parse(SOURCE, { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } }));
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

// Two same-typed flags the helper's own tests cannot police, because they pass their
// own arguments: transposing them at the call site swaps the warning naming Stop for
// the plain "Indexing…" banner. Naming the parameters removed the slots; shorthand
// here removes the swap.
describe('RunIndexPanel — the banner cannot be handed the wrong liveness flag', () => {
  const [call] = findCall('bannerVariant');
  const properties = call?.arguments?.[0]?.properties ?? [];
  const shorthandKeys = properties.filter(p => p.shorthand).map(p => p.key.name);

  it.each(['isStale', 'isReclaimable'])('passes %s straight through', key => {
    expect(shorthandKeys).toContain(key);
  });
});
