// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../api/eliteaApi.js', () => ({
  eliteaApi: {
    endpoints: {
      authorDetails: { matchFulfilled: () => false },
      projectList: { matchFulfilled: () => false },
    },
  },
}));

const { default: reducer, actions } = await import('../settings');

const initial = reducer(undefined, { type: '@@init' });
const apply = (state, ...actionList) => actionList.reduce((acc, action) => reducer(acc, action), state);

describe('settings run-active counter', () => {
  it('starts at zero', () => {
    expect(initial.runActiveCount).toBe(0);
  });

  it('counts concurrent runs, so one finishing does not hide another', () => {
    const state = apply(initial, actions.runActiveStarted(), actions.runActiveStarted());
    expect(state.runActiveCount).toBe(2);

    expect(apply(state, actions.runActiveEnded()).runActiveCount).toBe(1);
  });

  it('never goes below zero', () => {
    expect(apply(initial, actions.runActiveEnded(), actions.runActiveEnded()).runActiveCount).toBe(0);
  });
});
