// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { USERS_ACCESS_KIND } from '../../constants';
import { useChatUsersAccess } from '../useChatUsersAccess.hooks';

const linksQuery = vi.hoisted(() => vi.fn());
const userList = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 1 } }),
}));
vi.mock('@/[fsd]/features/chat/conversation-list/api/sharedLinksApi', () => ({
  useListShareLinksQuery: (args, options) => linksQuery(args, options),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useUserList: args => userList(args),
}));

const user = (id, userId) => ({
  id,
  entity_name: 'user',
  entity_meta: { id: userId },
  meta: { user_name: `U${id}` },
});
const agent = { id: 9, entity_name: 'application', entity_meta: { id: 70 } };
const DAY = 24 * 60 * 60 * 1000;

const renderAccess = conversation =>
  renderHook(() => useChatUsersAccess({ conversation, projectId: 406 })).result.current;

describe('useChatUsersAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linksQuery.mockReturnValue({ data: [] });
    userList.mockReturnValue({ data: { rows: [], total: 24 } });
  });

  it('shows the whole team with the project members count for a public chat', () => {
    const access = renderAccess({ id: 5, author_id: 1, is_private: false, participants: [user(1, 1)] });

    expect(access.kind).toBe(USERS_ACCESS_KIND.team);
    expect(access.label).toBe('Whole Team (24)');
    expect(userList).toHaveBeenCalledWith(expect.objectContaining({ forceSkip: false }));
  });

  it('counts only the people of a private chat, not the AI participants', () => {
    const access = renderAccess({
      id: 5,
      author_id: 1,
      is_private: true,
      participants: [user(1, 1), user(2, 2), user(3, 3), agent],
    });

    expect(access.kind).toBe(USERS_ACCESS_KIND.people);
    expect(access.label).toBe('3 users');
    expect(access.users).toHaveLength(3);
    expect(userList).toHaveBeenCalledWith(expect.objectContaining({ forceSkip: true }));
  });

  it('shows Only You when nobody else has access', () => {
    const access = renderAccess({ id: 5, author_id: 1, is_private: true, participants: [user(1, 1), agent] });

    expect(access.kind).toBe(USERS_ACCESS_KIND.onlyYou);
    expect(access.label).toBe('Only You');
  });

  it('counts the active and the expired links of the owner apart', () => {
    linksQuery.mockReturnValue({
      data: [
        { token: 'a' },
        { token: 'b', expires_at: new Date(Date.now() + DAY).toISOString() },
        { token: 'c', expires_at: new Date(Date.now() - DAY).toISOString() },
      ],
    });
    const access = renderAccess({ id: 5, author_id: 1, is_private: true, participants: [user(1, 1)] });

    expect(access.linksCount).toBe(2);
    expect(access.expiredLinksCount).toBe(1);
  });

  it('does not ask for the links when the viewer is not the owner', () => {
    const access = renderAccess({ id: 5, author_id: 2, is_private: false, participants: [user(1, 1)] });

    expect(access.isOwner).toBe(false);
    expect(linksQuery).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });
});
