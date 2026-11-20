// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useLoadSkills } from '../useLoadSkills.hooks';

const fixture = vi.hoisted(() => ({
  pageQuery: {},
  useSkillListQuery: vi.fn(() => ({ data: undefined, isFetching: false })),
}));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillListQuery: (...args) => fixture.useSkillListQuery(...args),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  usePageQuery: () => fixture.pageQuery,
  useAuthorIdFromUrl: () => undefined,
}));

describe('useLoadSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.pageQuery = {
      query: 'pdf',
      page: 0,
      pageSize: 20,
      setPage: vi.fn(),
      tagList: [],
      selectedTagIds: [],
      projectId: 7,
    };
  });
  afterEach(() => cleanup());

  it('asks for the search together with its page, as the page query resets them', () => {
    renderHook(() => useLoadSkills());
    const [args] = fixture.useSkillListQuery.mock.calls[0];
    expect(args).toMatchObject({ projectId: 7, page: 0, pageSize: 20, params: { query: 'pdf' } });
  });
});
