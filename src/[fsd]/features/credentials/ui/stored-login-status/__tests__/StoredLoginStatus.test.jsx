// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import StoredLoginStatus from '../StoredLoginStatus';

// The toolkit-page login bar, also used by the schedule Connections panel (#7401) outside any Formik form

const mocks = vi.hoisted(() => ({ hook: vi.fn() }));

vi.mock('@/[fsd]/features/credentials/lib/hooks', () => ({ useStoredOAuthLogin: mocks.hook }));
vi.mock('@/[fsd]/features/mcp', () => ({ McpAuthModal: () => null, McpLogoutModal: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));

const LOGIN = {
  hasCredential: true,
  credentialTitle: 'team_outlook',
  isConnected: false,
  isBusy: false,
  canManageLogin: true,
  login: vi.fn(),
  logout: vi.fn(),
  modalProps: {},
};
const PROPS = { configurationType: 'outlook', settingsKey: 'outlook_configuration' };
const theme = createTheme(getDesignTokens('light'));

describe('StoredLoginStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hook.mockReturnValue(LOGIN);
  });
  afterEach(cleanup);

  it('reads the credential from the toolkit form settings', () => {
    const ref = { elitea_title: 'from_form', private: false };
    render(
      <ThemeProvider theme={theme}>
        <Formik
          initialValues={{ settings: { outlook_configuration: ref } }}
          onSubmit={() => {}}
        >
          <StoredLoginStatus {...PROPS} />
        </Formik>
      </ThemeProvider>,
    );

    expect(mocks.hook).toHaveBeenCalledWith(expect.objectContaining({ credentialRef: ref, projectId: 5 }));
    expect(screen.getByTestId('stored-login-button')).toHaveTextContent('Login');
  });

  it('takes credentialRef without a Formik form', () => {
    const ref = { elitea_title: 'team_outlook', private: true };
    render(
      <ThemeProvider theme={theme}>
        <StoredLoginStatus
          {...PROPS}
          compact
          credentialRef={ref}
        />
      </ThemeProvider>,
    );

    expect(mocks.hook).toHaveBeenCalledWith(expect.objectContaining({ credentialRef: ref }));
    expect(screen.getByTestId('stored-login-status')).toHaveTextContent('Not Connected');
  });
});
