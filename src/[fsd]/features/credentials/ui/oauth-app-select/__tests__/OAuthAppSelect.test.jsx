// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import OAuthAppSelect from '../OAuthAppSelect';

const queryState = { data: { apps: [], mode: 'custom' }, isFetching: false };

vi.mock('@/[fsd]/features/credentials/api/oauthAppsApi', () => ({
  useOAuthAppListQuery: () => queryState,
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <div data-testid="app-select">
      {props.options.map(option => option.label).join(',')}|{props.helperText}
    </div>
  ),
}));

const AUTHORITY = 'https://login.microsoftonline.com/organizations';
const APP = (id, extra = {}) => ({
  id,
  name: `App ${id}`,
  oauth_discovery_endpoint: AUTHORITY,
  ...extra,
});

const editField = vi.fn();

const renderSelect = props =>
  render(
    <ThemeProvider theme={createTheme()}>
      <OAuthAppSelect
        k="oauth_app_id"
        credentialType="teams"
        editField={editField}
        fieldPath="settings.oauth_app_id"
        endpointPath="settings.oauth_discovery_endpoint"
        {...props}
      />
    </ThemeProvider>,
  );

describe('OAuthAppSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState.data = { apps: [], mode: 'custom' };
    queryState.isFetching = false;
  });
  afterEach(() => cleanup());

  it('asks for an admin app when none is configured', () => {
    renderSelect({ value: null });
    expect(screen.getByTestId('toolkit-field-oauth_app_id-no-apps')).toHaveTextContent(
      'Ask your administrator',
    );
    expect(editField).not.toHaveBeenCalled();
  });

  it('preselects the admin default app for a new credential, and nothing else', () => {
    queryState.data = { apps: [APP('a'), APP('b', { is_default: true })] };
    renderSelect({ value: null });
    expect(editField).toHaveBeenCalledTimes(1);
    expect(editField).toHaveBeenCalledWith('settings.oauth_app_id', 'b');
  });

  it('hides the selector when only one app applies', () => {
    queryState.data = { apps: [APP('a')] };
    renderSelect({ value: 'a', endpoint: AUTHORITY });
    expect(screen.getByTestId('toolkit-field-oauth_app_id-single-app')).toHaveTextContent(
      'managed by your administrator',
    );
    expect(screen.queryByTestId('app-select')).not.toBeInTheDocument();
  });

  it('shows a selector when several apps apply', () => {
    queryState.data = { apps: [APP('a'), APP('b')] };
    renderSelect({ value: 'a', endpoint: AUTHORITY });
    expect(screen.getByTestId('app-select')).toHaveTextContent('App a,App b');
  });

  it('reports an app that is gone', () => {
    queryState.data = { apps: [APP('a'), APP('b')] };
    renderSelect({ value: 'deleted', endpoint: AUTHORITY });
    expect(screen.getByTestId('app-select')).toHaveTextContent('Switch to Custom app');
  });

  it('mirrors the app authority so the token key matches', () => {
    queryState.data = { apps: [APP('a')] };
    renderSelect({ value: 'a', endpoint: null });
    expect(editField).toHaveBeenCalledWith('settings.oauth_discovery_endpoint', AUTHORITY);
  });
});
