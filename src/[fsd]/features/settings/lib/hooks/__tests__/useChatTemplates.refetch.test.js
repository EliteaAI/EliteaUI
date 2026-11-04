// @vitest-environment jsdom
import { createElement } from 'react';

import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

// The real `@/api` barrel boots the app store, which cannot run under the test
// environment. A minimal RTK Query base lets the endpoints inject into a real slice.
vi.mock('@/api', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  return { eliteaApi };
});

vi.mock('@/[fsd]/features/settings/api', () => import('@/[fsd]/features/settings/api/chatTemplateApi.js'));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api');
const { useChatTemplates } = await import('../useChatTemplates.hooks.js');

const templatesWithSkillNamed = name => [
  {
    id: 3,
    name: 'Template',
    is_default: true,
    participants: [{ id: 177, name, entity_name: 'skill', project_id: 7 }],
  },
];

const jsonResponse = body =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const participantNames = result => result.current.templates.flatMap(t => t.participants.map(p => p.name));

describe('useChatTemplates freshness', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => cleanup());

  it('shows the renamed participant when the settings page is opened again while the list is still cached', async () => {
    const store = makeStore();
    const wrapper = ({ children }) => createElement(Provider, { store }, children);
    fetchSpy.mockImplementation(() =>
      Promise.resolve(jsonResponse(templatesWithSkillNamed('skill-to-delete'))),
    );

    const first = renderHook(() => useChatTemplates(7), { wrapper });
    await waitFor(() => expect(participantNames(first.result)).toEqual(['skill-to-delete']));
    first.unmount();

    fetchSpy.mockImplementation(() => Promise.resolve(jsonResponse(templatesWithSkillNamed('delete'))));
    const reopened = renderHook(() => useChatTemplates(7), { wrapper });

    await waitFor(() => expect(participantNames(reopened.result)).toEqual(['delete']));
  });
});
