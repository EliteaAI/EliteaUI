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
  user: { personal_project_id: 5 },
  projectId: 12,
}));
vi.mock('@/[fsd]/features/project-governance', async () => ({
  ProjectGovernanceHelpers:
    await import('@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers'),
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
  useGetAvailableConfigurationsTypeQuery: () => ({ data: api.types, isFetching: api.typesLoading }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => api.projectId,
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
            base_url: { type: 'string', title: 'Base URL' },
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
    type('base_url', 'https://api.github.com');
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(onHitlResume).toHaveBeenCalled());
    expect(api.create).toHaveBeenCalledWith({
      projectId: 12,
      conversationUuid: '11111111-1111-4111-8111-111111111111',
      interrupt_id: 'hitl_7228aa',
      message_id: '22222222-2222-4222-8222-222222222222',
      credential_type: 'github',
      title: 'GitHub',
      fields: { access_token: SECRET, base_url: 'https://api.github.com' },
      ownership: 'personal',
    });
    expect(onHitlResume).toHaveBeenCalledWith({
      action: 'created',
      value: { reference_id: REF },
      interruptId: 'hitl_7228aa',
    });
    expect(JSON.stringify(onHitlResume.mock.calls)).not.toContain(SECRET);
    expect(api.record).toBeNull(); // the mutation record (holding the typed values) is gone once it settled
    expect(screen.getByTestId('credential-form-result')).toHaveTextContent(
      "Credential 'GitHub' (github) is registered, validated: pending approval",
    );
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

  it('offers Private (preselected) or Shared with the team for a regular type in a team project', async () => {
    wrap();
    expect(screen.getByTestId('credential-form-ownership-private')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('credential-form-ownership-shared'));
    type('access_token', SECRET);
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(api.create).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0].ownership).toBe('project_shared');
  });

  it('offers no ownership choice in a personal project', () => {
    api.projectId = 5;
    wrap();
    expect(screen.queryByTestId('credential-form-ownership-shared')).toBeNull();
  });

  it('a sign-in type shows its non-secret fields only, no choice, and creates a delegated private credential', async () => {
    const onHitlResume = wrap(interrupt({ credential_type: 'sharepoint', title: 'SharePoint' }));
    expect(screen.getByTestId('credential-form-sign-in')).toBeInTheDocument();
    expect(screen.queryByTestId('credential-form-field-client_secret')).toBeNull();
    expect(screen.queryByTestId('credential-form-field-client_id')).toBeNull(); // the platform's app, not typed
    expect(screen.queryByTestId('credential-form-ownership-shared')).toBeNull();
    expect(screen.getByTestId('credential-form-create')).toBeDisabled(); // the site URL is required
    type('site_url', 'https://example.sharepoint.com/sites/a');
    fireEvent.click(screen.getByTestId('credential-form-create'));
    await waitFor(() => expect(onHitlResume).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0]).toMatchObject({
      credential_type: 'sharepoint',
      fields: { site_url: 'https://example.sharepoint.com/sites/a' },
      ownership: 'personal',
      auth_mode: 'entra_delegated',
    });
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
});
