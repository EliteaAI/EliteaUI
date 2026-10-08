// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { act, renderHook } from '@testing-library/react';

import { useSkillParticipants } from '../useSkillParticipants.hooks';

const shared = vi.hoisted(() => ({
  projectId: 2,
  own: [],
  catalog: [],
  ownData: undefined,
  catalogData: undefined,
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => shared.projectId }));

vi.mock('@/hooks/useDebounceValue', () => ({ default: value => value }));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillListQuery: (args, options) => {
    shared.own.push({ args, options });
    return { currentData: options.skip ? undefined : shared.ownData, isFetching: false };
  },
}));

vi.mock('@/[fsd]/features/skill-hub/api', () => ({
  usePagedPublicSkillsQuery: (args, options) => {
    shared.catalog.push({ args, options });
    return { currentData: options.skip ? undefined : shared.catalogData, isFetching: false };
  },
}));

const page = (rows, total) => ({ rows, total });

describe('useSkillParticipants', () => {
  beforeEach(() => {
    shared.projectId = 2;
    shared.own = [];
    shared.catalog = [];
    shared.ownData = page([{ id: 5, name: 'writer' }], 3);
    shared.catalogData = page([{ id: 5, name: 'writer' }], 1);
  });

  it('requests nothing while skipped', () => {
    const { result } = renderHook(() => useSkillParticipants({ skip: true }));

    expect(shared.own.at(-1).options.skip).toBe(true);
    expect(shared.catalog.at(-1).options.skip).toBe(true);
    expect(result.current.ownSkills).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('searches both sources by name and tags each row with its project', () => {
    const { result } = renderHook(() => useSkillParticipants({ query: 'wri', pageSize: 20 }));

    expect(shared.own.at(-1).args).toEqual({
      projectId: 2,
      page: 0,
      pageSize: 20,
      params: { sort_by: 'name', sort_order: 'asc', query: 'wri' },
    });
    expect(shared.catalog.at(-1).args.params.query).toBe('wri');
    expect(result.current.ownSkills).toEqual([
      { id: 5, name: 'writer', project_id: 2, participantType: ChatParticipantType.Skills },
    ]);
    expect(result.current.catalogSkills[0].project_id).toBe(PUBLIC_PROJECT_ID);
    expect(result.current.total).toBe(4);
  });

  it('loads the next page only of a source that has more rows', () => {
    const { result } = renderHook(() => useSkillParticipants({ pageSize: 1 }));

    act(() => result.current.onLoadMore());

    expect(shared.own.at(-1).args.page).toBe(1);
    expect(shared.catalog.at(-1).args.page).toBe(0);
  });

  it('starts a new search from the first page', () => {
    const { result, rerender } = renderHook(props => useSkillParticipants(props), {
      initialProps: { query: '', pageSize: 1 },
    });
    act(() => result.current.onLoadMore());

    rerender({ query: 'rev', pageSize: 1 });

    expect(shared.own.at(-1).args.page).toBe(0);
  });

  it('skips the Catalog in the public project and when public entities are excluded', () => {
    renderHook(() => useSkillParticipants({ excludePublic: true }));
    expect(shared.catalog.at(-1).options.skip).toBe(true);

    shared.projectId = PUBLIC_PROJECT_ID;
    renderHook(() => useSkillParticipants({}));
    expect(shared.catalog.at(-1).options.skip).toBe(true);
  });
});
