// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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

vi.mock('@/[fsd]/shared/lib/helpers', () => ({ getFilenameFromContentDisposition: (header, fallback) => fallback }));
vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  ProjectBackupHelpers: { getRestoreInvalidatedTags: () => [] },
}));
vi.mock('../chatTemplateApi', () => ({ TAG_TYPE_CHAT_TEMPLATES: 'TAG_TYPE_CHAT_TEMPLATES' }));

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api');
await import('../projectBackupApi.js');

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const requestedUrl = async args => {
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response('x', { headers: { 'content-disposition': 'attachment; filename="b.zip"' } }),
    );
  await makeStore().dispatch(eliteaApi.endpoints.downloadProjectBackup.initiate(args));
  const arg = fetchSpy.mock.calls.at(-1)[0];
  return new URL(arg instanceof Request ? arg.url : String(arg));
};

afterEach(() => vi.restoreAllMocks());

describe('project backup download', () => {
  it('passes include_skill_files only when the skill files are left out', async () => {
    const without = await requestedUrl({ projectId: 7, includeSkillFiles: 'none' });
    expect(without.pathname).toBe('/admin/project_backup/prompt_lib/7');
    expect(without.searchParams.get('include_skill_files')).toBe('none');

    const withFiles = await requestedUrl({ projectId: 7, includeChats: 'with_attachments' });
    expect(withFiles.searchParams.has('include_skill_files')).toBe(false);
    expect(withFiles.searchParams.get('include_chats')).toBe('with_attachments');
  });
});
