// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { McpAuthFlowConstants } from '@/[fsd]/features/mcp/lib/constants';
import asMetadata6689 from '@/[fsd]/features/mcp/lib/helpers/__fixtures__/asMetadata6689.json';
import McpAuthModal from '@/[fsd]/features/mcp/ui/modal/McpAuthModal';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.hoisted(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
  };
});

vi.mock('@/[fsd]/features/mcp/lib/helpers/mcpAuthFlow.helpers', () => ({
  startMcpAuthFlow: vi.fn(),
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers/mcpAuth.helpers', () => ({
  isPrebuildMcpType: () => false,
  getSavedCredentials: () => null,
  setSavedCredentials: vi.fn(),
  removeSavedCredentials: vi.fn(),
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Input: {
    StyledInputEnhancer: props => (
      <input
        placeholder={props.placeholder}
        aria-label={typeof props.label === 'string' ? props.label : undefined}
        value={props.value}
        type={props.type || 'text'}
        required={props.required}
        onChange={props.onChange}
      />
    ),
  },
  Checkbox: {
    BaseCheckbox: props => (
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
      />
    ),
  },
}));

const findServerMetadata = name => asMetadata6689.servers.find(server => server.name === name).metadata;

const theme = createTheme({
  palette: {
    background: { default: { tertiary: '#f5f5f5' } },
    border: { lines: '#e0e0e0' },
    boxShadow: { default: 'none' },
    text: { secondary: '#666666' },
    status: { rejected: '#c00000', published: '#008000' },
    icon: { primary: '#000000' },
  },
});

const renderModal = (oauthAuthorizationServer, providedSettings, formClientId) =>
  render(
    <ThemeProvider theme={theme}>
      <McpAuthModal
        open
        serverUrl="https://mcp.example.com"
        tokenStorageKey="cred-1:https://mcp.example.com"
        mcpAuthMetadata={{
          authServers: ['https://mcp.example.com'],
          oauthAuthorizationServer,
          providedSettings,
          resourceScopes: undefined,
        }}
        formClientId={formClientId}
        projectId={2}
        toolkitId={1}
        onClose={vi.fn()}
        onCancel={vi.fn()}
      />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('McpAuthModal field visibility (#6689)', () => {
  it('shows the Client Secret input for Asana v2, which requires a pre-registered confidential client', () => {
    renderModal(findServerMetadata('Asana v2'));

    expect(screen.getByPlaceholderText('Enter OAuth client secret')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter OAuth client ID from the provider')).toBeInTheDocument();
  });

  it('hides the Client Secret and Client ID inputs for Miro, which supports automatic client registration', () => {
    renderModal(findServerMetadata('Miro'));

    expect(screen.queryByPlaceholderText('Enter OAuth client secret')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter OAuth client ID from the provider')).not.toBeInTheDocument();
  });
});

describe('McpAuthModal client secret requirement (#6689)', () => {
  const typeInto = (placeholder, value) =>
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  const typeClientId = value => typeInto('Enter OAuth client ID from the provider', value);
  const typeClientSecret = value => typeInto('Enter OAuth client secret', value);
  const authorizeButton = () => screen.getByRole('button', { name: 'Authorize' });

  it('lets a PKCE server authorize with only a Client ID, keeping the secret field optional', () => {
    renderModal(findServerMetadata('Asana v2'));

    expect(screen.getByPlaceholderText('Enter OAuth client secret')).not.toBeRequired();
    expect(authorizeButton()).toBeDisabled();

    typeClientId('asana-client-id');

    expect(authorizeButton()).toBeEnabled();
    expect(screen.getByText(/Client Secret if the application has one/)).toBeInTheDocument();
  });

  it('lets a PKCE server authorize with both a Client ID and a Client Secret', () => {
    renderModal(findServerMetadata('Box'));

    typeClientId('box-client-id');
    typeClientSecret('box-client-secret');

    expect(authorizeButton()).toBeEnabled();
  });

  it('keeps the secret mandatory for a server without PKCE, as before', () => {
    renderModal(findServerMetadata('Entra v2 tenant'));

    expect(screen.getByPlaceholderText('Enter OAuth client secret')).toBeRequired();

    typeClientId('entra-client-id');

    expect(authorizeButton()).toBeDisabled();
    expect(screen.getByText(/Please provide your client credentials/)).toBeInTheDocument();

    typeClientSecret('entra-client-secret');

    expect(authorizeButton()).toBeEnabled();
  });

  it.each([
    [
      'SharePoint-style Entra',
      'Entra v2 tenant',
      { mcp_client_id: 'backend-client-id', has_mcp_client_secret: true },
    ],
    ['pre-built GitHub', 'GitHub', { mcp_client_id: 'backend-client-id', mcp_client_secret: '****' }],
  ])(
    'asks for no credentials when the backend supplies them (%s)',
    (_label, serverName, providedSettings) => {
      renderModal(findServerMetadata(serverName), providedSettings);

      expect(
        screen.queryByPlaceholderText('Enter OAuth client ID from the provider'),
      ).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter OAuth client secret')).not.toBeInTheDocument();
      expect(screen.queryByText(/pre-registered OAuth application/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Please provide/)).not.toBeInTheDocument();
      expect(authorizeButton()).toBeEnabled();
    },
  );
});

describe('McpAuthModal description names only the credential fields it shows (#6689)', () => {
  const descriptionText = () => screen.getByText(/This MCP server requires OAuth authorization/).textContent;
  const secretInput = () => screen.getByPlaceholderText('Enter OAuth client secret');

  it.each([
    ['from the backend', { mcp_client_id: 'backend-client-id' }, undefined],
    ['from saved toolkit credentials', undefined, 'saved-client-id'],
  ])(
    'asks only for an optional secret on a PKCE server whose Client ID is known %s',
    (_route, providedSettings, formClientId) => {
      renderModal(findServerMetadata('GitHub'), providedSettings, formClientId);

      expect(
        screen.queryByPlaceholderText('Enter OAuth client ID from the provider'),
      ).not.toBeInTheDocument();
      expect(secretInput()).not.toBeRequired();
      expect(descriptionText()).toContain('Provide its Client Secret if the application has one.');
      expect(descriptionText()).not.toContain('Client ID');
      expect(screen.getByRole('button', { name: 'Authorize' })).toBeEnabled();
    },
  );

  it('asks only for the mandatory secret on a server without PKCE whose Client ID is known', () => {
    renderModal(findServerMetadata('Entra v2 tenant'), { mcp_client_id: 'backend-client-id' });

    expect(secretInput()).toBeRequired();
    expect(descriptionText()).toContain('Please provide its Client Secret.');
    expect(descriptionText()).not.toContain('Client ID');
    expect(screen.getByRole('button', { name: 'Authorize' })).toBeDisabled();
  });

  it('asks only for the Client ID when the backend supplies the secret', () => {
    renderModal(findServerMetadata('Asana v2'), { has_mcp_client_secret: true });

    expect(screen.queryByPlaceholderText('Enter OAuth client secret')).not.toBeInTheDocument();
    expect(descriptionText()).toContain('Please provide its Client ID.');
    expect(descriptionText()).not.toContain('Client Secret');
  });

  it('keeps the flow message on a server that accepts clients without a secret', () => {
    renderModal({ ...findServerMetadata('Asana v2'), token_endpoint_auth_methods_supported: ['none'] });

    expect(screen.getByPlaceholderText('Enter OAuth client ID from the provider')).toBeInTheDocument();
    expect(descriptionText()).toContain('Using PKCE flow for enhanced security.');
    expect(descriptionText()).not.toContain('pre-registered');
  });
});

describe('McpAuthModal without usable authorization server metadata (#6689)', () => {
  const { AUTH_SERVER_METADATA_UNAVAILABLE } = McpAuthFlowConstants.MCP_OAUTH_ERRORS;

  const expectDiscoveryErrorInsteadOfCredentialForm = () => {
    expect(screen.getByTestId('mcp-auth-metadata-unavailable')).toHaveTextContent(
      AUTH_SERVER_METADATA_UNAVAILABLE,
    );
    expect(screen.queryByPlaceholderText('Enter OAuth client ID from the provider')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter OAuth client secret')).not.toBeInTheDocument();
    expect(screen.queryByText(/pre-registered OAuth application/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Authorize' })).toBeDisabled();
  };

  it('shows the discovery error when the backend sent no metadata document', () => {
    renderModal(undefined);

    expectDiscoveryErrorInsteadOfCredentialForm();
  });

  it('shows the discovery error when the metadata document lacks a token endpoint', () => {
    renderModal({ ...findServerMetadata('Box'), token_endpoint: undefined });

    expectDiscoveryErrorInsteadOfCredentialForm();
  });

  it('keeps the credential form and no discovery error when metadata has both endpoints', () => {
    renderModal(findServerMetadata('Box'));

    expect(screen.queryByTestId('mcp-auth-metadata-unavailable')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter OAuth client secret')).toBeInTheDocument();
  });
});
