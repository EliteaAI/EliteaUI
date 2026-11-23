// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useEveryoneMentionIds } from '../useEveryoneMentionIds.hooks';

const memberIdsQuery = vi.hoisted(() => vi.fn());
const refetch = vi.hoisted(() => vi.fn());

vi.mock('@/api', () => ({
  useProjectMemberIdsQuery: (args, options) => memberIdsQuery(args, options),
}));

const setup = (props = {}) => {
  const toastError = vi.fn();
  const { result } = renderHook(() =>
    useEveryoneMentionIds({
      projectId: 406,
      isMentioningEveryone: true,
      isWholeTeamChat: true,
      toastError,
      ...props,
    }),
  );
  return { result, toastError };
};

describe('useEveryoneMentionIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memberIdsQuery.mockReturnValue({ data: [1, 2, 3], isFetching: false, isError: false, refetch });
  });

  afterEach(() => cleanup());

  it('loads the member ids only once Everyone is picked in a whole-team chat', () => {
    setup({ isMentioningEveryone: false });
    expect(memberIdsQuery).toHaveBeenLastCalledWith({ projectId: 406 }, { skip: true });

    setup({ isWholeTeamChat: false });
    expect(memberIdsQuery).toHaveBeenLastCalledWith({ projectId: 406 }, { skip: true });

    setup();
    expect(memberIdsQuery).toHaveBeenLastCalledWith({ projectId: 406 }, { skip: false });
  });

  it('gives the loaded ids to the send of a whole-team chat', () => {
    const { result, toastError } = setup();

    expect(result.current.everyoneMemberIds).toEqual([1, 2, 3]);
    expect(result.current.canSendToEveryone()).toBe(true);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('blocks the send, tells the user and loads again when the member ids failed to load', () => {
    memberIdsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true, refetch });
    const { result, toastError } = setup();

    expect(result.current.canSendToEveryone()).toBe(false);
    expect(toastError).toHaveBeenCalledWith(
      'Failed to load the project members to mention. Please try again.',
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not block a send that does not mention Everyone of a whole-team chat', () => {
    memberIdsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true, refetch });

    expect(setup({ isMentioningEveryone: false }).result.current.canSendToEveryone()).toBe(true);
    expect(setup({ isWholeTeamChat: false }).result.current.canSendToEveryone()).toBe(true);
    expect(refetch).not.toHaveBeenCalled();
  });
});
