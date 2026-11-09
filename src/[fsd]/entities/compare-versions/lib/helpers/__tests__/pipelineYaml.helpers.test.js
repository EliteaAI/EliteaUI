import { describe, expect, it } from 'vitest';

import {
  YAML_ERRORS,
  buildNodeSummary,
  countLines,
  findNodeIdLine,
  isYamlValueEqual,
  validatePipelineYaml,
} from '../pipelineYaml.helpers';

describe('validatePipelineYaml', () => {
  it('accepts a mapping, with or without nodes', () => {
    expect(validatePipelineYaml('nodes:\n  - id: a\n')).toEqual({ valid: true, message: '' });
    expect(validatePipelineYaml('state: {}\n').valid).toBe(true);
  });

  it('accepts duplicate node ids, as the backend does', () => {
    expect(validatePipelineYaml('nodes:\n  - id: a\n  - id: a\n').valid).toBe(true);
  });

  it.each([
    ['', YAML_ERRORS.empty],
    ['   \n\t\n', YAML_ERRORS.empty],
    ['# only a comment\n', YAML_ERRORS.empty],
    ['- a\n- b\n', YAML_ERRORS.notMapping],
    ['just a string', YAML_ERRORS.notMapping],
    ['42', YAML_ERRORS.notMapping],
    ['a: 1\n---\nb: 2\n', YAML_ERRORS.multipleDocuments],
  ])('rejects %j', (text, message) => {
    expect(validatePipelineYaml(text)).toEqual({ valid: false, message });
  });

  it('reports the line of a syntax error', () => {
    expect(validatePipelineYaml('nodes:\n  - id: a\n   bad: [\n').message).toMatch(
      /^YAML is not valid\. Check line \d+\.$/,
    );
  });

  it('reports duplicate keys and tab indentation as syntax errors', () => {
    expect(validatePipelineYaml('a: 1\na: 2\n').message).toBe(YAML_ERRORS.syntax(2));
    expect(validatePipelineYaml('nodes:\n\t- id: a\n').message).toMatch(/^YAML is not valid\. Check line/);
  });
});

describe('isYamlValueEqual', () => {
  it('ignores key order and keeps list order', () => {
    expect(isYamlValueEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })).toBe(true);
    expect(isYamlValueEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(isYamlValueEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });
});

describe('buildNodeSummary', () => {
  const base = [
    'nodes:',
    '  - id: keep',
    '    type: llm',
    '  - id: edit',
    '    prompt: old',
    '  - id: drop',
  ].join('\n');

  it('lists added, removed and changed node ids', () => {
    const next = [
      'nodes:',
      '  - id: keep',
      '    type: llm',
      '  - id: edit',
      '    prompt: new',
      '  - id: fresh',
    ].join('\n');
    expect(buildNodeSummary(base, next)).toEqual({ added: ['fresh'], removed: ['drop'], changed: ['edit'] });
  });

  it('counts a renamed id as one removed and one added', () => {
    expect(buildNodeSummary('nodes:\n  - id: old\n', 'nodes:\n  - id: new\n')).toEqual({
      added: ['new'],
      removed: ['old'],
      changed: [],
    });
  });

  it('ignores key order, comments, whitespace and a move in the list', () => {
    const reordered = [
      'nodes:',
      '  - id: drop',
      '  # a comment',
      '  - prompt: old',
      '    id: edit',
      '  - type: llm',
      '    id: keep',
    ].join('\n');
    expect(buildNodeSummary(base, reordered)).toEqual({ added: [], removed: [], changed: [] });
  });

  it('skips nodes without an id', () => {
    expect(buildNodeSummary('nodes:\n  - type: a\n', 'nodes:\n  - type: b\n')).toEqual({
      added: [],
      removed: [],
      changed: [],
    });
  });

  it('is unavailable when a side has duplicate ids', () => {
    expect(buildNodeSummary('nodes:\n  - id: x\n  - id: x\n', 'nodes: []\n')).toEqual({
      error: 'Node summary unavailable: duplicate node id x',
    });
  });

  it('is hidden when a side does not parse or has no nodes list', () => {
    expect(buildNodeSummary('nodes: [', base)).toBeNull();
    expect(buildNodeSummary('state: {}\n', base)).toBeNull();
    expect(buildNodeSummary('nodes: oops\n', base)).toBeNull();
    expect(buildNodeSummary('- a\n', base)).toBeNull();
  });
});

describe('findNodeIdLine', () => {
  it('finds the id line of a node, quoted or not', () => {
    const text = 'nodes:\n  - id: first\n  - type: llm\n    id: "second"\n';
    expect(findNodeIdLine(text, 'first')).toBe(2);
    expect(findNodeIdLine(text, 'second')).toBe(4);
    expect(findNodeIdLine(text, 'missing')).toBeNull();
  });

  it('matches the whole id, not a prefix', () => {
    expect(findNodeIdLine('nodes:\n  - id: a.b\n  - id: a\n', 'a')).toBe(3);
  });
});

describe('countLines', () => {
  it('counts the lines of a text', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('a\nb\nc')).toBe(3);
  });
});
