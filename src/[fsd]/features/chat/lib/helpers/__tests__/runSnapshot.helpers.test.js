import { afterEach, describe, expect, it } from 'vitest';

import {
  applyRunSnapshot,
  clearPendingSnapshots,
  isChunkInSnapshot,
  rememberPendingSnapshot,
  takePendingSnapshot,
} from '@/[fsd]/features/chat/lib/helpers/runSnapshot.helpers';
import { TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

const run = (content, seq, extra = {}) => ({
  content,
  thinking: '',
  seq,
  truncated: false,
  metadata: {},
  ...extra,
});

describe('applyRunSnapshot', () => {
  it('adds the step that is still generating, shaped like the one a live chunk creates', () => {
    const finished = { id: 'done', status: ToolActionStatus.complete, content: 'persisted' };
    const next = applyRunSnapshot([finished], { 'run-a': run('so far', 3) }, 1000);
    expect(next[0]).toBe(finished);
    expect(next[1]).toMatchObject({
      id: 'run-a',
      name: TOOL_ACTION_NAMES.Llm,
      type: TOOL_ACTION_TYPES.Llm,
      status: ToolActionStatus.processing,
      content: 'so far',
      snapshotSeq: 3,
      created_at: 1000,
    });
  });

  it('places a sub-agent step under its agent and names it after its node', () => {
    const [action] = applyRunSnapshot([], {
      'run-a': run('x', 1, { metadata: { langgraph_node: ' researcher ', parent_agent_name: 'Lead' } }),
    });
    expect(action.name).toBe('researcher');
    expect(action.parent_agent_name).toBe('Lead');
    expect(action.toolMeta.parent_agent_name).toBe('Lead');
  });

  it('overwrites a live step only when the snapshot is ahead of it', () => {
    const live = { id: 'run-a', status: ToolActionStatus.processing, content: 'ab', snapshotSeq: 2 };
    expect(applyRunSnapshot([live], { 'run-a': run('a', 1) })[0]).toBe(live);
    expect(applyRunSnapshot([live], { 'run-a': run('abcd', 4) })[0]).toMatchObject({
      content: 'abcd',
      snapshotSeq: 4,
    });
  });

  it('never touches a step that already finished', () => {
    const done = { id: 'run-a', status: ToolActionStatus.complete, content: 'final' };
    const actions = [done];
    expect(applyRunSnapshot(actions, { 'run-a': run('partial', 9) })).toBe(actions);
  });

  it('returns the same array when nothing changes', () => {
    const actions = [{ id: 'x', status: ToolActionStatus.complete }];
    expect(applyRunSnapshot(actions, {})).toBe(actions);
  });
});

describe('isChunkInSnapshot', () => {
  it('skips chunks the snapshot already holds and applies newer ones', () => {
    const action = { snapshotSeq: 3 };
    expect(isChunkInSnapshot(action, 2)).toBe(true);
    expect(isChunkInSnapshot(action, 3)).toBe(true);
    expect(isChunkInSnapshot(action, 4)).toBe(false);
  });

  it('applies chunks without a stamp (older server, Redis down) and steps never seeded', () => {
    expect(isChunkInSnapshot({ snapshotSeq: 3 }, undefined)).toBe(false);
    expect(isChunkInSnapshot({}, 1)).toBe(false);
    expect(isChunkInSnapshot(undefined, 1)).toBe(false);
  });
});

describe('pending snapshots', () => {
  afterEach(() => clearPendingSnapshots());

  it('keeps a snapshot until its message is in the history, then hands it over once', () => {
    rememberPendingSnapshot('m1', { 'run-a': run('x', 1) });
    expect(takePendingSnapshot('m1')).toEqual({ 'run-a': run('x', 1) });
    expect(takePendingSnapshot('m1')).toBeUndefined();
  });

  it('holds a bounded number, dropping the oldest', () => {
    for (let i = 0; i < 25; i += 1) rememberPendingSnapshot(`m${i}`, { r: run('x', i) });
    expect(takePendingSnapshot('m0')).toBeUndefined();
    expect(takePendingSnapshot('m24')).toBeDefined();
  });
});

// The order a returning client sees on a slow network: snapshot first, then live chunks that partly overlap it
describe('a return mid-run', () => {
  // Mirrors the existing-message branch of agent_llm_chunk in components/Chat/hooks.js
  const onChunk = (actions, { id, content, seq }) => {
    const action = actions.find(a => a.id === id);
    if (isChunkInSnapshot(action, seq)) return actions;
    return actions.map(a => (a.id === id ? { ...a, content: (a.content || '') + content } : a));
  };

  it('shows every streamed character once', () => {
    let actions = applyRunSnapshot([], { 'run-a': run('Hello wor', 3) });
    // seq 3 was in flight when the client joined: it is both in the snapshot and live
    actions = onChunk(actions, { id: 'run-a', content: 'wor', seq: 3 });
    actions = onChunk(actions, { id: 'run-a', content: 'ld', seq: 4 });
    actions = onChunk(actions, { id: 'run-a', content: '!', seq: 5 });
    expect(actions[0].content).toBe('Hello world!');
  });

  it('a chunk from a server without stamps still appends', () => {
    let actions = applyRunSnapshot([], { 'run-a': run('Hi', 1) });
    actions = onChunk(actions, { id: 'run-a', content: ' there', seq: undefined });
    expect(actions[0].content).toBe('Hi there');
  });
});
