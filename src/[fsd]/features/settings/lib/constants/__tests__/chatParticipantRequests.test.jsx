// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType } from '@/common/constants';
import useParticipants from '@/hooks/chat/useParticipants';
import { cleanup, renderHook } from '@testing-library/react';

import { TABS, TAB_FETCH_TYPES } from '../chatParticipant.constants';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const requests = vi.hoisted(() => ({ applications: [], toolkits: [] }));

const EMPTY_RESULT = vi.hoisted(() => ({
  data: undefined,
  isFetching: false,
  isLoading: false,
  isSuccess: true,
  isError: false,
  refetch: () => {},
}));

const TOOLKIT_SCHEMAS = vi.hoisted(() => ({ toolkitSchemas: {} }));

const reduxState = vi.hoisted(() => ({
  user: { id: 1, personal_project_id: 2 },
  settings: { pageSize: 20 },
  search: { query: '' },
  tags: { tagList: [], tagsOnVisibleCards: [] },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: selector => selector(reduxState),
}));

vi.mock('@/api/applications', () => {
  const record = (args, options) => {
    if (!options?.skip) requests.applications.push(args.params);
    return EMPTY_RESULT;
  };
  return { useApplicationListQuery: record, usePublicApplicationsListQuery: record };
});

vi.mock('@/api/toolkits', () => ({
  useToolkitsListQuery: (args, options) => {
    if (!options?.skip) requests.toolkits.push(args.params);
    return EMPTY_RESULT;
  },
  useListToolkitTypesQuery: () => ({ data: undefined }),
}));

vi.mock('@/[fsd]/shared/config/store', () => ({
  default: { getState: () => ({}), dispatch: vi.fn(), subscribe: () => () => {} },
}));
vi.mock('@/api/admin', () => ({ useUserListQuery: () => EMPTY_RESULT }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/users/usePermissions', () => ({ useCanListThisPublicEntity: () => false }));
vi.mock('@/[fsd]/features/toolkits/lib/hooks/useGetCurrentToolkitSchemas.hooks', () => ({
  useGetCurrentToolkitSchemas: () => TOOLKIT_SCHEMAS,
}));

const renderPickerTab = tab =>
  renderHook(
    () =>
      useParticipants({
        sortBy: 'name',
        sortOrder: 'asc',
        query: '',
        pageSize: 50,
        types: TAB_FETCH_TYPES[tab],
      }),
    { wrapper: MemoryRouter },
  );

const requestedAgentTypes = () => [...new Set(requests.applications.map(params => params.agents_type))];

describe('chat participant picker requests', () => {
  beforeEach(() => {
    requests.applications = [];
    requests.toolkits = [];
  });

  afterEach(() => cleanup());

  it('requests only agents on the Agents tab', () => {
    renderPickerTab(TABS.AGENTS);

    expect(requestedAgentTypes()).toEqual(['classic']);
  });

  it('requests only pipelines on the Pipelines tab', () => {
    renderPickerTab(TABS.PIPELINES);

    expect(requestedAgentTypes()).toEqual(['pipeline']);
  });

  it.each([TABS.TOOLKITS, TABS.MCPS])('requests %s sorted by name ascending', tab => {
    renderPickerTab(tab);

    expect(requests.toolkits.length).toBeGreaterThan(0);
    requests.toolkits.forEach(params => {
      expect(params).toMatchObject({ sort_by: 'name', sort_order: 'asc' });
    });
  });

  it('keeps fetching agents and pipelines together for callers that ask for both', () => {
    renderHook(
      () =>
        useParticipants({
          sortBy: 'name',
          sortOrder: 'asc',
          query: '',
          pageSize: 50,
          types: [ChatParticipantType.Applications, ChatParticipantType.Pipelines],
        }),
      { wrapper: MemoryRouter },
    );

    expect(requestedAgentTypes().sort()).toEqual(['classic', 'pipeline']);
  });
});
