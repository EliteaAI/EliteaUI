import { describe, expect, it } from 'vitest';

import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { DumpYamlHelpers } from '@/[fsd]/shared/lib/helpers';

import { applyNodeYaml, dumpNodeYaml, findYamlNode, isSameNode, parseNodeYaml } from '../nodeYaml.helpers';

const { CONDITION_NODE_ID_SUFFIX, PipelineNodeTypes } = FlowEditorConstants;
const { NODE_YAML_ERRORS } = NodePanelConstants;

const pipeline = {
  state: { issue_details: { type: 'str' } },
  entry_point: 'normalize_issue',
  interrupt_before: ['extract_metadata'],
  nodes: [
    {
      id: 'normalize_issue',
      type: PipelineNodeTypes.StateModifier,
      input: ['issue_details'],
      output: ['normalized_issue'],
      template: '## GitHub Issue\n{{ issue_details }}',
      variables_to_clean: [],
      transition: 'extract_metadata',
    },
    {
      id: 'extract_metadata',
      type: PipelineNodeTypes.LLM,
      input_mapping: { task: { type: 'fixed', value: 'Extract' } },
      transition: 'END',
    },
  ],
};

// The node's item as it appears in the full pipeline YAML, with the `nodes:` indent removed
const blockInPipelineYaml = id => {
  const lines = DumpYamlHelpers.dumpYaml(pipeline).split('\n');
  const start = lines.findIndex(line => line === `  - id: ${id}`);
  const end = lines.findIndex((line, index) => index > start && line.startsWith('  - id: '));
  return `${lines
    .slice(start, end === -1 ? undefined : end)
    .filter(Boolean)
    .map(line => line.slice(2))
    .join('\n')}\n`;
};

describe('nodeYaml helpers', () => {
  describe('dumpNodeYaml', () => {
    it.each(pipeline.nodes.map(node => node.id))('matches the %s block of the main YAML', id => {
      expect(dumpNodeYaml(findYamlNode(pipeline.nodes, id))).toBe(blockInPipelineYaml(id));
    });

    it('returns an empty string without a node', () => {
      expect(dumpNodeYaml(undefined)).toBe('');
    });
  });

  describe('findYamlNode', () => {
    it('resolves a condition card to the node that owns it', () => {
      expect(findYamlNode(pipeline.nodes, `normalize_issue${CONDITION_NODE_ID_SUFFIX}`)?.id).toBe(
        'normalize_issue',
      );
    });

    it('returns undefined for an unknown id', () => {
      expect(findYamlNode(pipeline.nodes, 'missing')).toBeUndefined();
    });
  });

  describe('parseNodeYaml', () => {
    const currentNode = pipeline.nodes[0];
    const parse = code => parseNodeYaml(code, { currentNode, nodes: pipeline.nodes, toolNames: ['github'] });

    it('accepts the dumped node unchanged', () => {
      const { node, error } = parse(dumpNodeYaml(currentNode));
      expect(error).toBeUndefined();
      expect(isSameNode(node, currentNode)).toBe(true);
    });

    it('accepts a plain mapping and keeps unknown keys', () => {
      const { node } = parse('id: normalize_issue\ntype: state_modifier\ncustom_flag: true\n');
      expect(node).toEqual({ id: 'normalize_issue', type: 'state_modifier', custom_flag: true });
    });

    it('reports syntax errors', () => {
      expect(parse('- id: [unclosed').error).toMatch(/^Invalid YAML/);
    });

    it('rejects more than one node', () => {
      expect(parse('- id: a\n  type: state_modifier\n- id: b\n  type: state_modifier\n').error).toBe(
        NODE_YAML_ERRORS.singleNode,
      );
      expect(parse('just text').error).toBe(NODE_YAML_ERRORS.singleNode);
    });

    it('rejects a type change', () => {
      expect(parse('- id: normalize_issue\n  type: llm\n').error).toBe(NODE_YAML_ERRORS.typeChange);
    });

    it('rejects an empty, duplicate or toolkit id', () => {
      expect(parse('- id: ""\n  type: state_modifier\n').error).toBe('Name is required');
      expect(parse('- type: state_modifier\n').error).toBe('Name is required');
      expect(parse('- id: extract_metadata\n  type: state_modifier\n').error).toMatch(/used by other nodes/);
      expect(parse('- id: github\n  type: state_modifier\n').error).toMatch(/toolkit name/);
    });

    it('does not rename condition nodes', () => {
      const conditionNode = { id: 'cond_1', type: PipelineNodeTypes.Condition };
      expect(
        parseNodeYaml('- id: cond_2\n  type: condition\n', {
          currentNode: conditionNode,
          nodes: [conditionNode],
        }).error,
      ).toBe(NODE_YAML_ERRORS.renameLocked);
    });
  });

  describe('applyNodeYaml', () => {
    it('replaces only the edited node', () => {
      const edited = { ...pipeline.nodes[0], template: 'new', extra: { keep: 1 } };
      const next = applyNodeYaml(pipeline, 'normalize_issue', edited);

      expect(next.nodes[0]).toBe(edited);
      expect(next.nodes[1]).toBe(pipeline.nodes[1]);
      expect(next.state).toBe(pipeline.state);
      expect(next.entry_point).toBe('normalize_issue');
    });

    it('renames every reference when the id changes', () => {
      const edited = { ...pipeline.nodes[1], id: 'metadata' };
      const next = applyNodeYaml(pipeline, 'extract_metadata', edited);

      expect(next.nodes.map(node => node.id)).toEqual(['normalize_issue', 'metadata']);
      expect(next.nodes[0].transition).toBe('metadata');
      expect(next.interrupt_before).toEqual(['metadata']);
    });
  });
});
