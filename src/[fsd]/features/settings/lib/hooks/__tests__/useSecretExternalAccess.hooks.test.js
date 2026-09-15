// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSecretExternalAccess } from '../useSecretExternalAccess.hooks.js';

vi.mock('@/common/utils.jsx', () => ({
  buildErrorMessage: () => 'boom',
}));

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));

// Kept as a plain descriptor so a test can run the recipe against its own draft.
vi.mock('@/api/eliteaApi', () => ({
  eliteaApi: {
    util: { updateQueryData: (endpoint, arg, recipe) => ({ endpoint, arg, recipe }) },
  },
}));

const setup = ({ editSecret, rows = [] }) => {
  const state = { rows };
  const setRows = vi.fn(updater => {
    state.rows = updater(state.rows);
  });
  const toastError = vi.fn();

  const { result } = renderHook(() =>
    useSecretExternalAccess({ projectId: 1, editSecret, setRows, toastError }),
  );

  return { result, state, toastError };
};

describe('useSecretExternalAccess', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('sends the flag without the value so the secret is never pulled into the browser', async () => {
    const editSecret = vi.fn().mockResolvedValue({ data: {} });
    const { result, state } = setup({
      editSecret,
      rows: [{ id: 'existing-TOKEN', name: 'TOKEN', allow_external_access: false }],
    });

    await act(async () => {
      await result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    expect(editSecret).toHaveBeenCalledWith({
      projectId: 1,
      name: 'TOKEN',
      allow_external_access: true,
    });
    expect(state.rows[0].allow_external_access).toBe(true);
  });

  it('touches only the toggled row, so unsaved input elsewhere survives', async () => {
    const editSecret = vi.fn().mockResolvedValue({ data: {} });
    const { result, state } = setup({
      editSecret,
      rows: [
        { id: 'existing-A', name: 'A', allow_external_access: false },
        { id: 'existing-B', name: 'B', allow_external_access: false, value: 'typed-but-unsaved' },
      ],
    });

    await act(async () => {
      await result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    expect(state.rows[1]).toEqual({
      id: 'existing-B',
      name: 'B',
      allow_external_access: false,
      value: 'typed-but-unsaved',
    });
  });

  it('patches the list cache, which the rows are rebuilt from', async () => {
    const editSecret = vi.fn().mockResolvedValue({ data: {} });
    const { result, state } = setup({
      editSecret,
      rows: [{ id: 'existing-TOKEN', name: 'TOKEN', allow_external_access: false }],
    });

    await act(async () => {
      await result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    const [patch] = dispatch.mock.calls.at(-1);
    expect(patch.endpoint).toBe('secretsList');
    expect(patch.arg).toBe(1);

    const draft = [
      { name: 'OTHER', allow_external_access: false },
      { name: 'TOKEN', allow_external_access: false },
    ];
    patch.recipe(draft);

    expect(draft).toEqual([
      { name: 'OTHER', allow_external_access: false },
      { name: 'TOKEN', allow_external_access: true },
    ]);
  });

  it('rolls the row back and reports the failure', async () => {
    const editSecret = vi.fn().mockResolvedValue({ error: { status: 500 } });
    const { result, state, toastError } = setup({
      editSecret,
      rows: [{ id: 'existing-TOKEN', name: 'TOKEN', allow_external_access: false }],
    });

    await act(async () => {
      await result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    expect(state.rows[0].allow_external_access).toBe(false);
    expect(toastError).toHaveBeenCalledWith('boom');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('reports a denied toggle without leaking the generic error text', async () => {
    const editSecret = vi.fn().mockResolvedValue({ error: { status: 403 } });
    const { result, state, toastError } = setup({
      editSecret,
      rows: [{ id: 'existing-TOKEN', name: 'TOKEN', allow_external_access: false }],
    });

    await act(async () => {
      await result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    expect(toastError).toHaveBeenCalledWith('The access is not allowed');
  });

  it('keeps an uncreated row local so the flag rides along on the create request', async () => {
    const editSecret = vi.fn();
    const { result, state } = setup({
      editSecret,
      rows: [{ id: 'new-1', name: '', isNew: true }],
    });

    await act(async () => {
      await result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    expect(editSecret).not.toHaveBeenCalled();
    expect(state.rows[0].allow_external_access).toBe(true);
  });

  it('marks only the toggled row as pending', async () => {
    let resolveEdit;
    const editSecret = vi.fn(
      () =>
        new Promise(resolve => {
          resolveEdit = resolve;
        }),
    );
    const { result, state } = setup({
      editSecret,
      rows: [
        { id: 'existing-A', name: 'A', allow_external_access: false },
        { id: 'existing-B', name: 'B', allow_external_access: false },
      ],
    });

    let pending;
    act(() => {
      pending = result.current.handleToggleExternalAccess(state.rows[0], true);
    });

    expect(result.current.isExternalAccessPending('existing-A')).toBe(true);
    expect(result.current.isExternalAccessPending('existing-B')).toBe(false);

    await act(async () => {
      resolveEdit({ data: {} });
      await pending;
    });

    expect(result.current.isExternalAccessPending('existing-A')).toBe(false);
  });
});
