// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AgentDefaultDatasetSelect from '../AgentDefaultDatasetSelect';

const api = vi.hoisted(() => ({
  current: { dataset_id: null },
  currentError: false,
  currentFetching: false,
  setDefault: vi.fn(),
  permissions: new Set(),
  isPipeline: false,
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../../api', () => ({
  useAgentDefaultEvalDatasetQuery: () => ({
    data: api.current,
    isError: api.currentError,
    isFetching: api.currentFetching,
  }),
  useSetAgentDefaultEvalDatasetMutation: () => [api.setDefault, { isLoading: false }],
}));
vi.mock('../../../lib/hooks', async () => {
  const { default: Routes } = await vi.importActual('@/routes');
  return {
    useEvalRoutes: () => ({
      evaluate: api.isPipeline ? Routes.PipelineEvaluate : Routes.ApplicationsEvaluate,
    }),
  };
});
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => api.permissions.has(permission) }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError, toastSuccess: api.toastSuccess }),
}));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const SUITE_READ = 'models.applications.evaluation.suite.read';
const SUITE_UPDATE = 'models.applications.evaluation.suite.update';
const DATASETS = [
  { id: 3, name: 'Own set', meta: {} },
  { id: 4, name: 'Shared set', is_shared: true, agent_id: 9 },
  { id: 5, name: 'Platform health check', meta: { auto_eval_generated: true } },
];

const theme = createTheme({ palette: lightPalette });
const renderSelect = (datasets = DATASETS) =>
  render(
    <ThemeProvider theme={theme}>
      <AgentDefaultDatasetSelect
        projectId={2}
        applicationId={7}
        datasets={datasets}
      />
    </ThemeProvider>,
  );
const datasetSelect = () => within(screen.getByTestId('agent-default-dataset')).getByRole('combobox');

beforeEach(() => {
  vi.clearAllMocks();
  api.current = { dataset_id: null };
  api.currentError = false;
  api.currentFetching = false;
  api.permissions = new Set([SUITE_READ, SUITE_UPDATE]);
  api.isPipeline = false;
  api.setDefault.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('agent default evaluation dataset', () => {
  it('offers the agent datasets but not the generated health-check copy', async () => {
    renderSelect();
    await userEvent.click(datasetSelect());
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('None')).toBeInTheDocument();
    expect(within(listbox).getByText('Own set')).toBeInTheDocument();
    expect(within(listbox).getByText('Shared set')).toBeInTheDocument();
    expect(within(listbox).queryByText('Platform health check')).not.toBeInTheDocument();
  });

  it('saves the picked dataset', async () => {
    renderSelect();
    await userEvent.click(datasetSelect());
    await userEvent.click(await screen.findByText('Own set'));
    await waitFor(() =>
      expect(api.setDefault).toHaveBeenCalledWith({ projectId: 2, agentId: 7, datasetId: 3 }),
    );
    expect(api.toastSuccess).toHaveBeenCalled();
  });

  it('clears the default with null', async () => {
    api.current = { dataset_id: 3 };
    renderSelect();
    await userEvent.click(datasetSelect());
    await userEvent.click(await screen.findByText('None'));
    await waitFor(() =>
      expect(api.setDefault).toHaveBeenCalledWith({ projectId: 2, agentId: 7, datasetId: null }),
    );
  });

  it('keeps showing a default that is no longer listed', () => {
    api.current = { dataset_id: 11 };
    renderSelect();
    expect(screen.getByTestId('agent-default-dataset')).toHaveTextContent('Dataset 11');
  });

  it('is read-only without the suite update permission', () => {
    api.permissions = new Set([SUITE_READ]);
    renderSelect();
    expect(datasetSelect()).toHaveAttribute('aria-disabled', 'true');
  });

  it('stays locked until the stored default is read', () => {
    api.current = undefined;
    api.currentFetching = true;
    renderSelect();
    expect(datasetSelect()).toHaveAttribute('aria-disabled', 'true');
  });

  it('locks the picker when the stored default cannot be read', () => {
    api.currentError = true;
    renderSelect();
    expect(datasetSelect()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('agent-default-dataset-error')).toBeInTheDocument();
  });

  it('is not shown on pipelines or without the suite read permission', () => {
    api.isPipeline = true;
    const { unmount } = renderSelect();
    expect(screen.queryByTestId('agent-default-dataset-card')).not.toBeInTheDocument();
    unmount();

    api.isPipeline = false;
    api.permissions = new Set();
    renderSelect();
    expect(screen.queryByTestId('agent-default-dataset-card')).not.toBeInTheDocument();
  });

  it('reports a refused save', async () => {
    api.setDefault.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: 'Eval dataset with id 3 not found' } }),
    });
    renderSelect();
    await userEvent.click(datasetSelect());
    await userEvent.click(await screen.findByText('Own set'));
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('Eval dataset with id 3 not found'));
  });
});
