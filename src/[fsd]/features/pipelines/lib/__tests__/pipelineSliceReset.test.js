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

describe('pipeline slice orientation and layout', () => {
  const initialState = reducer(undefined, { type: '@@init' });

  it('defaults to top to bottom when the saved pipeline has no orientation', () => {
    const state = reducer(initialState, actions.initThePipeline(initPayload(['END'])));

    expect(getPipeline(state).orientation).toBe('vertical');
    expect(getPipeline(state).initState.orientation).toBe('vertical');
  });

  it('keeps the saved orientation and lets Discard restore it after a change', () => {
    let state = reducer(
      initialState,
      actions.initThePipeline({ ...initPayload(['END']), orientation: 'horizontal' }),
    );
    expect(getPipeline(state).orientation).toBe('horizontal');

    state = reducer(state, actions.setPipelineOrientation('vertical'));
    expect(getPipeline(state).orientation).toBe('vertical');
    expect(getPipeline(state).initState.orientation).toBe('horizontal');

    state = reducer(state, actions.resetPipeline());
    expect(getPipeline(state).orientation).toBe('horizontal');
  });

  it('makes an automatic arrange the layout Discard returns to', () => {
    let state = reducer(initialState, actions.initThePipeline(initPayload(['END', 'Printer 1'])));
    const arranged = [
      { id: 'END', position: { x: 10, y: 400 } },
      { id: 'Printer 1', position: { x: 10, y: 60 } },
    ];

    state = reducer(state, actions.commitInitialLayout(arranged));
    expect(getPipeline(state).initState.nodes).toEqual(arranged);

    state = reducer(state, actions.resetPipeline());
    expect(getPipeline(state).nodes).toEqual(arranged);
  });

  it('restores a tab snapshot with its orientation', () => {
    const { initState } = getPipeline(
      reducer(initialState, actions.initThePipeline({ ...initPayload(['END']), orientation: 'horizontal' })),
    );
    const state = reducer(
      initialState,
      actions.restorePipelineSnapshot({ ...initPayload(['END']), orientation: 'horizontal', initState }),
    );

    expect(getPipeline(state).orientation).toBe('horizontal');
    expect(getPipeline(state).initState.orientation).toBe('horizontal');
  });
});
