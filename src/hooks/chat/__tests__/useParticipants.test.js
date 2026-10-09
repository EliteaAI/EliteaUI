// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType } from '@/common/constants';
import { renderHook } from '@testing-library/react';

import useParticipants from '../useParticipants';

const shared = vi.hoisted(() => ({ skillCalls: [] }));

const emptyPage = { rows: [], total: 0 };

vi.mock('@/common/utils', () => ({
  sortByName: (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
}));
vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { id: 1 } }) }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/useDebounceValue', () => ({ default: value => value }));
vi.mock('@/hooks/users/usePermissions', () => ({ useCanListThisPublicEntity: () => false }));
vi.mock('../../useUserList', () => ({ useUserList: () => ({ data: emptyPage, onLoadMoreUsers: vi.fn() }) }));
vi.mock('../useApplicationParticipants', () => ({
  useApplicationParticipants: () => ({ data: emptyPage, onLoadMoreApplications: vi.fn() }),
}));
vi.mock('../usePublicApplicationParticipants', () => ({
  usePublicApplicationParticipants: () => ({
    publicApplicationData: emptyPage,
    onLoadMorePublicApplications: vi.fn(),
  }),
}));
vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useLoadToolkits: () => ({ data: [], totalCount: 0, onLoadMoreToolkits: vi.fn() }),
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillParticipants: props => {
    shared.skillCalls.push(props);
    return props.skip
      ? { ownSkills: [], catalogSkills: [], total: 0, isFetching: false, onLoadMore: vi.fn() }
      : {
          ownSkills: [{ id: 5, name: 'writer', participantType: ChatParticipantType.Skills }],
          catalogSkills: [{ id: 9, name: 'auditor', participantType: ChatParticipantType.Skills }],
          total: 2,
          isFetching: false,
          onLoadMore: vi.fn(),
        };
  },
}));

describe('useParticipants skills source', () => {
  beforeEach(() => {
    shared.skillCalls = [];
  });

  it('fetches no skills for callers that ask for every type with an empty list', () => {
    const { result } = renderHook(() => useParticipants({ pageSize: 20, query: '' }));

    expect(shared.skillCalls.at(-1).skip).toBe(true);
    expect(result.current.participants).toEqual([]);
  });

  it('merges own and Catalog skills by name once skills are requested', () => {
    const { result } = renderHook(() =>
      useParticipants({ pageSize: 20, query: 'w', types: [ChatParticipantType.Skills], excludePublic: true }),
    );

    expect(shared.skillCalls.at(-1)).toMatchObject({
      skip: false,
      query: 'w',
      pageSize: 20,
      excludePublic: true,
    });
    expect(result.current.participants.map(p => p.name)).toEqual(['auditor', 'writer']);
    expect(result.current.total).toBe(2);
  });
});
