// @vitest-environment jsdom
import YAML from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { parseYamlCodeWithRenames, syncYamlCodeRenames } from '../nodeRenameSync.helpers';

describe('syncYamlCodeRenames', () => {
  // The issue's pipeline: the entry point and the HITL routes point at the node that gets renamed
  const baseline = {
    entry_point: 'Node A',
    nodes: [
      { id: 'Node A', type: 'llm', input: ['messages'], output: ['messages'], transition: 'Review' },
      { id: 'Review', type: 'hitl', routes: { approve: 'Node A', edit: 'Node A', reject: 'end' } },
    ],
  };
  const renamedYaml = YAML.dump({
    ...baseline,
    nodes: [{ ...baseline.nodes[0], id: 'Node A renamed' }, baseline.nodes[1]],
  });

  it('makes the entry point and the routes follow a node renamed in the YAML text', () => {
    const synced = YAML.load(syncYamlCodeRenames(renamedYaml, baseline));

    expect(synced.entry_point).toBe('Node A renamed');
    expect(synced.nodes[0].id).toBe('Node A renamed');
    expect(synced.nodes[1].routes).toEqual({
      approve: 'Node A renamed',
      edit: 'Node A renamed',
      reject: 'end',
    });
  });

  it('returns the text as it is when no node was renamed', () => {
    const code = '# keep this comment\nentry_point: Node A\nnodes:\n  - id: Node A\n    type: llm\n';

    expect(syncYamlCodeRenames(code, { entry_point: 'Node A', nodes: [{ id: 'Node A', type: 'llm' }] })).toBe(
      code,
    );
    expect(syncYamlCodeRenames(code, undefined)).toBe(code);
  });

  it('returns text that cannot be parsed as it is', () => {
    expect(syncYamlCodeRenames('nodes: [unclosed', baseline)).toBe('nodes: [unclosed');
  });

  it('leaves the references alone when a node is replaced instead of renamed', () => {
    const code = YAML.dump({
      ...baseline,
      nodes: [{ id: 'Other', type: 'llm', input: ['x'] }, baseline.nodes[1]],
    });

    expect(syncYamlCodeRenames(code, baseline)).toBe(code);
  });

  it('gives the switch to Flow the same synced pipeline as the save', () => {
    const { yamlJson, renamedPairs } = parseYamlCodeWithRenames(renamedYaml, baseline);

    expect(renamedPairs).toEqual([['Node A', 'Node A renamed']]);
    expect(yamlJson).toEqual(YAML.load(syncYamlCodeRenames(renamedYaml, baseline)));
    expect(parseYamlCodeWithRenames('nodes: [unclosed', baseline)).toBeNull();
  });
});
