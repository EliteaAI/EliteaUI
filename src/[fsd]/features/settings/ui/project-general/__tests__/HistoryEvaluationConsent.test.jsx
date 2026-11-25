// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HistoryEvaluationConsent from '../HistoryEvaluationConsent';

const api = vi.hoisted(() => ({
  current: { history_evaluation_consent: false },
  setConsent: vi.fn(),
  permitted: true,
  canManageSettings: true,
  adminLoading: false,
  currentError: false,
  currentFetching: false,
  toastError: vi.fn(),
}));
vi.mock('@/[fsd]/widgets/evaluation/api', () => ({
  useEvalHistoryConsentQuery: () => ({
    data: api.current,
    isError: api.currentError,
    isFetching: api.currentFetching,
  }),
  useSetEvalHistoryConsentMutation: () => [api.setConsent, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/[fsd]/features/settings/lib/hooks/useCanManageProjectSettings.hooks', () => ({
  useCanManageProjectSettings: () => ({
    canManageSettings: api.canManageSettings,
    isLoading: api.adminLoading,
  }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => api.permitted }) }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError }),
}));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const renderConsent = () =>
  render(
    <ThemeProvider theme={theme}>
      <HistoryEvaluationConsent />
    </ThemeProvider>,
  );
const checkbox = () => screen.getByTestId('evaluation-history-consent-checkbox').querySelector('input');

beforeEach(() => {
  vi.clearAllMocks();
  api.current = { history_evaluation_consent: false };
  api.permitted = true;
  api.canManageSettings = true;
  api.adminLoading = false;
  api.currentError = false;
  api.currentFetching = false;
  api.setConsent.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('chat history evaluation consent', () => {
  it('starts off and turns on for an admin', async () => {
    renderConsent();
    expect(checkbox()).not.toBeChecked();

    await userEvent.click(checkbox());

    await waitFor(() => expect(api.setConsent).toHaveBeenCalledWith({ projectId: 2, consent: true }));
  });

  it('shows a stored consent as checked', () => {
    api.current = { history_evaluation_consent: true };
    renderConsent();
    expect(checkbox()).toBeChecked();
  });

  it('is read-only with a hint for a non-admin', () => {
    api.canManageSettings = false;
    renderConsent();
    expect(checkbox()).toBeDisabled();
    expect(screen.getByTestId('evaluation-history-consent-admin-hint')).toBeInTheDocument();
  });

  it('stays locked until the stored value is read', () => {
    api.current = undefined;
    api.currentFetching = true;
    renderConsent();
    expect(checkbox()).toBeDisabled();
  });

  it('locks the toggle when the stored value cannot be read', () => {
    api.currentError = true;
    renderConsent();
    expect(checkbox()).toBeDisabled();
    expect(screen.getByTestId('evaluation-history-consent-card')).toHaveTextContent(
      'Could not load the setting',
    );
  });

  it('reports a refused save', async () => {
    api.setConsent.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: 'Only project admins can change it' } }),
    });
    renderConsent();
    await userEvent.click(checkbox());
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('Only project admins can change it'));
  });
});
