import { parse } from 'espree';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

/**
 * RunIndexPanel mounts Formik, sockets, RTK and useToolkitChat, so rendering it to
 * assert four booleans is disproportionate — but its wiring is where the destructive
 * decision actually lives, and every behavioural suite passes while it is wrong.
 *
 * Parsed, not grepped: a mention in a comment must not satisfy these, and a
 * reformat by prettier must not break them.
 */
const SOURCE = readFileSync(fileURLToPath(new URL('../RunIndexPanel.jsx', import.meta.url)), 'utf8');

const ast = parse(SOURCE, {
  ecmaVersion: 2022,
  sourceType: 'module',
  ecmaFeatures: { jsx: true },
});

const calls = [];
(function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(walk);
    return;
  }
  if (node.type === 'CallExpression') calls.push(node);
  Object.values(node).forEach(walk);
})(ast);

const callsTo = name =>
  calls.filter(call => call.callee?.name === name || call.callee?.property?.name === name);

describe('RunIndexPanel wiring — the flags the panel hands to each decision', () => {
  it('derives its flags from indexRunControls rather than reading the row twice', () => {
    // The helper reads the row itself precisely so two same-shaped booleans cannot
    // be swapped here; reintroducing local derivations reopens that.
    expect(callsTo('indexRunControls')).toHaveLength(1);
  });

  it('passes the row and the override to the helper, not pre-derived flags', () => {
    const [call] = callsTo('indexRunControls');
    const keys = call.arguments[0].properties.map(p => p.key?.name);

    expect(keys).toContain('index');
    expect(keys).toContain('overrideSupersedesRun');
    expect(keys).not.toContain('stale');
    expect(keys).not.toContain('reclaimable');
  });

  it('gives bannerVariant the control flag, so the remedy matches the buttons', () => {
    // Without it the copy says "click Reindex" while the footer renders Stop and no
    // Reindex button is in the DOM — bannerVariant's default silently picks one.
    const [call] = callsTo('bannerVariant');
    const last = call.arguments[call.arguments.length - 1];

    expect(call.arguments).toHaveLength(7);
    expect(last.name).toBe('effectiveReclaimable');
  });

  it('gates every run-ending control on runIsLive, never on the display flag', () => {
    const gated = SOURCE.match(/const (deleteDisabled|reindexDisabled) = [^;]+;/g) ?? [];

    expect(gated).toHaveLength(2);
    gated.forEach(line => {
      expect(line).toContain('runIsLive');
      expect(line).not.toContain('effectiveStale');
    });
  });
});
