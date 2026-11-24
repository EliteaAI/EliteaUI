// @vitest-environment jsdom
import YAML from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import useSavePipeline from '../useSavePipeline';

const mocks = vi.hoisted(() => ({ state: null }));

vi.mock('react-redux', () => ({ useSelector: selector => selector(mocks.state) }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsFrom: () => false,
  useIsFromPipelineDetail: () => true,
}));
vi.mock('@/slices/pipeline', async importOriginal => ({
  ...(await importOriginal()),
  selectActivePipeline: state => state.active,
}));

// The issue's pipeline: the entry point and the HITL routes point at the node that gets renamed
const baseline = {
  entry_point: 'Node A',
  nodes: [
    { id: 'Node A', type: 'llm', transition: 'Review' },
    { id: 'Review', type: 'hitl', routes: { approve: 'Node A', edit: 'Node A', reject: 'end' } },
  ],
};

const saveYamlCodeFor = yamlCode => {
  mocks.state = {
    pipelineEditor: { nodes: [], edges: [] },
    active: { yamlCode, yamlJsonObject: baseline, initState: {} },
  };
  return renderHook(() => useSavePipeline()).result.current.yamlCode;
};

describe('useSavePipeline', () => {
  it('saves the references of a node renamed in the YAML view without switching to Flow', () => {
    const renamed = YAML.dump({
      ...baseline,
      nodes: [{ ...baseline.nodes[0], id: 'Node A renamed' }, baseline.nodes[1]],
    });

    const saved = YAML.load(saveYamlCodeFor(renamed));

    expect(saved.entry_point).toBe('Node A renamed');
    expect(saved.nodes[1].routes).toEqual({
      approve: 'Node A renamed',
      edit: 'Node A renamed',
      reject: 'end',
    });
  });

  it('saves the YAML text as it is when no node was renamed', () => {
    const code = `# keep this comment\n${YAML.dump(baseline)}`;

    expect(saveYamlCodeFor(code)).toBe(code);
  });
});
