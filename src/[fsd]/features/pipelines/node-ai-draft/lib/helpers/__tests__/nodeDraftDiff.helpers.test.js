// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { changedFieldPaths, diffYamlLines } from '../nodeDraftDiff.helpers';

describe('diffYamlLines', () => {
  it('marks removed and added lines and keeps the rest (AC-13)', () => {
    expect(diffYamlLines('a: 1\nb: 2\nc: 3\n', 'a: 1\nb: 20\nc: 3\nd: 4\n')).toEqual([
      { kind: 'same', text: 'a: 1' },
      { kind: 'removed', text: 'b: 2' },
      { kind: 'added', text: 'b: 20' },
      { kind: 'same', text: 'c: 3' },
      { kind: 'added', text: 'd: 4' },
    ]);
  });

  it('keeps order for an inserted line and a removed line elsewhere', () => {
    expect(diffYamlLines('a\nb\nc\nd\n', 'a\nx\nb\nd\n')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'added', text: 'x' },
      { kind: 'same', text: 'b' },
      { kind: 'removed', text: 'c' },
      { kind: 'same', text: 'd' },
    ]);
  });

  it('handles an empty side', () => {
    expect(diffYamlLines('', 'a: 1\n')).toEqual([
      { kind: 'removed', text: '' },
      { kind: 'added', text: 'a: 1' },
    ]);
  });

  it('returns only unchanged lines for equal texts', () => {
    expect(diffYamlLines('x: 1\n', 'x: 1\n')).toEqual([{ kind: 'same', text: 'x: 1' }]);
  });
});

// Same rules as the backend's changed_paths (utils/node_draft/merge.py), recomputed after the user edits the draft
describe('changedFieldPaths', () => {
  const ORIGINAL = {
    id: 'n',
    type: 'hitl',
    input: ['a'],
    user_message: { type: 'fixed', value: 'Approve?' },
    routes: { approve: '', edit: '', reject: 'END' },
  };

  it('is empty for an unchanged node', () => {
    expect(changedFieldPaths(ORIGINAL, { ...ORIGINAL })).toEqual([]);
  });

  it('reports a value object as one path and nested keys per key, sorted', () => {
    const node = {
      ...ORIGINAL,
      user_message: { type: 'fstring', value: 'Approve {a}?' },
      routes: { ...ORIGINAL.routes, approve: 'next' },
      input: ['a', 'b'],
    };
    expect(changedFieldPaths(ORIGINAL, node)).toEqual(['input', 'routes.approve', 'user_message']);
  });

  it('reports added and removed keys', () => {
    const { input, ...withoutInput } = ORIGINAL;
    expect(input).toBeTruthy();
    expect(changedFieldPaths(ORIGINAL, { ...withoutInput, edit_state_key: 'a' })).toEqual([
      'edit_state_key',
      'input',
    ]);
  });

  it('ignores id and type', () => {
    expect(changedFieldPaths(ORIGINAL, { ...ORIGINAL, id: 'x', type: 'llm' })).toEqual([]);
  });
});
