// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import GovernanceReadinessCard from '../GovernanceReadinessCard';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
const api = vi.hoisted(() => ({
  readiness: vi.fn(),
  request: vi.fn(),
  readOwn: vi.fn(),
  own: { rows: [] },
  putValue: vi.fn(),
  types: [],
  toast: { toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() },
}));
vi.mock('@/[fsd]/features/project-governance/api/projectGovernanceApi', () => ({
  useGetGovernanceReadinessQuery: (...args) => api.readiness(...args),
  useRequestGovernedSetupMutation: () => [api.request, { isLoading: false }],
  useLazyGetMyCredentialReferencesQuery: () => [
    api.readOwn,
    { data: api.own, isFetching: false, isError: false },
  ],
  usePutMyCredentialValueMutation: () => [api.putValue, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({ useToast: () => api.toast }));
vi.mock('@/[fsd]/shared/config/store', () => ({ default: { getState: () => ({}), dispatch: () => {} } }));
vi.mock('@/api/configurations', () => ({
  useGetAvailableConfigurationsTypeQuery: () => ({ data: api.types, isFetching: false }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => api.toast,
  useSelectedProjectId: () => 12,
}));

const theme = createTheme({ palette: lightPalette });
const wrap = () =>
  render(
    <ThemeProvider theme={theme}>
      <GovernanceReadinessCard
        entityKind="version"
        entityId={70}
      />
    </ThemeProvider>,
  );
const ITEMS = [
  {
    key: 'binding',
    kind: 'binding',
    ref: null,
    title: 'Agent base',
    state: 'missing',
    requestable: true,
    for: 'shared',
  },
  {
    key: 'reference:u',
    kind: 'reference',
    ref: null,
    title: 'jira',
    state: 'missing',
    requestable: true,
    for: 'me',
  },
  {
    key: 'grant:1:u',
    kind: 'grant',
    ref: 'g',
    title: 'jira for you',
    state: 'pending_approval',
    requestable: false,
    for: 'me',
    escalated: true,
  },
];

describe('Save card (EL-7269)', () => {
  beforeEach(() => {
    api.readiness.mockReturnValue({ data: { items: ITEMS }, isFetching: false });
    api.request.mockReturnValue({ unwrap: () => Promise.resolve({ filed: [{}, {}], items: [] }) });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists what the version still needs with who acts now', () => {
    wrap();
    expect(screen.getAllByTestId('governance-readiness-item')).toHaveLength(3);
    expect(screen.getByTestId('governance-readiness-status-binding')).toHaveTextContent('To request');
    expect(screen.getByTestId('governance-readiness-status-grant:1:u')).toHaveTextContent(
      'Needs a platform operator',
    );
    expect(api.readiness).toHaveBeenCalledWith(
      { projectId: 12, entityKind: 'version', entityId: 70 },
      expect.objectContaining({ skip: false }),
    );
  });

  it('requests everything requestable in one batch', async () => {
    wrap();
    fireEvent.click(screen.getByTestId('governance-readiness-request'));
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith({
        projectId: 12,
        entityKind: 'version',
        entityId: 70,
        keys: ['binding', 'reference:u'],
      }),
    );
    await waitFor(() => expect(api.toast.toastSuccess).toHaveBeenCalled());
  });

  it("shows no Request when nothing is the caller's to request", () => {
    api.readiness.mockReturnValue({ data: { items: [ITEMS[2]] }, isFetching: false });
    wrap();
    expect(screen.queryByTestId('governance-readiness-request')).toBeNull();
  });

  it('shows nothing while governance is off (an empty list), and says approved once what was needed is in place', () => {
    api.readiness.mockReturnValue({ data: { items: [] }, isFetching: false });
    const { rerender } = wrap();
    expect(screen.queryByTestId('governance-readiness')).toBeNull();
    expect(screen.queryByTestId('governance-readiness-ready')).toBeNull();
    api.readiness.mockReturnValue({ data: { items: ITEMS }, isFetching: false });
    rerender(
      <ThemeProvider theme={theme}>
        <GovernanceReadinessCard
          entityKind="version"
          entityId={70}
          sx={{}} // a new prop: the query mock is not reactive, RTK re-renders the card itself
        />
      </ThemeProvider>,
    );
    api.readiness.mockReturnValue({ data: { items: [] }, isFetching: false });
    rerender(
      <ThemeProvider theme={theme}>
        <GovernanceReadinessCard
          entityKind="version"
          entityId={70}
          sx={{}} // a new prop: the query mock is not reactive, RTK re-renders the card itself
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('governance-readiness-ready')).toHaveTextContent('Approved');
  });

  it('says the refusal of a request readably', async () => {
    api.request.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: 'What this needs has changed', code: 'STALE_READINESS' } }),
    });
    wrap();
    fireEvent.click(screen.getByTestId('governance-readiness-request'));
    await waitFor(() =>
      expect(api.toast.toastError).toHaveBeenCalledWith('What this needs has changed (STALE_READINESS)'),
    );
  });
});

describe('Save card: writing your own value inline (EL-7269)', () => {
  const VALUE_ITEM = {
    key: 'reference:cfg-1',
    kind: 'reference',
    ref: 'ref-1',
    title: 'p7269-member-jira',
    state: 'needs_value',
    requestable: false,
    for: 'me',
  };
  const JIRA = {
    type: 'jira',
    config_schema: {
      properties: {
        data: {
          properties: {
            base_url: { type: 'string', title: 'Base Url' },
            api_key: { title: 'Api Key', anyOf: [{ type: 'string', format: 'password' }, { type: 'null' }] },
            token: { title: 'Token', anyOf: [{ type: 'string', format: 'password' }, { type: 'null' }] },
          },
        },
      },
    },
  };

  beforeEach(() => {
    api.types = [JIRA];
    api.own = { rows: [{ id: 'ref-1', provider: 'jira', generation: 0, state: 'pending' }] };
    api.putValue.mockReturnValue({ unwrap: () => Promise.resolve({ generation: 1, state: 'pending' }) });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers Write value only on your own reference whose value is still to be written', () => {
    api.readiness.mockReturnValue({
      data: {
        items: [
          VALUE_ITEM,
          { ...VALUE_ITEM, key: 'reference:cfg-2', for: 'shared' },
          { ...VALUE_ITEM, key: 'reference:cfg-3', state: 'pending' },
          { ...VALUE_ITEM, key: 'reference:cfg-4', ref: null },
        ],
      },
      isFetching: false,
    });
    wrap();
    expect(screen.getByTestId('governance-readiness-write-reference:cfg-1')).toBeInTheDocument();
    expect(screen.queryAllByText('Write value')).toHaveLength(1);
  });

  it('stores the secret fields of its type with the generation you last saw, masked, and never shows them', async () => {
    api.readiness.mockReturnValue({ data: { items: [VALUE_ITEM] }, isFetching: false });
    wrap();
    fireEvent.click(screen.getByTestId('governance-readiness-write-reference:cfg-1'));
    expect(api.readOwn).toHaveBeenCalledWith({ projectId: 12 });
    const token = screen.getByTestId('governance-readiness-value-field-token');
    expect(token).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('governance-readiness-value-field-api_key')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-readiness-value-field-base_url')).toBeNull(); // secret fields only
    expect(screen.getByTestId('governance-readiness-value-store')).toBeDisabled();
    fireEvent.change(token, { target: { value: 'typed-test-value' } });
    fireEvent.click(screen.getByTestId('governance-readiness-value-store'));
    await waitFor(() =>
      expect(api.putValue).toHaveBeenCalledWith({
        projectId: 12,
        referenceId: 'ref-1',
        fields: { token: 'typed-test-value' },
        expectedGeneration: 0,
      }),
    );
    await waitFor(() => expect(api.toast.toastSuccess).toHaveBeenCalled());
    expect(screen.queryByTestId('governance-readiness-value')).toBeNull();
    expect(document.body.textContent).not.toContain('typed-test-value');
  });

  it('reads a refusal inline, with its code', async () => {
    api.readiness.mockReturnValue({ data: { items: [VALUE_ITEM] }, isFetching: false });
    api.putValue.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            error: 'The value changed in the meantime; read it again.',
            code: 'STORE_VERSION_CONFLICT',
          },
        }),
    });
    wrap();
    fireEvent.click(screen.getByTestId('governance-readiness-write-reference:cfg-1'));
    fireEvent.change(screen.getByTestId('governance-readiness-value-field-api_key'), {
      target: { value: 'v' },
    });
    fireEvent.click(screen.getByTestId('governance-readiness-value-store'));
    expect(await screen.findByTestId('governance-readiness-value-error')).toHaveTextContent(
      'The value changed in the meantime; read it again. (STORE_VERSION_CONFLICT)',
    );
  });
});
