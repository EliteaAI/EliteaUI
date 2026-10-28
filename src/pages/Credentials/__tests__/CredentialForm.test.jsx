// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import CredentialForm from '../CredentialForm';

const mocks = vi.hoisted(() => ({
  useCreateConfiguration: vi.fn(),
  handleConfigAuthRequired: vi.fn(),
  isDirty: false,
  oauthOptions: null,
  browserLoggedIn: false,
  storedLogin: { hasStoredLogin: false, saveLogin: vi.fn(), removeLogin: vi.fn() },
  logout: vi.fn(),
  LogoutModal: vi.fn(() => null),
}));

// Heavy collaborators; this test reads what the form passes to the test connection and renders for errors
vi.mock('formik', () => ({ useFormikContext: () => ({ setFieldValue: vi.fn() }) }));
vi.mock('react-redux', () => ({ useSelector: () => ({ personal_project_id: 1 }) }));
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }));
vi.mock('@/ComponentsLib/Tooltip', () => ({
  default: ({ children, title }) => <span data-hint={title || undefined}>{children}</span>,
}));
vi.mock('@/[fsd]/features/credentials/lib/constants', () => ({
  ConfigurationTitlesConstants: { Create_Personal_Title: 'p', Create_Project_Title: 'q', Manual_Title: 'm' },
  LlmModelFormConstants: { LLM_MODEL_CONFIGURATION_TYPE: 'llm_model' },
}));
vi.mock('@/[fsd]/features/credentials/lib/helpers', async importOriginal => ({
  ...(await importOriginal()),
  CredentialProbeHelpers: {
    getProbeConfigurationUuid: (details, dirty) => (dirty ? undefined : details?.uuid),
  },
}));
vi.mock('@/[fsd]/features/credentials/lib/hooks', () => ({
  useCredentialPageStoredLogin: () => mocks.storedLogin,
}));
vi.mock('@/[fsd]/features/credentials/ui', () => ({
  CredentialLogoutModal: props => mocks.LogoutModal(props),
  LlmModelForm: () => null,
}));
vi.mock('@/[fsd]/features/interactive-tours/lib/constants', () => ({
  CREDENTIALS_TOUR_TARGET_IDS: { form: 'f', testConnection: 't' },
}));
vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthFlowHelpers: { isMicrosoftEntraEndpoint: () => false },
  McpAuthHelpers: { logout: mocks.logout },
}));
vi.mock('@/[fsd]/features/mcp/lib/hooks', () => ({
  useConfigOAuthModal: options => {
    mocks.oauthOptions = options;
    return { handleConfigAuthRequired: mocks.handleConfigAuthRequired, getModalProps: () => ({}) };
  },
  useMcpTokenChange: () => ({ isLoggedIn: mocks.browserLoggedIn }),
}));
vi.mock('@/[fsd]/features/mcp/ui', () => ({ McpAuthModal: () => null }));
vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolComponentHelpers: { getToolComponent: () => () => null },
}));
vi.mock('@/[fsd]/features/toolkits/ui', () => ({ ToolkitForm: { ToolCustom: () => null } }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useFormDirtyExcluding: () => mocks.isDirty,
  useSelectedProjectId: () => 7,
  useToast: () => ({ toastSuccess: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/ui', async () => ({
  Button: {
    BaseBtn: ({ children, onClick, disabled }) => (
      <button
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    ),
  },
  Chip: { ErrorCodeChip: (await import('@/[fsd]/shared/ui/chip/ErrorCodeChip')).default },
}));
vi.mock('@/[fsd]/shared/ui/tab-group-button', () => ({ FormViewToggle: () => null }));
vi.mock('@/common/constants', async importOriginal => ({ ...(await importOriginal()) }));
vi.mock('@/common/utils.jsx', () => ({ updateObjectByPath: vi.fn() }));
vi.mock('@/hooks/application/useCreateConfiguration', () => ({ default: mocks.useCreateConfiguration }));
vi.mock('@/pages/Applications/Components/Tools/consts', () => ({
  ToolTypes: { custom: { value: 'custom' } },
}));

const theme = createTheme({ palette: { border: { error: '#f00' } } });

const renderForm = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <CredentialForm
        credentialDetails={{ type: 'github', uuid: 'uuid-1', has_test_connection: true, settings: {} }}
        onChangeCredentialDetail={vi.fn()}
        setApiError={vi.fn()}
        setValidationErrorMessages={vi.fn()}
        apiError=""
        {...props}
      />
    </ThemeProvider>,
  );

const lastUuid = () => mocks.useCreateConfiguration.mock.calls.at(-1)[0].configurationUuid;

describe('CredentialForm test connection', () => {
  beforeEach(() => {
    mocks.isDirty = false;
    mocks.useCreateConfiguration.mockReturnValue({ onTestConnection: vi.fn(), isTestingConnection: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('tests the saved credential while the form is clean', () => {
    renderForm();

    expect(lastUuid()).toBe('uuid-1');
  });

  it('tests the typed values once the form is edited', () => {
    mocks.isDirty = true;
    renderForm();

    expect(lastUuid()).toBeUndefined();
  });

  it('tests the typed values of a credential that is not saved yet', () => {
    renderForm({ credentialDetails: { type: 'github', has_test_connection: true, settings: {} } });

    expect(lastUuid()).toBeUndefined();
  });

  it('shows a plain error text without a chip', () => {
    renderForm({ apiError: 'Bad credentials' });

    expect(screen.getByTestId('credential-form-api-error-message')).toHaveTextContent('Bad credentials');
    expect(screen.queryByTestId('credential-form-api-error-code')).toBeNull();
  });

  it('shows a refusal message with its code chip', () => {
    renderForm({ apiError: { message: 'Probe is not allowed.', code: 'DENIED_RBAC' } });

    expect(screen.getByTestId('credential-form-api-error-message')).toHaveTextContent(
      'Probe is not allowed.',
    );
    expect(screen.getByTestId('credential-form-api-error-code')).toHaveTextContent('DENIED_RBAC');
  });
});

// The credential page's login used to stay in the browser only: Test connection asked for a sign-in and the
// page showed Logout, but nothing was saved on the credential, so scheduled runs never had the login.
describe('CredentialForm stored Microsoft login', () => {
  const TEAMS = {
    id: 17,
    project_id: 596,
    type: 'teams',
    uuid: 'uuid-17',
    has_test_connection: true,
    data: { oauth_discovery_endpoint: 'https://login.microsoftonline.com/t' },
    settings: { oauth_discovery_endpoint: 'https://login.microsoftonline.com/t' },
  };

  beforeEach(() => {
    mocks.isDirty = false;
    mocks.browserLoggedIn = false;
    mocks.storedLogin = {
      enabled: true,
      canManageLogin: true,
      hasStoredLogin: false,
      saveLogin: vi.fn().mockResolvedValue(undefined),
      removeLogin: vi.fn().mockResolvedValue(true),
    };
    mocks.useCreateConfiguration.mockReturnValue({ onTestConnection: vi.fn(), isTestingConnection: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('saves the login on the credential when the sign-in finishes, then re-tests the connection', async () => {
    const onTestConnection = vi.fn();
    mocks.useCreateConfiguration.mockReturnValue({ onTestConnection, isTestingConnection: false });
    renderForm({ credentialDetails: TEAMS });

    await act(async () => mocks.oauthOptions.onSuccess());

    expect(mocks.storedLogin.saveLogin).toHaveBeenCalledWith({ isFormDirty: false });
    expect(onTestConnection).toHaveBeenCalledTimes(1);
  });

  it('tells the save the form has unsaved edits, so a login for another app is not stored', async () => {
    mocks.isDirty = true;
    renderForm({ credentialDetails: TEAMS });

    await act(async () => mocks.oauthOptions.onSuccess());

    expect(mocks.storedLogin.saveLogin).toHaveBeenCalledWith({ isFormDirty: true });
  });

  it('turns off the generic sign-in toast, since the save reports the outcome', () => {
    renderForm({ credentialDetails: TEAMS });
    expect(mocks.oauthOptions.showSuccessToast).toBe(false);
  });

  it('keeps the generic sign-in toast for credentials that do not store a login', () => {
    renderForm({ credentialDetails: { ...TEAMS, type: 'github' } });
    expect(mocks.oauthOptions.showSuccessToast).toBe(true);
  });

  it('a member sees a disabled Logout with who manages the stored login', () => {
    mocks.storedLogin = { ...mocks.storedLogin, canManageLogin: false, hasStoredLogin: true };
    renderForm({ credentialDetails: TEAMS });

    const logout = screen.getByText('Logout');
    expect(logout).toBeDisabled();
    expect(logout.closest('[data-hint]')).toHaveAttribute('data-hint', 'Login managed by a project admin');
  });

  it('a member sees a disabled Login asking a project admin when nothing is stored', () => {
    mocks.storedLogin = { ...mocks.storedLogin, canManageLogin: false, hasStoredLogin: false };
    renderForm({ credentialDetails: TEAMS });

    const login = screen.getByText('Login');
    expect(login).toBeDisabled();
    expect(login.closest('[data-hint]')).toHaveAttribute(
      'data-hint',
      'Not connected, ask a project admin to log in',
    );
  });

  // A member's Test connection on a team credential with no stored login used to open the Microsoft
  // sign-in anyway; the login then stayed in their browser only, with no feedback.
  it("a member's Test connection asks for an admin instead of opening the sign-in", () => {
    const setApiError = vi.fn();
    mocks.storedLogin = { ...mocks.storedLogin, canManageLogin: false, hasStoredLogin: false };
    renderForm({ credentialDetails: TEAMS, setApiError });

    const { onConfigAuthRequired } = mocks.useCreateConfiguration.mock.calls.at(-1)[0];
    act(() => onConfigAuthRequired({ requires_authorization: true }, 'https://x', 'uuid-17:https://x'));

    expect(mocks.handleConfigAuthRequired).not.toHaveBeenCalled();
    expect(setApiError).toHaveBeenCalledWith('Not connected, ask a project admin to log in');
  });

  it('an admin still gets the sign-in from Test connection', () => {
    renderForm({ credentialDetails: TEAMS });

    const { onConfigAuthRequired } = mocks.useCreateConfiguration.mock.calls.at(-1)[0];
    act(() => onConfigAuthRequired({ requires_authorization: true }, 'https://x', 'uuid-17:https://x'));

    expect(mocks.handleConfigAuthRequired).toHaveBeenCalledWith(
      { requires_authorization: true },
      'https://x',
      'uuid-17:https://x',
    );
  });

  it("a member's leftover browser token does not show as the project's login", () => {
    mocks.browserLoggedIn = true;
    mocks.storedLogin = { ...mocks.storedLogin, canManageLogin: false, hasStoredLogin: false };
    renderForm({ credentialDetails: TEAMS });

    const login = screen.getByText('Login');
    expect(login).toBeDisabled();
    expect(login.closest('[data-hint]')).toHaveAttribute(
      'data-hint',
      'Not connected, ask a project admin to log in',
    );
    expect(screen.queryByText('Logout')).toBeNull();
  });

  it('an admin gets enabled buttons and no hint', () => {
    renderForm({ credentialDetails: TEAMS });

    const login = screen.getByText('Login');
    expect(login).not.toBeDisabled();
    expect(login.closest('[data-hint]')).toBeNull();
  });

  it('offers Logout when the login is stored on the credential, even with no browser token', () => {
    mocks.storedLogin.hasStoredLogin = true;
    renderForm({ credentialDetails: TEAMS });

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).toBeNull();
  });

  it('Logout removes the stored login, then the browser token', async () => {
    mocks.storedLogin.hasStoredLogin = true;
    renderForm({ credentialDetails: TEAMS });

    await act(async () => mocks.LogoutModal.mock.calls.at(-1)[0].onConfirm());

    expect(mocks.storedLogin.removeLogin).toHaveBeenCalledTimes(1);
    expect(mocks.logout).toHaveBeenCalledWith('uuid-17:https://login.microsoftonline.com/t');
  });

  it('keeps the browser token when the stored login could not be removed', async () => {
    mocks.storedLogin.hasStoredLogin = true;
    mocks.storedLogin.removeLogin = vi.fn().mockResolvedValue(false);
    renderForm({ credentialDetails: TEAMS });

    await act(async () => mocks.LogoutModal.mock.calls.at(-1)[0].onConfirm());

    expect(mocks.logout).not.toHaveBeenCalled();
  });
});
