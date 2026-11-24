// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@/api/eliteaApi.js', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  const { middleware, reducer, reducerPath } = eliteaApi;
  return { eliteaApi, middleware, reducer, reducerPath };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api/eliteaApi.js');
await import('../skillFilesApi.js');

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const sentRequest = spy => spy.mock.calls.at(-1)[0];
const SCOPE = { projectId: 2, skillId: 7, versionId: 70 };

describe('skill files API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));
  });

  it('lists the files of a version by project, skill and version, mapping is_text', async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({
        files: [
          { path: 'scripts/fill.py', size: 10, sha256: 'a', content_type: 'text/x-python', is_text: true },
          { path: 'assets/logo.png', size: 99, sha256: 'b', content_type: 'image/png', is_text: false },
        ],
      }),
    );
    const { data } = await makeStore().dispatch(eliteaApi.endpoints.skillVersionFiles.initiate(SCOPE));

    expect(sentRequest(fetchSpy).url).toBe('https://test.local/elitea_core/skill_files/prompt_lib/2/7/70');
    expect(data).toEqual([
      { path: 'scripts/fill.py', size: 10, sha256: 'a', contentType: 'text/x-python', isText: true },
      { path: 'assets/logo.png', size: 99, sha256: 'b', contentType: 'image/png', isText: false },
    ]);
  });

  it('reads one file as text, keeping the folder slashes and encoding each part', async () => {
    fetchSpy.mockResolvedValue(new Response('print(1)', { status: 200 }));
    const { data } = await makeStore().dispatch(
      eliteaApi.endpoints.skillVersionFileText.initiate({ ...SCOPE, path: 'scripts/my tool#1.py' }),
    );

    expect(sentRequest(fetchSpy).url).toBe(
      'https://test.local/elitea_core/skill_file/prompt_lib/2/7/70/scripts/my%20tool%231.py',
    );
    expect(data).toBe('print(1)');
  });

  it('keeps the byte order mark of a file it reads as text', async () => {
    fetchSpy.mockResolvedValue(new Response(new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x0d, 0x0a, 0x62])));
    const { data } = await makeStore().dispatch(
      eliteaApi.endpoints.skillVersionFileText.initiate({ ...SCOPE, path: 'run.ps1' }),
    );
    expect(data).toBe('\uFEFFa\r\nb');
  });

  it('saves edited text as a JSON PUT to its path', async () => {
    await makeStore().dispatch(
      eliteaApi.endpoints.saveSkillVersionFileText.initiate({
        ...SCOPE,
        path: 'scripts/fill.py',
        content: 'print(2)\n',
      }),
    );

    const request = sentRequest(fetchSpy);
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('https://test.local/elitea_core/skill_file/prompt_lib/2/7/70/scripts/fill.py');
    expect(await request.json()).toEqual({ content: 'print(2)\n' });
  });

  it('uploads a file as a multipart PUT to its path', async () => {
    const file = new File(['x'], 'fill.py');
    await makeStore().dispatch(
      eliteaApi.endpoints.uploadSkillVersionFile.initiate({ ...SCOPE, path: 'scripts/fill.py', file }),
    );

    const request = sentRequest(fetchSpy);
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('https://test.local/elitea_core/skill_file/prompt_lib/2/7/70/scripts/fill.py');
    expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
  });

  it('renames with PATCH new_path and deletes with DELETE', async () => {
    const store = makeStore();
    await store.dispatch(
      eliteaApi.endpoints.renameSkillVersionFile.initiate({ ...SCOPE, path: 'a.md', newPath: 'docs/a.md' }),
    );
    const rename = sentRequest(fetchSpy);
    expect(rename.method).toBe('PATCH');
    expect(await rename.json()).toEqual({ new_path: 'docs/a.md' });

    await store.dispatch(
      eliteaApi.endpoints.deleteSkillVersionFile.initiate({ ...SCOPE, path: 'docs/a.md' }),
    );
    const removal = sentRequest(fetchSpy);
    expect(removal.method).toBe('DELETE');
    expect(removal.url).toBe('https://test.local/elitea_core/skill_file/prompt_lib/2/7/70/docs/a.md');
  });

  const subscribeToText = async store => {
    const textUrl = 'https://test.local/elitea_core/skill_file/prompt_lib/2/7/70/b.md';
    fetchSpy.mockImplementation(async request =>
      request.method === 'GET' ? new Response('old', { status: 200 }) : jsonResponse({ ok: true }),
    );
    await store.dispatch(eliteaApi.endpoints.skillVersionFileText.initiate({ ...SCOPE, path: 'b.md' }));
    return () =>
      fetchSpy.mock.calls.filter(([request]) => request.url === textUrl && request.method === 'GET').length;
  };

  it.each([
    ['an upload', 'uploadSkillVersionFile', { path: 'b.md', file: new File(['x'], 'b.md') }],
    ['a rename onto it', 'renameSkillVersionFile', { path: 'a.md', newPath: 'b.md' }],
  ])('reads a path again after %s puts new content there', async (_case, endpoint, args) => {
    const store = makeStore();
    const textReads = await subscribeToText(store);
    expect(textReads()).toBe(1);

    await store.dispatch(eliteaApi.endpoints[endpoint].initiate({ ...SCOPE, ...args }));
    await vi.waitFor(() => expect(textReads()).toBe(2));
  });

  it.each([
    ['a rename away from it', 'renameSkillVersionFile', { path: 'b.md', newPath: 'c.md' }],
    ['a delete', 'deleteSkillVersionFile', { path: 'b.md' }],
  ])('does not read a path again after %s leaves it empty', async (_case, endpoint, args) => {
    const store = makeStore();
    const textReads = await subscribeToText(store);

    await store.dispatch(eliteaApi.endpoints[endpoint].initiate({ ...SCOPE, ...args }));
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(textReads()).toBe(1);
  });
});
