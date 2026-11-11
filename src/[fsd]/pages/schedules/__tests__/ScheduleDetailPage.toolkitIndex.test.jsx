// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { enGB } from 'date-fns/locale';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';

import ScheduleDetailPage from '../ScheduleDetailPage';

// The Edit schedule page of a toolkit index with its real form and Runs card; only the data layer is replaced.

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const ROUTE = '/toolkits/all/3/index/docs-index/schedules/9';
const SCHEDULE = {
  id: 9,
  name: 'Nightly refresh',
  description: 'Keeps the index fresh',
  entity_type: 'toolkit_index',
  application_id: null,
  toolkit_id: 3,
  index_name: 'docs-index',
  version_id: null,
  run_mode: null,
  prompt: null,
  variables: [],
  cron: '0 6 * * *',
  timezone: 'Europe/Kyiv',
  expires_at: null,
  enabled: true,
  trigger_kind: 'cron',
  owner: { id: 3, name: 'Anna K.' },
  allowed_actions: ['run', 'edit', 'pause', 'resume', 'delete'],
};
const RUNS = [
  {
    id: 12,
    trigger: 'manual',
    status: 'success',
    started_at: '2026-10-21T09:30:00Z',
    duration_ms: 10000,
    index_name: 'docs-index',
  },
  {
    id: 11,
    trigger: 'cron',
    status: 'success',
    started_at: '2026-10-20T06:00:00Z',
    duration_ms: 12000,
    index_name: 'docs-index',
  },
];

// Hook results keep one identity between renders, as the real hooks do; a fresh object each call loops the effects
const mocks = vi.hoisted(() => {
  const riskResult = { blocking: [], sensitive: [], notices: [], run_without_asking_allowed: true };
  return {
    runsData: { rows: [], total: 0 },
    update: [vi.fn()],
    run: [vi.fn()],
    scheduleQuery: null,
    runsQuery: null,
    draftRunsQuery: { currentData: undefined },
    runQuery: { currentData: undefined },
    settingsQuery: { data: { allow_run_without_asking: true }, isError: false },
    riskMutation: [() => ({ unwrap: () => Promise.resolve(riskResult) })],
    connectionsMutation: [vi.fn()],
    indexOptionsQuery: { data: [], isFetching: false, isError: false },
    applicationQuery: { currentData: undefined, isFetching: false },
    toolkitQuery: { currentData: { id: 3, toolkit_name: 'Docs toolkit' } },
    toolkitsListQuery: { data: { rows: [], total: 0 }, isFetching: false },
    iconMeta: () => ({}),
    rowActions: { onExport: vi.fn(), isBusy: false },
    toast: { toastError: vi.fn(), toastSuccess: vi.fn(), toastInfo: vi.fn(), toastWarning: vi.fn() },
    collapse: { shouldCollapseTabs: false },
    height: { componentRef: null, componentHeight: 0 },
  };
});

vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useGetScheduleQuery: () => mocks.scheduleQuery,
  useUpdateScheduleMutation: () => mocks.update,
  useRunScheduleMutation: () => mocks.run,
  useGetScheduleRunsQuery: () => mocks.runsQuery,
  useGetDraftTestRunsQuery: () => mocks.draftRunsQuery,
  useGetScheduleRunQuery: () => mocks.runQuery,
  useGetScheduleSettingsQuery: () => mocks.settingsQuery,
  useCheckScheduleRiskMutation: () => mocks.riskMutation,
  useCheckScheduleConnectionsMutation: () => mocks.connectionsMutation,
  useGetToolkitIndexOptionsQuery: () => mocks.indexOptionsQuery,
}));
vi.mock('@/[fsd]/features/schedule/lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => mocks.rowActions,
}));
vi.mock('@/[fsd]/features/schedule/ui/ScheduleActiveToggle', () => ({
  default: props => (
    <input
      type="checkbox"
      role="switch"
      aria-label="Active"
      checked={Boolean(props.value)}
      onChange={() => {}}
    />
  ),
}));
vi.mock('@/[fsd]/features/schedule/ui/RiskReviewDialog', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/schedule/ui/SaveWarningsDialog', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/schedule/ui/BuildScheduleWithAiModal', () => ({ default: () => null }));
vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationDetailsQuery: () => mocks.applicationQuery,
}));
vi.mock('@/api/toolkits', async importOriginal => ({
  ...(await importOriginal()),
  useToolkitsDetailsQuery: () => mocks.toolkitQuery,
  useToolkitsListQuery: () => mocks.toolkitsListQuery,
}));
vi.mock('@/hooks/application/useLibraryToolkits', () => ({ useGetToolkitIconMeta: () => mocks.iconMeta }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 5,
  useViewMode: () => 'owner',
  useDeleteConfirmationDisabled: () => false,
  useToast: () => mocks.toast,
  useShouldCollapseRightToolbar: () => mocks.collapse,
  useGetComponentHeight: () => mocks.height,
}));
vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => <nav /> }));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => undefined }));

const theme = createTheme(getDesignTokens('dark'));

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={enGB}
      >
        <MemoryRouter initialEntries={[{ pathname: ROUTE, state: { returnTo: '/toolkits/all/3/index/docs-index' } }]}>
          <Routes>
            <Route
              path="/toolkits/:tab/:toolkitId/index/:indexName/schedules/:scheduleId"
              element={<ScheduleDetailPage entityType="toolkit_index" />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>
    </ThemeProvider>,
  );

// The testid sits on the accordion header; aria-controls names the panel with the fields
const section = testId => {
  const panel = document.getElementById(screen.getByTestId(testId).getAttribute('aria-controls'));
  return within(panel);
};

describe('ScheduleDetailPage for a toolkit index', () => {
  beforeEach(() => {
    mocks.scheduleQuery = { currentData: SCHEDULE };
    mocks.runsData = { rows: RUNS, total: RUNS.length };
    mocks.runsQuery = { currentData: mocks.runsData };
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('left pane', () => {
    it('has Save and Cancel and the "More actions" menu in the header', async () => {
      renderPage();
      await act(async () => {});

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    });

    it('titles the pane Settings with the Active toggle', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'Active' })).toBeChecked();
    });

    it('lists GENERAL, WHAT TO RUN and SCHEDULE SETTINGS and leaves out the approval rule', () => {
      renderPage();

      expect(screen.getByText('GENERAL')).toBeInTheDocument();
      expect(screen.getByText('WHAT TO RUN')).toBeInTheDocument();
      expect(screen.getByText('SCHEDULE SETTINGS')).toBeInTheDocument();
      expect(screen.queryByText('APPROVAL RULE')).not.toBeInTheDocument();
    });

    it('GENERAL has Name, Description and the Owner', () => {
      renderPage();
      const general = section('schedule-section-general');

      expect(general.getByText(/^Name/)).toBeInTheDocument();
      expect(general.getByText(/^Description/)).toBeInTheDocument();
      expect(general.getByTestId('schedule-owner')).toHaveTextContent('Anna K.');
    });

    it('SCHEDULE SETTINGS has the Builder and Cron Expression modes, the next run and Stop on date', () => {
      renderPage();
      const settings = section('schedule-section-settings');

      expect(settings.getByRole('button', { name: 'Builder' })).toBeInTheDocument();
      expect(settings.getByRole('button', { name: 'Cron Expression' })).toBeInTheDocument();
      expect(settings.getByText(/Next run/)).toBeInTheDocument();
      expect(settings.getByRole('checkbox', { name: 'Stop on date' })).toBeInTheDocument();
    });
  });

  describe('WHAT TO RUN', () => {
    it('shows the toolkit and the index locked, with the hint, and no Version or Starting input', () => {
      renderPage();
      const whatToRun = section('schedule-section-what-to-run');

      expect(whatToRun.getByLabelText(/^Toolkit/)).toBeDisabled();
      expect(whatToRun.getByLabelText(/^Toolkit/)).toHaveValue('Docs toolkit');
      const indexField = within(whatToRun.getByTestId('schedule-locked-index')).getByLabelText(/^Index/);
      expect(indexField).toBeDisabled();
      expect(indexField).toHaveValue('docs-index');
      expect(whatToRun.getByText(/To change the toolkit or index, create a new schedule in/)).toBeInTheDocument();
      expect(whatToRun.getByRole('link', { name: 'Settings / Schedules' })).toBeInTheDocument();
      expect(whatToRun.queryByText(/^Version/)).not.toBeInTheDocument();
      expect(whatToRun.queryByText(/^Starting input/)).not.toBeInTheDocument();
    });
  });

  describe('Runs card', () => {
    it('titles the card with the run count and offers Run Now', () => {
      renderPage();

      expect(screen.getByTestId('schedule-runs-card')).toHaveTextContent(/^Runs/);
      expect(screen.getByTestId('schedule-runs-count')).toHaveTextContent('(2)');
      expect(screen.getByRole('button', { name: 'Run Now' })).toBeEnabled();
    });

    it('shows one card for each run', () => {
      renderPage();

      expect(screen.getAllByTestId('schedule-run-card')).toHaveLength(2);
    });

    it('tags only the newest run LATEST', () => {
      renderPage();
      const [newest, older] = screen.getAllByTestId('schedule-run-card');

      expect(within(newest).getByTestId('schedule-run-latest')).toHaveTextContent('LATEST');
      expect(within(older).queryByTestId('schedule-run-latest')).not.toBeInTheDocument();
    });

    it('shows the date and time, the trigger, the index in place of the version, the duration and the status', () => {
      renderPage();
      const newest = screen.getAllByTestId('schedule-run-card')[0];

      expect(within(newest).getByTestId('schedule-run-started').textContent).toMatch(/\d/);
      expect(within(newest).getByTestId('schedule-run-trigger')).toHaveTextContent('Manual');
      const facts = within(newest).getByTestId('schedule-run-facts');
      expect(facts).toHaveTextContent('Index docs-index');
      expect(facts).toHaveTextContent('10s');
      expect(facts).not.toHaveTextContent('Version');
      expect(within(newest).getByTestId('schedule-run-status')).toHaveTextContent('Success');
    });

    it('shows an expand arrow on the run header that opens closed', () => {
      renderPage();
      const newest = screen.getAllByTestId('schedule-run-card')[0];

      expect(within(newest).getByTestId('ExpandMoreIcon')).toBeInTheDocument();
      expect(within(newest).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows "No runs yet" for a schedule without runs', () => {
      mocks.runsQuery = { currentData: { rows: [], total: 0 } };
      renderPage();

      expect(screen.getByText('No runs yet')).toBeInTheDocument();
      expect(screen.queryByTestId('schedule-run-card')).not.toBeInTheDocument();
    });
  });
});
