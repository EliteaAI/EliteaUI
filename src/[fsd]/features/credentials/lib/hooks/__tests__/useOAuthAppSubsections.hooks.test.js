// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useOAuthAppSubsections } from '../useOAuthAppSubsections.hooks';

const state = { projectId: 5, query: { currentData: undefined, isFetching: false }, skip: undefined };

vi.mock('@/[fsd]/features/credentials/api/oauthAppsApi', () => ({
  useOAuthAppListQuery: (_args, options) => {
    state.skip = options.skip;
    return state.query;
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => state.projectId }));

const SUBSECTIONS = [
  { name: 'Default app', key_fields: ['oauth_app_id'], fields: ['oauth_app_id'] },
  { name: 'Custom app', key_fields: ['client_id'], fields: ['client_id', 'client_secret'] },
];
const names = result => result.current.subsections.map(sub => sub.name);
const render = (settings = {}) =>
  renderHook(() => useOAuthAppSubsections({ credentialType: 'teams', subsections: SUBSECTIONS, settings }));

describe('useOAuthAppSubsections', () => {
  beforeEach(() => {
    state.projectId = 5;
    state.query = { currentData: undefined, isFetching: false };
  });

  it('without a project the Custom app form shows instead of nothing', () => {
    state.projectId = undefined;
    const { result } = render();
    expect(state.skip).toBe(true);
    expect(result.current.isResolving).toBe(false);
    expect(names(result)).toEqual(['Custom app']);
  });

  it('hides the section only until the project’s apps first load', () => {
    state.query = { currentData: undefined, isFetching: true };
    expect(render().result.current.isResolving).toBe(true);
  });

  it('a background refetch keeps the resolved form', () => {
    state.query = {
      currentData: { apps: [{ id: 'a', is_default: true }], mode: 'default' },
      isFetching: true,
    };
    const { result } = render();
    expect(result.current.isResolving).toBe(false);
    expect(names(result)).toEqual(['Default app']);
  });

  it('other credential types are left alone', () => {
    const { result } = renderHook(() =>
      useOAuthAppSubsections({ credentialType: 'jira', subsections: SUBSECTIONS, settings: {} }),
    );
    expect(state.skip).toBe(true);
    expect(names(result)).toEqual(['Default app', 'Custom app']);
  });

  it('switching tabs does not hide the tab left behind (App-only where a Default app applies)', () => {
    state.query = {
      currentData: { apps: [{ id: 'd', is_default: true }], mode: 'default' },
      isFetching: false,
    };
    // Opened as App-only: its own client_id keeps the switcher
    const { result, rerender } = renderHook(props => useOAuthAppSubsections(props), {
      initialProps: {
        credentialType: 'sharepoint',
        subsections: SUBSECTIONS,
        settings: { client_id: 'own' },
      },
    });
    expect(names(result)).toEqual(['Default app', 'Custom app']);
    // The user clicks Default app: client_id is cleared, the tabs stay
    rerender({ credentialType: 'sharepoint', subsections: SUBSECTIONS, settings: { client_id: null } });
    expect(names(result)).toEqual(['Default app', 'Custom app']);
  });

  it('leaving the Default app tab keeps it offered (picked app is gone, no app left)', () => {
    state.query = { currentData: { apps: [], mode: 'custom' }, isFetching: false };
    // Opened referencing an app that no longer applies: the switcher stays so its error shows
    const { result, rerender } = renderHook(props => useOAuthAppSubsections(props), {
      initialProps: { credentialType: 'teams', subsections: SUBSECTIONS, settings: { oauth_app_id: 'gone' } },
    });
    expect(names(result)).toEqual(['Default app', 'Custom app']);
    // The user clicks Custom app: oauth_app_id is cleared, the tabs stay until the form is reopened
    rerender({ credentialType: 'teams', subsections: SUBSECTIONS, settings: { oauth_app_id: null } });
    expect(names(result)).toEqual(['Default app', 'Custom app']);
  });

  it('a reloaded app list is applied to the values the form opened with', () => {
    state.query = { currentData: { apps: [{ id: 'a' }], mode: 'choice' }, isFetching: false };
    const { result, rerender } = renderHook(props => useOAuthAppSubsections(props), {
      initialProps: { credentialType: 'teams', subsections: SUBSECTIONS, settings: {} },
    });
    expect(names(result)).toEqual(['Default app', 'Custom app']);
    state.query = {
      currentData: { apps: [{ id: 'a', is_default: true }], mode: 'default' },
      isFetching: false,
    };
    rerender({ credentialType: 'teams', subsections: SUBSECTIONS, settings: { client_id: 'typed' } });
    expect(names(result)).toEqual(['Default app']);
  });
});
