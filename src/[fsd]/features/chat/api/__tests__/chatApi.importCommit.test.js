// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@/api', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  return { eliteaApi };
});

vi.mock('@/[fsd]/entities/attachment/lib', () => ({ normalizeFileExtension: name => name }));
vi.mock('@/common/utils.jsx', () => ({ removeDuplicateObjects: items => items }));

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api');
await import('../chatApi.js');

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const sendCommit = async args => {
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({ conversation: { id: 1 } }), { status: 201 }));
  await makeStore().dispatch(eliteaApi.endpoints.conversationImportCommit.initiate(args));
  const request = fetchSpy.mock.calls.at(-1)[0];
  return { method: request.method, url: new URL(request.url), body: await request.json() };
};

afterEach(() => vi.restoreAllMocks());

describe('conversation import commit', () => {
  it('sends the selected attachments and the skipped participant ids', async () => {
    const { method, url, body } = await sendCommit({
      projectId: 2,
      importId: 'abc',
      selectedAttachments: ['attachments/a.png'],
      skipParticipants: [3, 7],
    });

    expect(method).toBe('PUT');
    expect(url.pathname).toBe('/elitea_core/conversation_import/prompt_lib/2/abc');
    expect(body).toEqual({ selected_attachments: ['attachments/a.png'], skip_participants: [3, 7] });
  });
});
