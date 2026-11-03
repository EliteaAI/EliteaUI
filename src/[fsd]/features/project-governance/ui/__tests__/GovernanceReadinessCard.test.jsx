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
  toast: { toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() },
}));
vi.mock('@/[fsd]/features/project-governance/api/projectGovernanceApi', () => ({
  useGetGovernanceReadinessQuery: (...args) => api.readiness(...args),
  useRequestGovernedSetupMutation: () => [api.request, { isLoading: false }],
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
