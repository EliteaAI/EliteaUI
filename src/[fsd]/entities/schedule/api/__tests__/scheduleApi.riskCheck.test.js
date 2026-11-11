// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse, makeStore as makeStoreFor } from './scheduleApi.testSetup.js';

vi.mock('@/api/eliteaApi.js', async () => (await import('./scheduleApi.testSetup.js')).createEliteaApiMock());

const { scheduleApi } = await import('../scheduleApi.js');

// risk review before saving a schedule
const BASE = '/elitea_core/schedules/prompt_lib/5';
const CHECK_ANSWER = {
  blocking: [],
  sensitive: [{ code: 'sensitive_action', toolkit: 'Outlook', tool: 'send_email', badge: 'sends_messages' }],
  notices: [],
  run_without_asking_allowed: true,
  fingerprint: 'fp-1',
};
const RISK_ACK = { fingerprint: 'fp-1', confirmed_name: 'Daily digest' };

const makeStore = () => makeStoreFor(scheduleApi);

const requestAt = async (spy, index) => {
  const [arg] = spy.mock.calls[index];
  return { url: new URL(arg.url), method: arg.method, body: await arg.clone().json() };
};

describe('schedule risk check API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('sends a dry-run check with POST to.../check and returns the findings', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(CHECK_ANSWER));

    const result = await makeStore().dispatch(
      scheduleApi.endpoints.checkScheduleRisk.initiate({
        projectId: 5,
        entity_type: 'agent',
        application_id: 7,
        version_id: 71,
      }),
    );

    const request = await requestAt(fetchSpy, 0);
    expect(request.method).toBe('POST');
    expect(request.url.pathname).toBe(`${BASE}/check`);
    expect(request.body).toEqual({ entity_type: 'agent', application_id: 7, version_id: 71 });
    expect(result.data).toEqual(CHECK_ANSWER);
  });

  it('sends schedule_id and run_id in the check body', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(CHECK_ANSWER));

    await makeStore().dispatch(
      scheduleApi.endpoints.checkScheduleRisk.initiate({
        projectId: 5,
        entity_type: 'agent',
        application_id: 7,
        version_id: 71,
        schedule_id: 9,
        run_id: 41,
      }),
    );

    const request = await requestAt(fetchSpy, 0);
    expect(request.url.pathname).toBe(`${BASE}/check`);
    expect(request.body).toEqual({
      entity_type: 'agent',
      application_id: 7,
      version_id: 71,
      schedule_id: 9,
      run_id: 41,
    });
  });

  it('a check refetches no schedule list, because it saves nothing', async () => {
    fetchSpy.mockImplementation(async arg =>
      arg.url.endsWith('/check') ? jsonResponse(CHECK_ANSWER) : jsonResponse({ total: 0, rows: [] }),
    );
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, pageSize: 1 }));

    await store.dispatch(
      scheduleApi.endpoints.checkScheduleRisk.initiate({ projectId: 5, application_id: 7, version_id: 71 }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('sends risk_ack in the create body', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ id: 1 }));

    await makeStore().dispatch(
      scheduleApi.endpoints.createSchedule.initiate({
        projectId: 5,
        name: 'Daily digest',
        risk_ack: RISK_ACK,
      }),
    );

    const request = await requestAt(fetchSpy, 0);
    expect(request.url.pathname).toBe(BASE);
    expect(request.body).toEqual({ name: 'Daily digest', risk_ack: RISK_ACK });
  });

  it('sends risk_ack in the update body', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ id: 3 }));

    await makeStore().dispatch(
      scheduleApi.endpoints.updateSchedule.initiate({
        projectId: 5,
        scheduleId: 3,
        name: 'Daily digest',
        risk_ack: RISK_ACK,
      }),
    );

    const request = await requestAt(fetchSpy, 0);
    expect(request.method).toBe('PUT');
    expect(request.url.pathname).toBe(`${BASE}/3`);
    expect(request.body).toEqual({ name: 'Daily digest', risk_ack: RISK_ACK });
  });
});

// The owner's connections check of a saved trigger can switch it off on the server (#7401)
describe('schedule connections check API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  const CHECK = {
    projectId: 5,
    entity_type: 'agent',
    application_id: 7,
    version_id: 71,
    trigger_kind: 'webhook',
  };

  it('posts to .../connections and returns the rows', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ rows: [], all_ok: true, blocking: false, lost_login: false }));

    const result = await makeStore().dispatch(scheduleApi.endpoints.checkScheduleConnections.initiate(CHECK));

    const request = await requestAt(fetchSpy, 0);
    expect(request.url.pathname).toBe(`${BASE}/connections`);
    expect(request.body).toEqual({
      entity_type: 'agent',
      application_id: 7,
      version_id: 71,
      trigger_kind: 'webhook',
    });
    expect(result.data.all_ok).toBe(true);
  });

  it('refetches the saved schedule only when the check switched it off', async () => {
    const store = makeStore();
    const detail = { id: 3, enabled: true };
    fetchSpy.mockImplementation(async arg => {
      const { pathname } = new URL(arg.url);
      return pathname.endsWith('/connections')
        ? jsonResponse({
            rows: [],
            all_ok: false,
            blocking: true,
            lost_login: pathname.length > 0 && store.lost,
          })
        : jsonResponse(detail);
    });
    await store.dispatch(scheduleApi.endpoints.getSchedule.initiate({ projectId: 5, scheduleId: 3 }));
    const detailCalls = () =>
      fetchSpy.mock.calls.filter(([arg]) => new URL(arg.url).pathname === `${BASE}/3`).length;
    expect(detailCalls()).toBe(1);

    store.lost = false;
    await store.dispatch(
      scheduleApi.endpoints.checkScheduleConnections.initiate({ ...CHECK, schedule_id: 3 }),
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(detailCalls()).toBe(1);

    store.lost = true;
    await store.dispatch(
      scheduleApi.endpoints.checkScheduleConnections.initiate({ ...CHECK, schedule_id: 3 }),
    );
    await vi.waitFor(() => expect(detailCalls()).toBe(2));
  });
});
