// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CredentialForm from '../CredentialForm';

const mocks = vi.hoisted(() => ({ useCreateConfiguration: vi.fn(), isDirty: false }));

// Heavy collaborators; this test reads what the form passes to the test connection and renders for errors
vi.mock('formik', () => ({ useFormikContext: () => ({ setFieldValue: vi.fn() }) }));
vi.mock('react-redux', () => ({ useSelector: () => ({ personal_project_id: 1 }) }));
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/[fsd]/features/credentials/lib/constants', () => ({
  ConfigurationTitlesConstants: { Create_Personal_Title: 'p', Create_Project_Title: 'q', Manual_Title: 'm' },
  LlmModelFormConstants: { LLM_MODEL_CONFIGURATION_TYPE: 'llm_model' },
}));
vi.mock('@/[fsd]/features/credentials/ui', () => ({
  CredentialLogoutModal: () => null,
  LlmModelForm: () => null,
}));
vi.mock('@/[fsd]/features/interactive-tours/lib/constants', () => ({
  CREDENTIALS_TOUR_TARGET_IDS: { form: 'f', testConnection: 't' },
}));
vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthFlowHelpers: { isMicrosoftEntraEndpoint: () => false },
  McpAuthHelpers: {},
}));
vi.mock('@/[fsd]/features/mcp/lib/hooks', () => ({
  useConfigOAuthModal: () => ({ handleConfigAuthRequired: vi.fn(), getModalProps: () => ({}) }),
  useMcpTokenChange: () => ({ isLoggedIn: false }),
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
  Button: { BaseBtn: ({ children, onClick }) => <button onClick={onClick}>{children}</button> },
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
