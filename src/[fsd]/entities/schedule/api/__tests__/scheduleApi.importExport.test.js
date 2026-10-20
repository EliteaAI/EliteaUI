// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse, makeStore as makeStoreFor, requestedUrls } from './scheduleApi.testSetup.js';

vi.mock('@/api/eliteaApi.js', async () => (await import('./scheduleApi.testSetup.js')).createEliteaApiMock());

const { scheduleApi } = await import('../scheduleApi.js');

const makeStore = () => makeStoreFor(scheduleApi);

const yamlResponse = headers =>
  new Response('schedules: []', {
    status: 200,
    headers: { 'Content-Type': 'application/x-yaml', ...headers },
  });

describe('R2 EL-7011 schedule export query', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('R2.1 requests the export of the project without ids and returns a blob', async () => {
    fetchSpy.mockImplementation(async () => yamlResponse());
    const result = await makeStore().dispatch(
      scheduleApi.endpoints.exportSchedules.initiate({ projectId: 5 }),
    );

    const [url] = requestedUrls(fetchSpy);
    expect(url.pathname).toBe('/elitea_core/schedules/prompt_lib/5/export');
    expect(url.searchParams.has('ids')).toBe(false);
    expect(result.data.blob).toBeInstanceOf(Blob);
  });

  it('R2.2 uses the file name from Content-Disposition', async () => {
    fetchSpy.mockImplementation(async () =>
      yamlResponse({ 'Content-Disposition': 'attachment; filename="schedules_5.yaml"' }),
    );
    const result = await makeStore().dispatch(
      scheduleApi.endpoints.exportSchedules.initiate({ projectId: 5 }),
    );

    expect(result.data.filename).toBe('schedules_5.yaml');
  });

  it('R2.3 falls back to schedules_<project>.yaml without Content-Disposition', async () => {
    fetchSpy.mockImplementation(async () => yamlResponse());
    const result = await makeStore().dispatch(
      scheduleApi.endpoints.exportSchedules.initiate({ projectId: 7 }),
    );

    expect(result.data.filename).toBe('schedules_7.yaml');
  });

  it('R2.4 EL-7011 keeps the JSON error of a 403 in error.data', async () => {
    fetchSpy.mockImplementation(async () => jsonResponse({ error: 'Forbidden for you' }, 403));
    const result = await makeStore().dispatch(
      scheduleApi.endpoints.exportSchedules.initiate({ projectId: 5 }),
    );

    expect(result.error.status).toBe(403);
    expect(result.error.data).toEqual({ error: 'Forbidden for you' });
  });
});

describe('R3 EL-7011 schedule import mutation', () => {
  let fetchSpy;
  const file = new File(['schedules: []'], 'schedules.yaml', { type: 'application/x-yaml' });
  const report = created => ({ created, skipped: [], failed: [] });

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('R3.2 posts the file as multipart field file to the import endpoint', async () => {
    const appendSpy = vi.spyOn(FormData.prototype, 'append');
    fetchSpy.mockImplementation(async () => jsonResponse(report([])));
    const result = await makeStore().dispatch(
      scheduleApi.endpoints.importSchedules.initiate({ projectId: 5, file }),
    );

    const request = fetchSpy.mock.calls[0][0];
    expect(new URL(request.url).pathname).toBe('/elitea_core/schedules/prompt_lib/5/import');
    expect(request.method).toBe('POST');
    expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data/);
    expect(appendSpy).toHaveBeenCalledWith('file', file);
    expect(result.data).toEqual(report([]));
  });

  const listCalls = () => requestedUrls(fetchSpy).filter(url => url.pathname.endsWith('/prompt_lib/5'));

  const importThenCountListCalls = async (importResponse, status = 200) => {
    fetchSpy.mockImplementation(async arg => {
      const url = new URL(arg instanceof Request ? arg.url : String(arg));
      return url.pathname.endsWith('/import')
        ? jsonResponse(importResponse, status)
        : jsonResponse({ rows: [] });
    });
    const store = makeStore();
    const subscription = store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5 }));
    await subscription;
    expect(listCalls()).toHaveLength(1);
    await store.dispatch(scheduleApi.endpoints.importSchedules.initiate({ projectId: 5, file }));
    await new Promise(resolve => setTimeout(resolve, 20));
    subscription.unsubscribe();
    return listCalls().length;
  };

  it('R3.5 reloads the schedule list when schedules were created', async () => {
    expect(await importThenCountListCalls(report([{ name: 'a', schedule_id: 1 }]))).toBe(2);
  });

  it('R3.5 does not reload the list when nothing was created', async () => {
    expect(await importThenCountListCalls(report([]))).toBe(1);
  });

  it('R3.4 EL-7011 does not reload the list on a 400', async () => {
    expect(await importThenCountListCalls({ error: 'not valid YAML' }, 400)).toBe(1);
  });
});
