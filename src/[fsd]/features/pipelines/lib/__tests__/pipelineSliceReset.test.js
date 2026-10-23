import { describe, expect, it } from 'vitest';

import { DEFAULT_PIPELINE_KEY } from '@/[fsd]/features/pipelines/lib/constants';
import reducer, { actions } from '@/slices/pipeline';

const initPayload = nodeIds => ({
  nodes: nodeIds.map(id => ({ id })),
  edges: [],
  yamlJsonObject: { nodes: nodeIds.filter(id => id !== 'END').map(id => ({ id })) },
  yamlCode: '',
  layout_version: '1',
});

const getPipeline = state => state.byKey[DEFAULT_PIPELINE_KEY];

describe('pipeline slice reset handshake', () => {
  const initialState = reducer(undefined, { type: '@@init' });

  it('bumps resetVersion on every init and reset', () => {
    let state = reducer(initialState, actions.initThePipeline(initPayload(['END'])));
    expect(getPipeline(state).resetFlag).toBe(true);
    expect(getPipeline(state).resetVersion).toBe(1);

    state = reducer(state, actions.resetPipeline());
    expect(getPipeline(state).resetVersion).toBe(2);
  });

  it('clears the flag only for the version that was handled', () => {
    let state = reducer(initialState, actions.initThePipeline(initPayload(['END'])));
    state = reducer(state, actions.clearResetFlag(getPipeline(state).resetVersion));

    expect(getPipeline(state).resetFlag).toBe(false);
  });

  it('ignores a stale clear so a newer init is still applied (create -> edit redirect)', () => {
    // Create page saves: resetPipeline leaves a pending reset with the empty draft
    let state = reducer(initialState, actions.initThePipeline(initPayload(['END'])));
    state = reducer(state, actions.resetPipeline());
    const staleVersion = getPipeline(state).resetVersion;

    // Edit page loads the saved pipeline before the stale canvas effect clears the flag
    state = reducer(state, actions.initThePipeline(initPayload(['END', 'Printer 1'])));
    state = reducer(state, actions.clearResetFlag(staleVersion));

    expect(getPipeline(state).resetFlag).toBe(true);
    expect(getPipeline(state).nodes.map(node => node.id)).toEqual(['END', 'Printer 1']);
  });

  it('keeps clearing unconditionally when no version is passed', () => {
    let state = reducer(initialState, actions.initThePipeline(initPayload(['END'])));
    state = reducer(state, actions.clearResetFlag());

    expect(getPipeline(state).resetFlag).toBe(false);
  });
});
