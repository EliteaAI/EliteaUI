// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ChatHitlActions from '../ChatHitlActions';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
const api = vi.hoisted(() => ({
  create: vi.fn(),
  record: null, // the mutation's record (its arguments) as RTK keeps it until reset
  types: [],
  typesLoading: false,
  typesFailed: false,
  retry: vi.fn(),
  user: { personal_project_id: 5 },
  projectId: 12,
  projectName: 'Team Alpha',
}));
vi.mock('@/[fsd]/features/project-governance', async () => ({
  ProjectGovernanceHelpers:
    await import('@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers'),
  ProjectGovernanceConstants:
    await import('@/[fsd]/features/project-governance/lib/constants/projectGovernance.constants'),
  useCreateCredentialFromChatMutation: () => [
    args => {
      api.record = { originalArgs: args };
      return { unwrap: () => api.create(args) };
    },
    {
      isLoading: false,
      reset: () => {
        api.record = null;
      },
    },
  ],
}));
vi.mock('@/api/configurations', () => ({
  useGetAvailableConfigurationsTypeQuery: () => ({
    data: api.types,
    isFetching: api.typesLoading,
    isError: api.typesFailed,
    refetch: api.retry,
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => api.projectId,
  useSelectedProjectName: () => api.projectName,
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() }),
}));
// the markdown renderer reads the theme settings over the API; plain text is enough here
vi.mock('@/[fsd]/shared/ui/markdown', () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock('@/[fsd]/shared/ui', async importOriginal => ({
  ...(await importOriginal()),
  Markdown: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/[fsd]/shared/config/store', () => ({ default: { getState: () => ({}), dispatch: () => {} } }));

const SECRET = 'made-up-value-7228-not-a-secret';
const REF = '33333333-3333-4333-8333-333333333333';
const TYPES = [
  {
    type: 'github',
    config_schema: {
      properties: {
        data: {
          properties: {
            base_url: { type: 'string', title: 'Base URL', prefill_value: 'https://api.github.com' },
            hosting: {
              anyOf: [{ enum: ['Auto', 'Cloud'], type: 'string' }, { type: 'null' }],
              default: 'Auto',
            },
            access_token: { type: 'string', format: 'password', title: 'Access token' },
            refresh_token: { type: 'string', format: 'password' },
          },
          required: ['access_token'],
        },
      },
    },
  },
  {
    type: 'sharepoint',
    config_schema: {
      properties: {
        data: {
          properties: {
            site_url: { type: 'string', title: 'Site URL' },
            client_id: { type: 'string', title: 'Client ID' },
            client_secret: { type: 'string', format: 'password', title: 'Client secret' },
          },
          required: ['site_url'],
        },
      },
    },
  },
];
const interrupt = over => ({
  interrupt_id: 'hitl_7228aa',
  guardrail_type: 'credential_form',
  credential_type: 'github',
  title: 'GitHub',
  purpose: 'list repositories',
  available_actions: ['created', 'cancel'],
  ...over,
});
const theme = createTheme({ palette: lightPalette });
const wrap = (hitlInterrupt = interrupt(), onHitlResume = vi.fn(), disabled = false) => {
  const store = configureStore({ reducer: { user: () => api.user, settings: () => ({ mode: 'light' }) } });
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ChatHitlActions
          hitlInterrupt={hitlInterrupt}
          interruptId={hitlInterrupt.interrupt_id}
          messageId="22222222-2222-4222-8222-222222222222"
          conversationUuid="11111111-1111-4111-8111-111111111111"
          onHitlResume={onHitlResume}
          disabled={disabled}
        />
      </ThemeProvider>
    </Provider>,
  );
  return onHitlResume;
};
const type = (name, value) =>
  fireEvent.change(screen.getByTestId(`credential-form-field-${name}`), { target: { value } });

describe('CredentialFormControl (#7228)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.types = TYPES;
    api.typesLoading = false;
    api.typesFailed = false;
    api.record = null;
    api.user = { personal_project_id: 5 };
    api.projectId = 12;
    api.create.mockResolvedValue({
      reference_id: REF,
      title: 'GitHub',
      credential_type: 'github',
      state: 'validated',
      requests: [],
    });
  });
  afterEach(() => cleanup());

  it('renders by guardrail_type: the credential form, not the approve buttons or a clarifying question', () => {
    wrap();
    expect(screen.getByTestId('credential-form')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-hitl-actions-panel')).toBeNull();
    expect(screen.getByText('list repositories')).toBeInTheDocument();
  });

  it('masks the secret fields, never offers a stored sign-in field, and keeps Create off until required ones are filled', () => {
    wrap();
    fireEvent.click(screen.getByTestId('credential-form-more-fields'));
    expect(screen.getByTestId('credential-form-field-access_token')).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('credential-form-field-base_url')).toHaveAttribute('type', 'text');
    expect(screen.queryByTestId('credential-form-field-refresh_token')).toBeNull();
    expect(screen.getByTestId('credential-form-create')).toBeDisabled();
    type('access_token', SECRET);
    expect(screen.getByTestId('credential-form-create')).toBeEnabled();
  });

  it('Create posts the form, then resumes with the reference id and nothing else from it', async () => {
    const onHitlResume = wrap();
    type('access_token', SECRET);
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(onHitlResume).toHaveBeenCalled());
    expect(api.create).toHaveBeenCalledWith({
      projectId: 12,
      conversationUuid: '11111111-1111-4111-8111-111111111111',
      interrupt_id: 'hitl_7228aa',
      message_id: '22222222-2222-4222-8222-222222222222',
      credential_type: 'github',
      title: 'GitHub',
      fields: { access_token: SECRET, base_url: 'https://api.github.com', hosting: 'Auto' }, // defaults prefilled
    }); // (round 5) no ownership: the server derives it from the project
    expect(onHitlResume).toHaveBeenCalledWith({
      action: 'created',
      value: { reference_id: REF },
      interruptId: 'hitl_7228aa',
    });
    expect(JSON.stringify(onHitlResume.mock.calls)).not.toContain(SECRET);
    expect(api.record).toBeNull(); // the mutation record (holding the typed values) is gone once it settled
    expect(screen.getByTestId('credential-form-result')).toHaveTextContent(
      "Credential 'GitHub' (github) is registered and checked: it waits for a project admin's approval",
    );
    // still mounted and not decided (the resume did not go through): one click resumes it again
    fireEvent.click(screen.getByTestId('credential-form-continue'));
    expect(onHitlResume).toHaveBeenLastCalledWith({
      action: 'created',
      value: { reference_id: REF },
      interruptId: 'hitl_7228aa',
    });
  });

  it('a refused Create reads inline with its code, keeps the card and resumes nothing', async () => {
    api.create.mockRejectedValue({
      data: { error: 'This credential request is no longer waiting.', code: 'NOT_FOUND' },
    });
    const onHitlResume = wrap();
    type('access_token', SECRET);
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(screen.getByTestId('credential-form-error')).toBeInTheDocument());
    expect(screen.getByTestId('credential-form-error')).toHaveTextContent('no longer waiting. (NOT_FOUND)');
    expect(onHitlResume).not.toHaveBeenCalled();
    expect(api.record).toBeNull();
  });

  it('Cancel resumes with cancel and no value', () => {
    const onHitlResume = wrap();
    type('access_token', SECRET);
    fireEvent.click(screen.getByTestId('credential-form-cancel'));
    expect(onHitlResume).toHaveBeenCalledWith({ action: 'cancel', interruptId: 'hitl_7228aa' });
    expect(api.create).not.toHaveBeenCalled();
  });

  it('says a team project credential is the project one, approved by an admin, and offers no choice', async () => {
    wrap();
    expect(screen.getByTestId('credential-form-ownership')).toHaveTextContent(
      'Shared with the project Team Alpha; a project admin approves it',
    );
    expect(screen.queryByRole('button', { name: /only me|shared with the team/i })).toBeNull();
    type('access_token', SECRET);
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(api.create).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0]).not.toHaveProperty('ownership');
  });

  it('says a personal project credential is private to you', () => {
    api.projectId = 5;
    wrap();
    expect(screen.getByTestId('credential-form-ownership')).toHaveTextContent('Private to you');
  });

  it('a sign-in type shows its non-secret fields only, says private to you, and creates a delegated credential', async () => {
    const onHitlResume = wrap(interrupt({ credential_type: 'sharepoint', title: 'SharePoint' }));
    expect(screen.getByTestId('credential-form-sign-in')).toBeInTheDocument();
    expect(screen.queryByTestId('credential-form-field-client_secret')).toBeNull();
    expect(screen.queryByTestId('credential-form-field-client_id')).toBeNull(); // the platform's app, not typed
    expect(screen.getByTestId('credential-form-ownership')).toHaveTextContent('Private to you'); // team project too
    expect(screen.getByTestId('credential-form-create')).toBeDisabled(); // the site URL is required
    type('site_url', 'https://example.sharepoint.com/sites/a');
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(onHitlResume).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0]).toMatchObject({
      credential_type: 'sharepoint',
      fields: { site_url: 'https://example.sharepoint.com/sites/a' },
      auth_mode: 'entra_delegated',
    });
    expect(api.create.mock.calls[0][0]).not.toHaveProperty('ownership');
  });

  it('an unknown credential type offers Cancel only', () => {
    wrap(interrupt({ credential_type: 'unheard_of' }));
    expect(screen.getByTestId('credential-form-unknown-type')).toHaveTextContent('Unknown credential type');
    expect(screen.queryByTestId('credential-form-create')).toBeNull();
    expect(screen.getByTestId('credential-form-cancel')).toBeEnabled();
  });

  it('reloaded from the persisted interrupt, the same card renders; a created one offers Continue only', () => {
    wrap(interrupt());
    expect(screen.getByTestId('credential-form-field-access_token')).toBeInTheDocument();
    cleanup();
    const onHitlResume = wrap(
      interrupt({
        credential_form_result: {
          reference_id: REF,
          title: 'GitHub',
          credential_type: 'github',
          state: 'pending',
        },
      }),
    );
    expect(screen.queryByTestId('credential-form-field-access_token')).toBeNull();
    fireEvent.click(screen.getByTestId('credential-form-continue'));
    expect(onHitlResume).toHaveBeenCalledWith({
      action: 'created',
      value: { reference_id: REF },
      interruptId: 'hitl_7228aa',
    });
  });

  it('a decided card cannot be used', () => {
    wrap(interrupt(), vi.fn(), true);
    expect(screen.getByTestId('credential-form-create')).toBeDisabled();
    expect(screen.getByTestId('credential-form-cancel')).toBeDisabled();
  });

  // --- fix round -----------------------------------------------------------------------------------------------

  it("shows what the agent chose as plain text, never rendered (no link from a model's title)", () => {
    wrap(
      interrupt({
        title: 'Sign in first at [our page](https://example.invalid)',
        purpose: '**bold** `code`',
      }),
    );
    expect(screen.getByTestId('credential-form-asked')).toHaveTextContent(
      'The agent asks you to create the credential "Sign in first at [our page](https://example.invalid)" (github).',
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('**bold** `code`')).toBeInTheDocument();
  });

  it('EL-7228 shows the required and primary sign-in fields first and folds the rest behind More fields', () => {
    wrap();
    expect(screen.getByTestId('credential-form-field-access_token')).toBeInTheDocument();
    expect(screen.queryByTestId('credential-form-field-base_url')).toBeNull();
    expect(screen.queryByTestId('credential-form-field-hosting')).toBeNull();
    expect(screen.getByTestId('credential-form-more-fields')).toHaveTextContent('More fields (2)');
    fireEvent.click(screen.getByTestId('credential-form-more-fields'));
    expect(screen.queryByTestId('credential-form-more-fields')).toBeNull();
    expect(screen.getByTestId('credential-form-field-base_url')).toBeInTheDocument();
    expect(screen.getByTestId('credential-form-field-hosting')).toBeInTheDocument();
  });

  it("prefills the schema's defaults and offers an enum as a select", () => {
    wrap();
    fireEvent.click(screen.getByTestId('credential-form-more-fields'));
    expect(screen.getByTestId('credential-form-field-base_url')).toHaveValue('https://api.github.com');
    expect(screen.getByTestId('credential-form-field-hosting')).toBeInTheDocument();
    expect(screen.getByTestId('credential-form-field-hosting')).toHaveTextContent('Auto');
  });

  it('offers Retry when the credential types cannot be read, and Cancel', () => {
    api.typesFailed = true;
    wrap();
    expect(screen.getByTestId('credential-form-types-failed')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('credential-form-retry'));
    expect(api.retry).toHaveBeenCalled();
    expect(screen.queryByTestId('credential-form-create')).toBeNull();
    expect(screen.getByTestId('credential-form-cancel')).toBeEnabled();
  });

  it('says when the Elitea sign-in is not a Microsoft one', async () => {
    api.create.mockResolvedValue({
      reference_id: REF,
      title: 'SharePoint',
      credential_type: 'sharepoint',
      state: 'pending',
      check: 'DENIED_ASSERTION_SOURCE_UNSUPPORTED',
    });
    const onHitlResume = wrap(interrupt({ credential_type: 'sharepoint', title: 'SharePoint' }));
    type('site_url', 'https://example.sharepoint.com/sites/a');
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(onHitlResume).toHaveBeenCalled());
    expect(screen.getByTestId('credential-form-not-microsoft')).toHaveTextContent('not a Microsoft sign-in');
  });
});
