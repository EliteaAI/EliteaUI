// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useLlmModelCredentialType } from '../useLlmModelCredentialType.hooks.js';

const onRefresh = vi.fn();
let credentialsData;

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { personal_project_id: 99 } }) }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('../useCredentialsData.hooks.js', () => ({ useCredentialsData: () => credentialsData }));

const DIAL_CREDENTIAL = { elitea_title: 'dial-cred', private: false };
const LOADED_DIAL = [{ elitea_title: 'dial-cred', type: 'ai_dial', project_id: 2 }];

const listState = overrides => ({
  configurations: [],
  hasFetchedData: true,
  isFetching: false,
  onRefresh,
  ...overrides,
});

describe('useLlmModelCredentialType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onRefresh.mockReset();
    credentialsData = listState();
  });

  it('resolves the selected credential type from the loaded list', () => {
    credentialsData = listState({ configurations: LOADED_DIAL });
    const { result } = renderHook(() => useLlmModelCredentialType(DIAL_CREDENTIAL));
    expect(result.current).toEqual({ credentialType: 'ai_dial', isCredentialTypePending: false });
  });

  it('is not pending when no credential is selected', () => {
    credentialsData = listState({ hasFetchedData: false });
    const { result } = renderHook(() => useLlmModelCredentialType(undefined));
    expect(result.current.isCredentialTypePending).toBe(false);
  });

  it.each([
    ['still loading', { hasFetchedData: false }],
    ['refetching', { isFetching: true }],
  ])('is pending while the list is %s', (_, state) => {
    credentialsData = listState(state);
    const { result } = renderHook(() => useLlmModelCredentialType(DIAL_CREDENTIAL));
    expect(result.current).toEqual({ credentialType: '', isCredentialTypePending: true });
  });

  it('refetches once for a credential missing from a stale list and stays pending until then', () => {
    onRefresh.mockImplementation(() => {
      credentialsData = listState({ hasFetchedData: false });
    });
    const { result, rerender } = renderHook(() => useLlmModelCredentialType(DIAL_CREDENTIAL));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    rerender();
    expect(result.current.isCredentialTypePending).toBe(true);

    credentialsData = listState({ hasFetchedData: false, isFetching: true });
    rerender();
    expect(result.current.isCredentialTypePending).toBe(true);

    credentialsData = listState({ configurations: LOADED_DIAL });
    rerender();
    expect(result.current).toEqual({ credentialType: 'ai_dial', isCredentialTypePending: false });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('stops waiting once a refetch still cannot find the credential', () => {
    const { result, rerender } = renderHook(() => useLlmModelCredentialType(DIAL_CREDENTIAL));
    credentialsData = listState();
    rerender();

    expect(result.current).toEqual({ credentialType: '', isCredentialTypePending: false });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
