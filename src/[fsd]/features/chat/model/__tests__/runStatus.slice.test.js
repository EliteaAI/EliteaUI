import { describe, expect, it, vi } from 'vitest';

vi.mock('@/[fsd]/shared/config/reducerRegistry', () => ({ registerReducer: vi.fn() }));

const {
  default: reducer,
  actions,
  selectConversationRunStatus,
} = await import('@/[fsd]/features/chat/model/runStatus.slice');
const { RUN_STATUS, UNREAD_REASON } = await import('@/[fsd]/features/chat/lib/constants/runStatus.constants');

const P = 7;
const apply = (state, status, extra = {}) =>
  reducer(
    state,
    actions.applyRunStatus({ projectId: P, conversationUuid: 'A', messageGroupUuid: 'm1', status, ...extra }),
  );
const entry = state => state.byProject[P]?.A;

describe('runStatus slice', () => {
  it('a running chat shows the spinner and no dot', () => {
    const state = apply(undefined, RUN_STATUS.running);
    expect(entry(state)).toMatchObject({ isRunning: true, unread: null, messageGroupUuid: 'm1' });
  });

  it.each([
    [RUN_STATUS.finished, UNREAD_REASON.newResponse],
    [RUN_STATUS.failed, UNREAD_REASON.newResponse],
    [RUN_STATUS.waiting, UNREAD_REASON.waiting],
  ])('%s while the chat is not open leaves a %s dot', (status, reason) => {
    const state = apply(apply(undefined, RUN_STATUS.running), status);
    expect(entry(state)).toMatchObject({ isRunning: false, unread: reason });
  });

  it('a run ending in the open chat leaves no dot', () => {
    const state = apply(apply(undefined, RUN_STATUS.running), RUN_STATUS.finished, {
      openConversationUuid: 'A',
    });
    expect(entry(state).unread).toBeNull();
  });

  it('stop leaves no new dot of its own', () => {
    const state = apply(apply(undefined, RUN_STATUS.running), RUN_STATUS.stopped);
    expect(entry(state)).toMatchObject({ isRunning: false, unread: null });
  });

  it('a new run clears an old dot; opening the chat clears it too', () => {
    let state = apply(undefined, RUN_STATUS.finished);
    expect(entry(state).unread).toBe(UNREAD_REASON.newResponse);
    state = reducer(state, actions.markSeen({ projectId: P, conversationUuid: 'A' }));
    expect(entry(state).unread).toBeNull();
    state = apply(apply(state, RUN_STATUS.waiting), RUN_STATUS.running);
    expect(entry(state).unread).toBeNull();
  });

  it('frames without ids or a status are ignored', () => {
    const state = reducer(undefined, actions.applyRunStatus({ projectId: P, status: RUN_STATUS.running }));
    expect(state.byProject).toEqual({});
  });

  describe('syncRunningFromList', () => {
    const sync = (state, conversations) =>
      reducer(state, actions.syncRunningFromList({ projectId: P, conversations }));

    it('takes running chats from the list', () => {
      const state = sync(undefined, [
        { uuid: 'A', has_running_task: true },
        { uuid: 'B', has_running_task: false },
      ]);
      expect(entry(state).isRunning).toBe(true);
      expect(state.byProject[P].B).toBeUndefined();
    });

    it('stops a spinner the socket never ended, without inventing a dot', () => {
      const state = sync(apply(undefined, RUN_STATUS.running), [{ uuid: 'A', has_running_task: false }]);
      expect(entry(state)).toMatchObject({ isRunning: false, unread: null });
    });

    it('keeps an unread dot and ignores rows without the field (older server)', () => {
      let state = apply(undefined, RUN_STATUS.finished);
      state = sync(state, [{ uuid: 'A', has_running_task: false }, { uuid: 'B' }]);
      expect(entry(state).unread).toBe(UNREAD_REASON.newResponse);
      expect(state.byProject[P].B).toBeUndefined();
    });
  });

  it('the selector returns a stable empty entry for an unknown chat', () => {
    const select = selectConversationRunStatus(P, 'Z');
    const root = { chatRunStatus: reducer(undefined, { type: 'init' }) };
    expect(select(root)).toBe(select(root));
    expect(select(root)).toEqual({});
  });
});
