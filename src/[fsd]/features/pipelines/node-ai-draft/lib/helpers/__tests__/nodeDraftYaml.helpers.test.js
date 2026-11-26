// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { DRAFT_RENAME_ERROR, parseDraftYaml } from '../nodeDraftYaml.helpers';

const NODE = { id: 'summarize', type: 'llm', transition: 'END' };

describe('parseDraftYaml', () => {
  it('returns the edited node', () => {
    expect(parseDraftYaml('- id: summarize\n  type: llm\n  transition: next\n', NODE)).toEqual({
      node: { id: 'summarize', type: 'llm', transition: 'next' },
    });
  });

  it('rejects a changed id with the rename hint (AC-15)', () => {
    expect(parseDraftYaml('- id: other\n  type: llm\n', NODE)).toEqual({ error: DRAFT_RENAME_ERROR });
    expect(DRAFT_RENAME_ERROR).toBe('Rename the node in the Name field after applying.');
  });

  it('keeps the node YAML rules: one node, same type, valid YAML (AC-14)', () => {
    expect(parseDraftYaml('- id: summarize\n  type: code\n', NODE).error).toBe(
      "Node type can't be changed in the node YAML.",
    );
    expect(parseDraftYaml('- id: a\n  type: llm\n- id: b\n  type: llm\n', NODE).error).toBe(
      'The node YAML must describe exactly one node.',
    );
    expect(parseDraftYaml('- id: summarize\n  type: [', NODE).error).toMatch(/^Invalid YAML/);
  });
});
