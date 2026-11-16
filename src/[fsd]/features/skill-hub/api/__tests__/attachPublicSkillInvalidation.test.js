// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
const slice = vi.hoisted(() => ({ api: null }));
const makeApi = () => {
  slice.api =
    slice.api ||
    createApi({
      reducerPath: 'eliteaApi',
      baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
      tagTypes: [],
      endpoints: () => ({}),
    });
  return slice.api;
};
vi.mock('@/api/eliteaApi.js', () => {
  const api = makeApi();
  return { eliteaApi: api, reducer: api.reducer, middleware: api.middleware, reducerPath: api.reducerPath };
});
vi.mock('@/[fsd]/shared/config/store', () => ({ default: { getState: () => ({}), dispatch: () => {} } }));

const { configureStore } = await import('@reduxjs/toolkit');
await import('@/[fsd]/features/skill/api/skillsApi.js');
await import('../skillHubApi.js');

const APPLICATION_SKILLS = '/elitea_core/application_skills/prompt_lib/2/325';
const json = body => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
const urlOf = request => (request instanceof Request ? request.url : String(request));
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('attaching a catalog skill refreshes the agent version skills', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  const skillsReads = () =>
    fetchSpy.mock.calls.filter(([request]) => urlOf(request).includes(APPLICATION_SKILLS)).length;

  const attach = async ok => {
    fetchSpy.mockImplementation(async request =>
      urlOf(request).includes(APPLICATION_SKILLS)
        ? json({ skills: [] })
        : json({ results: [{ agent_version_id: 325, ok }] }),
    );
    const { api } = slice;
    const store = configureStore({
      reducer: { eliteaApi: api.reducer },
      middleware: getDefault => getDefault().concat(api.middleware),
    });
    const subscription = store.dispatch(
      api.endpoints.getApplicationSkills.initiate({ projectId: 2, appVersionId: 325 }),
    );
    await subscription;
    expect(skillsReads()).toBe(1);
    await store.dispatch(
      api.endpoints.attachPublicSkill.initiate({
        projectId: 2,
        publicSkillId: 180,
        publicVersionId: 204,
        agentVersionIds: [325],
      }),
    );
    await settle();
    await settle();
    subscription.unsubscribe();
    return skillsReads();
  };

  it('reads the skills again when the server attached the skill', async () => {
    expect(await attach(true)).toBe(2);
  });

  it('keeps the cached skills when the server refused the attach', async () => {
    expect(await attach(false)).toBe(1);
  });
});
