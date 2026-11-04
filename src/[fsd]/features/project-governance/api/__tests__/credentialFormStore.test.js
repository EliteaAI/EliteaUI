// @vitest-environment jsdom
import { createElement } from 'react';

import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { act, renderHook } from '@testing-library/react';

// (#7228) The chat's credential form posts typed values once: on a real RTK Query store the Redux state never holds
// them, and once the request settles and the card resets the mutation (as CredentialFormControl does in `finally`) the
// hook's record holds none either, on success and on a refusal. The request itself carries them (the one place they go).
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
vi.mock('@/api', () => {
  const api = makeApi();
  return { eliteaApi: api, reducer: api.reducer, middleware: api.middleware, reducerPath: api.reducerPath };
});
vi.mock('@/[fsd]/shared/config/store', () => ({ default: { getState: () => ({}), dispatch: () => {} } }));

const { configureStore } = await import('@reduxjs/toolkit');
const { projectGovernanceApi } = await import('../projectGovernanceApi.js');

const SECRET = 'made-up-value-7228-not-a-secret';
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const makeStore = () =>
  configureStore({
    reducer: { eliteaApi: projectGovernanceApi.reducer },
    middleware: getDefault => getDefault().concat(projectGovernanceApi.middleware),
  });
const ARGS = {
  projectId: 6,
  conversationUuid: '11111111-1111-4111-8111-111111111111',
  interrupt_id: 'hitl_1',
  message_id: '22222222-2222-4222-8222-222222222222',
  credential_type: 'github',
  title: 'GitHub',
  fields: { access_token: SECRET },
};

describe('the credential form leaves no typed value in the store (EL-7228)', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it.each([
    ['a created credential', 200, { reference_id: 'r', state: 'pending', requests: [] }],
    ['a refusal', 409, { error: 'This credential is being created already.', code: 'FORM_IN_PROGRESS' }],
  ])('after %s', async (_label, status, body) => {
    const sent = [];
    fetchSpy.mockImplementation(async request => {
      sent.push(await request.clone().text());
      return json(body, status);
    });
    const store = makeStore();
    // the hook the card uses: it keeps the mutation record (its arguments) while the card is mounted
    const wrapper = ({ children }) => createElement(Provider, { store }, children);
    const { result } = renderHook(() => projectGovernanceApi.useCreateCredentialFromChatMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current[0](ARGS)
        .unwrap()
        .catch(() => null);
    });
    // the Redux store never holds a typed value; the hook's record does until the card resets it
    expect(JSON.stringify(store.getState())).not.toContain(SECRET);
    expect(JSON.stringify(result.current[1].originalArgs)).toContain(SECRET);
    act(() => result.current[1].reset());
    expect(result.current[1].originalArgs).toBeUndefined();
    expect(JSON.stringify(store.getState())).not.toContain(SECRET);
    expect(sent).toHaveLength(1);
    expect(JSON.parse(sent[0]).fields.access_token).toBe(SECRET); // the request is the one place it goes
    expect(JSON.parse(sent[0])).not.toHaveProperty('projectId'); // path parameters stay in the path
  });
});
