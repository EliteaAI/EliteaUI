// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';

import { enGB } from 'date-fns/locale';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { ScheduleSettingsSection, StopOnDateField } from '@/[fsd]/shared/ui/schedule';

import ScheduleForm from '../ScheduleForm';

// The schedule form for a toolkit index, with the real sections and the SCHEDULE SETTINGS children of the create page.

const TOOLKIT_ROWS = [{ id: 3, toolkit_name: 'Docs toolkit' }];
const INDEX_OPTIONS = [{ name: 'docs-index', scheduled: false, schedulable: true }];
const DAILY_CRON = '0 6 * * *';
const FREQUENT_CRON = '*/5 * * * *';
const FUTURE_DATE = '2999-12-31';

const NO_TOOLKIT_HINT = 'Select a toolkit first to choose an index.';
const LOCKED_HINT_START = 'To change the toolkit or index, create a new schedule in';

const checkRisk = vi.fn();

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => true }),
}));
vi.mock('@/[fsd]/entities/schedule', async () => ({
  ...(await vi.importActual('@/[fsd]/entities/schedule/lib/helpers')),
  useGetScheduleSettingsQuery: () => ({ data: { allow_run_without_asking: true }, isError: false }),
  useCheckScheduleRiskMutation: () => [checkRisk],
  useGetToolkitIndexOptionsQuery: () => ({ data: INDEX_OPTIONS, isFetching: false, isError: false }),
}));
vi.mock('../ScheduleActiveToggle', () => ({ default: () => null }));
vi.mock('../RiskReviewDialog', () => ({ default: () => null }));
vi.mock('../SaveWarningsDialog', () => ({ default: () => null }));
vi.mock('../BuildScheduleWithAiModal', () => ({ default: () => null }));

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationListQuery: () => ({ data: { rows: [], total: 0 }, isFetching: false }),
  useApplicationDetailsQuery: () => ({ currentData: undefined, isFetching: false }),
}));
vi.mock('@/api/toolkits', async importOriginal => ({
  ...(await importOriginal()),
  useToolkitsDetailsQuery: () => ({ currentData: { id: 3, toolkit_name: 'Docs toolkit' } }),
  useToolkitsListQuery: () => ({ data: { rows: TOOLKIT_ROWS, total: 1 }, isFetching: false }),
}));
vi.mock('@/hooks/application/useLibraryToolkits', () => ({ useGetToolkitIconMeta: () => () => ({}) }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError: vi.fn() }),
  useShouldCollapseRightToolbar: () => ({ shouldCollapseTabs: false }),
  useGetComponentHeight: () => ({ componentRef: null, componentHeight: 0 }),
}));
vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => <nav /> }));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => undefined }));

const CLEAR = {
  blocking: [],
  sensitive: [],
  notices: [],
  run_without_asking_allowed: true,
  fingerprint: 'fp-0',
};
const INDEX_VALUES = {
  name: 'Nightly index',
  description: '',
  type: 'toolkit_index',
  application_id: '',
  version_id: '',
  toolkit_id: '3',
  index_name: 'docs-index',
  run_mode: null,
  prompt: '',
  variables: [],
  cron: DAILY_CRON,
  timezone: 'Europe/Kyiv',
  expires_at: null,
  approval_rule: 'pause_and_ask',
  enabled: true,
};
const AGENT_VALUES = { ...INDEX_VALUES, type: 'agent', toolkit_id: '', index_name: '' };

const theme = createTheme(getDesignTokens('dark'));

// the real selects and the date picker render slowly on a busy runner
vi.setConfig({ testTimeout: 30000 });

const renderForm = (initialValues, props = {}) => {
  const handlers = { onSubmit: vi.fn().mockResolvedValue(undefined), onCancel: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={enGB}
      >
        <MemoryRouter initialEntries={['/toolkits/all/3/index/docs-index/schedules/create']}>
          <ScheduleForm
            initialValues={initialValues}
            {...handlers}
            {...props}
          >
            {form => (
              <>
                <ScheduleSettingsSection
                  alignStart
                  value={form.values.cron}
                  onChange={cron => form.setFieldValue('cron', cron)}
                  sourceCron={DAILY_CRON}
                  error={form.fieldError('cron')}
                />
                <StopOnDateField
                  value={form.values.expires_at}
                  onChange={date => form.setFieldValue('expires_at', date)}
                  error={form.fieldError('expires_at')}
                  timezone={form.values.timezone}
                />
              </>
            )}
          </ScheduleForm>
        </MemoryRouter>
      </LocalizationProvider>
    </ThemeProvider>,
  );
  return handlers;
};

// The risk check answers in a promise; Save is disabled until it does
const save = async () => {
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};
// The testid sits on the accordion header; aria-controls names the panel with the fields
const section = testId => {
  const panel = document.getElementById(screen.getByTestId(testId).getAttribute('aria-controls'));
  return within(panel);
};

describe('ScheduleForm for a toolkit index', () => {
  beforeEach(() => {
    checkRisk.mockReturnValue({ unwrap: () => Promise.resolve(CLEAR) });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers the Agent, Pipeline and Toolkit Index segments in WHAT TO RUN', () => {
    renderForm(AGENT_VALUES);

    const toggle = section('schedule-section-what-to-run').getByTestId('schedule-type');
    expect(within(toggle).getByRole('button', { name: 'Agent' })).toBeInTheDocument();
    expect(within(toggle).getByRole('button', { name: 'Pipeline' })).toBeInTheDocument();
    expect(within(toggle).getByRole('button', { name: 'Toolkit Index' })).toBeInTheDocument();
  });

  it('shows Toolkit and Index and hides Version and Starting input after the Toolkit Index segment is chosen', async () => {
    renderForm(AGENT_VALUES);
    const whatToRun = section('schedule-section-what-to-run');
    expect(whatToRun.getByText(/^Version/)).toBeInTheDocument();
    expect(whatToRun.getByText(/^Starting input/)).toBeInTheDocument();

    fireEvent.click(whatToRun.getByRole('button', { name: 'Toolkit Index' }));

    await waitFor(() => expect(whatToRun.getByTestId('schedule-index')).toBeInTheDocument());
    expect(whatToRun.getByTestId('schedule-toolkit-combobox')).toBeInTheDocument();
    expect(whatToRun.getByTestId('schedule-index-combobox')).toBeInTheDocument();
    expect(whatToRun.getByText(/^Toolkit\s*\*/)).toBeInTheDocument();
    expect(whatToRun.getByText(/^Index\s*\*/)).toBeInTheDocument();
    expect(whatToRun.queryByText(/^Version/)).not.toBeInTheDocument();
    expect(whatToRun.queryByText(/^Starting input/)).not.toBeInTheDocument();
  });

  it('disables Index with a hint while no toolkit is chosen', async () => {
    renderForm({ ...INDEX_VALUES, toolkit_id: '', index_name: '' });
    const whatToRun = section('schedule-section-what-to-run');

    expect(whatToRun.getByTestId('schedule-index-hint')).toHaveTextContent(NO_TOOLKIT_HINT);
    expect(whatToRun.getByTestId('schedule-index-combobox')).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables Index and drops the hint once a toolkit is chosen', () => {
    renderForm(INDEX_VALUES);
    const whatToRun = section('schedule-section-what-to-run');

    expect(whatToRun.queryByTestId('schedule-index-hint')).not.toBeInTheDocument();
    expect(whatToRun.getByTestId('schedule-index-combobox')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('locks the toolkit and the index when the form is opened from the index page', () => {
    renderForm(INDEX_VALUES, { lockedEntity: { type: 'toolkit_index', toolkit_id: '3', index_name: 'docs-index' } });
    const whatToRun = section('schedule-section-what-to-run');

    expect(whatToRun.queryByTestId('schedule-type')).not.toBeInTheDocument();
    expect(whatToRun.getByTestId('schedule-locked-entity')).toBeInTheDocument();
    expect(whatToRun.getByLabelText(/^Toolkit/)).toBeDisabled();
    expect(whatToRun.getByLabelText(/^Toolkit/)).toHaveValue('Docs toolkit');
    expect(within(whatToRun.getByTestId('schedule-locked-index')).getByLabelText(/^Index/)).toBeDisabled();
    expect(within(whatToRun.getByTestId('schedule-locked-index')).getByLabelText(/^Index/)).toHaveValue(
      'docs-index',
    );
    expect(whatToRun.getByText(new RegExp(LOCKED_HINT_START))).toBeInTheDocument();
    expect(whatToRun.queryByText(/^Version/)).not.toBeInTheDocument();
    expect(whatToRun.queryByText(/^Starting input/)).not.toBeInTheDocument();
  });

  describe('cron that runs more than once a day', () => {
    it('does not save and shows the error in SCHEDULE SETTINGS', async () => {
      const { onSubmit } = renderForm({ ...INDEX_VALUES, cron: FREQUENT_CRON });
      const expected = ScheduleHelpers.validateCronExpression(FREQUENT_CRON);
      expect(expected.isValid).toBe(false);

      await save();

      await waitFor(() =>
        expect(section('schedule-section-settings').getAllByText(expected.message).length).toBeGreaterThan(0),
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not save an hourly cron', async () => {
      const { onSubmit } = renderForm({ ...INDEX_VALUES, cron: '0 * * * *' });

      await save();

      await waitFor(() => expect(section('schedule-section-settings').getAllByRole('alert').length).toBeGreaterThan(0));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('saves a cron that runs once a day', async () => {
      const { onSubmit } = renderForm(INDEX_VALUES);

      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      const body = onSubmit.mock.calls[0][0];
      expect(body).toMatchObject({ toolkit_id: '3', index_name: 'docs-index', cron: DAILY_CRON });
      expect(body).not.toHaveProperty('version_id');
      expect(body).not.toHaveProperty('prompt');
    });
  });

  describe('Stop on date', () => {
    it('sends the picked date as the stop date', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm(INDEX_VALUES);

      await user.click(screen.getByRole('checkbox', { name: 'Stop on date' }));
      await user.click(screen.getByRole('textbox', { name: 'Stop date' }));
      await user.keyboard('31122999');
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0].expires_at).toBe(FUTURE_DATE);
    });

    it('sends no stop date after the box is cleared', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm({ ...INDEX_VALUES, expires_at: FUTURE_DATE });
      expect(screen.getByRole('checkbox', { name: 'Stop on date' })).toBeChecked();

      await user.click(screen.getByRole('checkbox', { name: 'Stop on date' }));
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0].expires_at).toBeNull();
    });
  });
});
