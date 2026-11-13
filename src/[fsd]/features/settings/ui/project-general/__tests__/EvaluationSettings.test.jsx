// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EvaluationSettings from '../EvaluationSettings';

const api = vi.hoisted(() => ({
  datasets: [],
  current: { dataset_id: null, name: null },
  setDefault: vi.fn(),
  permitted: true,
  canManageSettings: true,
  adminLoading: false,
  currentError: false,
  currentFetching: false,
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('@/[fsd]/widgets/evaluation/api', () => ({
  useEvalDatasetsQuery: () => ({ data: api.datasets }),
  useProjectDefaultEvalDatasetQuery: () => ({
    data: api.current,
    isError: api.currentError,
    isFetching: api.currentFetching,
  }),
  useSetProjectDefaultEvalDatasetMutation: () => [api.setDefault, { isLoading: false }],
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
  useToast: () => ({ toastError: api.toastError, toastSuccess: api.toastSuccess }),
}));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const renderSettings = () =>
  render(
    <ThemeProvider theme={theme}>
      <EvaluationSettings />
    </ThemeProvider>,
  );
const datasetSelect = () => within(screen.getByTestId('evaluation-default-dataset')).getByRole('combobox');

beforeEach(() => {
  vi.clearAllMocks();
  api.datasets = [
    { id: 3, name: 'Shared set', is_shared: true },
    { id: 4, name: 'Private set', is_shared: false },
  ];
  api.current = { dataset_id: null, name: null };
  api.permitted = true;
  api.canManageSettings = true;
  api.adminLoading = false;
  api.currentError = false;
  api.currentFetching = false;
  api.setDefault.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('project default evaluation dataset', () => {
  it('offers only shared datasets next to the health-check fallback', async () => {
    renderSettings();
    await userEvent.click(datasetSelect());
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('None (platform health check)')).toBeInTheDocument();
    expect(within(listbox).getByText('Shared set')).toBeInTheDocument();
    expect(within(listbox).queryByText('Private set')).not.toBeInTheDocument();
  });

  it('saves the picked dataset', async () => {
    renderSettings();
    await userEvent.click(datasetSelect());
    await userEvent.click(await screen.findByText('Shared set'));
    await waitFor(() => expect(api.setDefault).toHaveBeenCalledWith({ projectId: 2, datasetId: 3 }));
    expect(api.toastSuccess).toHaveBeenCalled();
  });

  it('clears the default with null', async () => {
    api.current = { dataset_id: 3, name: 'Shared set' };
    renderSettings();
    await userEvent.click(datasetSelect());
    await userEvent.click(await screen.findByText('None (platform health check)'));
    await waitFor(() => expect(api.setDefault).toHaveBeenCalledWith({ projectId: 2, datasetId: null }));
  });

  it('keeps showing a default that is no longer listed', () => {
    api.current = { dataset_id: 9, name: 'Gone set' };
    renderSettings();
    expect(screen.getByTestId('evaluation-default-dataset')).toHaveTextContent('Gone set');
  });

  it('is read-only with a hint for a non-admin', () => {
    api.canManageSettings = false;
    renderSettings();
    expect(datasetSelect()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('evaluation-default-dataset-admin-hint')).toBeInTheDocument();
  });

  it('shows no admin hint while the admin check is loading', () => {
    api.canManageSettings = false;
    api.adminLoading = true;
    renderSettings();
    expect(screen.queryByTestId('evaluation-default-dataset-admin-hint')).not.toBeInTheDocument();
  });

  it('stays locked until the stored default is read', () => {
    api.current = undefined;
    api.currentFetching = true;
    renderSettings();
    expect(datasetSelect()).toHaveAttribute('aria-disabled', 'true');
  });

  it('locks the picker when the stored default cannot be read', () => {
    api.currentError = true;
    renderSettings();
    expect(datasetSelect()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('evaluation-default-dataset-error')).toBeInTheDocument();
  });

  it('reports a refused save', async () => {
    api.setDefault.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: 'Dataset 3 must be shared' } }),
    });
    renderSettings();
    await userEvent.click(datasetSelect());
    await userEvent.click(await screen.findByText('Shared set'));
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('Dataset 3 must be shared'));
  });
});
