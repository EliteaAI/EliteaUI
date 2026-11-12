// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleForm from '../ScheduleForm';

// the three-section schedule form. Child widgets are replaced by plain elements.

const ROWS = [
  { id: 7, name: 'Digest agent' },
  { id: 8, name: 'Other agent' },
];
const DETAILS = {
  7: {
    id: 7,
    name: 'Digest agent',
    meta: { default_version_id: 71 },
    versions: [
      { id: 70, name: 'base' },
      { id: 71, name: 'v2' },
    ],
    version_details: { agent_type: 'classic' },
  },
  9: {
    id: 9,
    name: 'Nightly flow',
    meta: {},
    versions: [{ id: 90, name: 'base' }],
    version_details: { agent_type: 'pipeline' },
  },
};

const listQuery = vi.fn();
const navBlocker = vi.fn();
const toastError = vi.fn();
let selectProps;
let versionProps;
let modalProps;
let allowed = true;
let isAdmin = false;
let runAllowed = true;
let listFailed = false;
let reviewProps;
const checkRisk = vi.fn();
// #7401 Connections check: every row ok unless a test sets other rows
const checkConnections = vi.fn();

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission => (permission === 'models.applications.schedules.admin' ? isAdmin : allowed),
  }),
}));
vi.mock('@/[fsd]/entities/schedule', async () => ({
  ...(await vi.importActual('@/[fsd]/entities/schedule/lib/helpers')),
  useIsScheduleAdmin: () => isAdmin,
  useGetScheduleSettingsQuery: () => ({
    data: runAllowed === undefined ? undefined : { allow_run_without_asking: runAllowed },
    isError: listFailed,
  }),
  useCheckScheduleRiskMutation: () => [checkRisk],
  useGetToolkitIndexOptionsQuery: () => ({ data: [], isFetching: false, isError: false }),
  useCheckScheduleConnectionsMutation: () => [checkConnections],
}));
// The sign-in bar needs the store and the auth modal; the panel only passes it the credential
vi.mock('@/[fsd]/features/credentials/ui', () => ({
  StoredLoginStatus: props => (
    <button
      type="button"
      data-testid="connection-sign-in"
      data-title={props.credentialRef?.elitea_title}
      onClick={props.onLoginChange}
    />
  ),
}));
vi.mock('../ScheduleReenableAction', () => ({
  default: () => <span data-testid="schedule-reenable-button" />,
}));
vi.mock('../ScheduleActiveToggle', () => ({
  default: props => (
    <input
      type="checkbox"
      role="switch"
      aria-label="Active"
      data-testid="schedule-active-switch"
      data-saved={String(!!props.schedule?.id)}
      checked={Boolean(props.value)}
      disabled={props.disabled}
      onChange={event => props.onChange?.(event.target.checked)}
    />
  ),
}));
vi.mock('../RiskReviewDialog', () => ({
  default: props => {
    reviewProps = props;
    return props.open ? <div data-testid="risk-dialog">{props.changed && 'The tools changed.'}</div> : null;
  },
}));
vi.mock('../SaveWarningsDialog', () => ({
  default: ({ open, warnings, note, onClose }) =>
    open ? (
      <div data-testid="warnings-dialog">
        {warnings.length}
        {note && <span data-testid="warnings-note">{note}</span>}
        <button onClick={onClose}>OK</button>
      </div>
    ) : null,
}));
vi.mock('../BuildScheduleWithAiModal', () => ({
  default: props => {
    modalProps = props;
    return props.open ? <div data-testid="build-modal" /> : null;
  },
}));

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationListQuery: args => listQuery(args),
  useApplicationDetailsQuery: ({ applicationId }, { skip }) => ({
    currentData: skip ? undefined : DETAILS[applicationId],
    isFetching: false,
  }),
}));

vi.mock('@/api/toolkits', async importOriginal => ({
  ...(await importOriginal()),
  useToolkitsDetailsQuery: () => ({ currentData: undefined }),
  useToolkitsListQuery: () => ({ data: undefined, isFetching: false }),
}));

vi.mock('@/hooks/application/useLibraryToolkits', () => ({ useGetToolkitIconMeta: () => () => ({}) }));

vi.mock('@/[fsd]/shared/lib/hooks', async () => ({
  useModal: (await import('@/[fsd]/shared/lib/hooks/useModal.hooks')).useModal,
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError }),
  useShouldCollapseRightToolbar: () => ({ shouldCollapseTabs: false }),
  useGetComponentHeight: () => ({ componentRef: null, componentHeight: 0 }),
}));
vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({
  default: ({ entityName }) => <nav>{`Schedules / ${entityName ?? 'New schedule'}`}</nav>,
}));

vi.mock('@/[fsd]/shared/ui/checkbox/RadioButtonGroup', () => ({
  default: ({ items, value, onChange, disabled, testId }) => (
    <div data-testid={testId}>
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          data-testid={`${testId}-${item.value}`}
          aria-pressed={item.value === value}
          disabled={disabled || item.disabled}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/[fsd]/shared/ui/select/LazySelect', () => ({
  default: props => {
    selectProps = props;
    return <div data-testid="entity-select">{props.label}</div>;
  },
}));

vi.mock('../ScheduleVersionField', () => ({
  default: props => {
    versionProps = props;
    return <div data-testid="version-select">{props.error}</div>;
  },
}));

vi.mock('@/[fsd]/shared/ui/input/StyledInputEnhancer', () => ({
  default: ({ label, multiline, value, onChange, inputProps, helperText, error, disabled }) => {
    const Tag = multiline ? 'textarea' : 'input';
    return (
      <label>
        {label}
        <Tag
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          disabled={disabled}
          {...inputProps}
        />
        {helperText && <span>{helperText}</span>}
      </label>
    );
  },
}));

vi.mock('@/components/VariableList', () => ({
  default: ({ variables }) => <div data-testid="variables">{variables.map(v => v.name).join(',')}</div>,
}));
vi.mock('@/[fsd]/shared/ui/banner-message/BannerMessage', () => ({
  default: ({ message, children }) => (
    <div role="alert">
      {message}
      {children}
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', async importOriginal => ({
  ...(await importOriginal()),
  default: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: options => navBlocker(options) }));

const INITIAL = {
  name: 'Daily digest',
  description: '',
  type: 'agent',
  application_id: '',
  version_id: '',
  run_mode: null,
  prompt: '',
  variables: [],
  cron: '0 9 * * 1-5',
  timezone: 'Europe/Kyiv',
  expires_at: null,
  approval_rule: 'pause_and_ask',
  enabled: true,
};

const theme = createTheme(getDesignTokens('dark'));

const renderForm = (props = {}, path = '/settings/schedules/create') => {
  const handlers = { onSubmit: vi.fn().mockResolvedValue(undefined), onCancel: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <ScheduleForm
          initialValues={INITIAL}
          {...handlers}
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return handlers;
};

const pickEntity = id => act(() => selectProps.onValueChange(id));
const typePrompt = text =>
  fireEvent.change(screen.getByLabelText(/^Starting input/), { target: { value: text } });
const CLEAR = {
  blocking: [],
  sensitive: [],
  notices: [],
  run_without_asking_allowed: true,
  fingerprint: 'fp-0',
};
const answer = data => ({ unwrap: () => Promise.resolve(data) });
// The risk check answers in a promise; Save is disabled until it does
const save = async () => {
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('ScheduleForm', () => {
  beforeEach(() => {
    allowed = true;
    isAdmin = false;
    runAllowed = true;
    listFailed = false;
    listQuery.mockReturnValue({ data: { rows: ROWS, total: 2 }, isFetching: false });
    checkRisk.mockReturnValue(answer(CLEAR));
    checkConnections.mockReturnValue(answer({ rows: [], all_ok: true, blocking: false }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens the Build with AI popup with formik, dirty state and the locked entity', () => {
    const lockedEntity = { type: 'agent', id: 7 };
    renderForm({ lockedEntity });

    expect(screen.queryByTestId('build-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Build with AI' }));

    expect(screen.getByTestId('build-modal')).toBeInTheDocument();
    expect(modalProps.lockedEntity).toBe(lockedEntity);
    expect(modalProps.formik.values.name).toBe('Daily digest');
    expect(modalProps.formik.dirty).toBe(false);
    expect(modalProps.formik.setValues).toBeTypeOf('function');
  });

  it.each(['/agents/all/12/schedules/create', '/pipelines/all/9/schedules/4', '/settings/schedules/4'])(
    'shows no selected-tab indicator in the header of %s, which has no tabs',
    path => {
      renderForm({ lockedEntity: { type: 'agent', id: 7 } }, path);

      expect(document.querySelector('.MuiTabs-indicator')).toHaveStyle({ display: 'none' });
    },
  );

  it('hides Build with AI without the schedules create permission', () => {
    allowed = false;
    renderForm();

    expect(screen.queryByRole('button', { name: 'Build with AI' })).not.toBeInTheDocument();
  });

  it('shows Build with AI on the New schedule form', () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'Build with AI' })).toBeInTheDocument();
  });

  it('keeps the header tab inert on the New and the existing schedule form', () => {
    renderForm({ schedule: { id: 3, owner: { name: 'Ann Lee' } } }, '/settings/schedules/3');

    expect(screen.getAllByRole('tab')[0]).toHaveStyle({ pointerEvents: 'none' });
  });

  it('hides Build with AI on an existing schedule', () => {
    renderForm({ schedule: { id: 3, owner: { name: 'Ann Lee' } } }, '/settings/schedules/3');

    expect(screen.queryByRole('button', { name: 'Build with AI' })).not.toBeInTheDocument();
  });

  it('shows GENERAL, WHAT TO RUN and SCHEDULE SETTINGS in this order', () => {
    renderForm();

    expect(screen.getAllByRole('heading').map(h => h.textContent)).toEqual([
      'Settings',
      'GENERAL',
      'WHAT TO RUN',
      'SCHEDULE SETTINGS',
      'APPROVAL RULE',
    ]);
  });

  describe('Active switch', () => {
    it('sends enabled with a new schedule and starts on', async () => {
      const { onSubmit } = renderForm();
      expect(screen.getByTestId('schedule-active-switch')).toBeChecked();

      fireEvent.click(screen.getByTestId('schedule-active-switch'));
      pickEntity(7);
      typePrompt('Hi');
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ enabled: false });
    });
  });

  it('shows Name and a multiline Description capped at 2304, and no tags field', () => {
    renderForm();

    expect(screen.getByLabelText(/Name/)).toHaveValue('Daily digest');
    const description = screen.getByLabelText('Description');
    expect(description.tagName).toBe('TEXTAREA');
    expect(description).toHaveAttribute('maxlength', String(MAX_DESCRIPTION_LENGTH));
    expect(screen.queryByText(/tags/i)).not.toBeInTheDocument();
  });

  it('shows the Type radio with Agent selected', () => {
    renderForm();

    expect(screen.getByTestId('schedule-type-agent')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('schedule-type-pipeline')).toHaveAttribute('aria-pressed', 'false');
  });

  it('lists only entities of the selected Type, labeled by it', () => {
    renderForm();
    expect(listQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        projectId: 5,
        page: 0,
        params: expect.objectContaining({ agents_type: 'classic' }),
      }),
    );
    expect(selectProps.label).toBe('Agent');
    expect(selectProps.options.map(o => o.label)).toEqual(['Digest agent', 'Other agent']);

    fireEvent.click(screen.getByTestId('schedule-type-pipeline'));

    expect(listQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ agents_type: 'pipeline' }) }),
    );
    expect(selectProps.label).toBe('Pipeline');
  });

  it('loads the next page at the end of the list', () => {
    renderForm();

    act(() => selectProps.onLoadMore());

    expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('asks the same page again after a failed page (TC-US25-05)', () => {
    // The list query reports page 1 as failed, the way the real hook does for the args it ran with
    listQuery.mockImplementation(args => ({
      data: { rows: ROWS, total: 60 },
      isFetching: false,
      isError: args.page === 1,
      originalArgs: args,
    }));
    renderForm();

    act(() => selectProps.onLoadMore());

    // The failed page 1 is rolled back, so the next scroll asks page 1 (the same offset) again
    expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0 }));
    listQuery.mockImplementation(args => ({
      data: { rows: ROWS, total: 60 },
      isFetching: false,
      originalArgs: args,
    }));
    act(() => selectProps.onLoadMore());
    expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    expect(selectProps.options.map(o => o.label)).toEqual(['Digest agent', 'Other agent']);
  });

  it('presets the version to the default version of the selected entity', async () => {
    renderForm();

    pickEntity(7);

    await waitFor(() => expect(versionProps.value).toBe(71));
    expect(versionProps.onChange).toBeTypeOf('function');
  });

  it('shows a required Prompt with Variables for an agent', () => {
    renderForm();
    pickEntity(7);

    typePrompt('Hello {{team}}');

    expect(screen.getByTestId('variables')).toHaveTextContent('team');
  });

  it('shows Run mode for a pipeline and hides Prompt in Entry point', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('schedule-type-pipeline'));

    expect(screen.getByTestId('schedule-run-mode-entry_point')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText(/^Starting input/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('variables')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('schedule-run-mode-prompt'));

    expect(screen.getByLabelText(/^Starting input/)).toBeInTheDocument();
  });

  it('keeps Save from sending and shows "Prompt is required"', async () => {
    const { onSubmit } = renderForm();
    pickEntity(7);

    await save();

    expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides Type and the entity of the URL and keeps Run mode editable', () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 9 },
      lockedEntity: { type: 'pipeline', id: 9 },
    });

    expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entity-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedule-run-mode-prompt')).toBeEnabled();
  });

  it('unlocks and shows a banner when the URL entity has another type', async () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 7 },
      lockedEntity: { type: 'pipeline', id: 7 },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('not available');
    expect(selectProps.disabled).toBeFalsy();
    expect(selectProps.value).toBe('');
    // the failed lock brings back the full form with its WHAT TO RUN section
    expect(screen.getAllByRole('heading').map(h => h.textContent)).toContain('WHAT TO RUN');
  });

  it('sends the create body on Save', async () => {
    const { onSubmit } = renderForm();
    pickEntity(7);
    await waitFor(() => expect(versionProps.value).toBe(71));
    typePrompt('Hello {{team}}');

    await save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Daily digest',
      entity_type: 'agent',
      application_id: 7,
      version_id: 71,
      run_mode: null,
      prompt: 'Hello {{team}}',
      variables: [{ name: 'team', value: '' }],
    });
  });

  it('shows a 400 message under its field and keeps the form open', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByText('Name is taken')).toBeInTheDocument();
  });

  it('shows a 400 message for a field without an input in the banner', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({
        status: 400,
        data: { field: 'timezone', error: 'Unknown timezone' },
      }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown timezone');
  });

  it('shows a 400 cron message for the cron field and clears it on a cron edit', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({
        status: 400,
        data: { field: 'cron', error: 'Runs must be at least 5 minutes apart' },
      }),
      children: ({ setFieldValue, fieldError }) => (
        <>
          <button
            type="button"
            onClick={() => setFieldValue('cron', '*/10 * * * *')}
          >
            Edit cron
          </button>
          <span data-testid="cron-error">{fieldError('cron')}</span>
        </>
      ),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    await waitFor(() =>
      expect(screen.getByTestId('cron-error')).toHaveTextContent('Runs must be at least 5 minutes apart'),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit cron' }));

    await waitFor(() => expect(screen.getByTestId('cron-error')).toBeEmptyDOMElement());
  });

  it('shows a 400 stop date message for the stop date field and clears it on an edit', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({
        status: 400,
        data: { field: 'expires_at', error: 'Stop date is in the past' },
      }),
      children: ({ setFieldValue, fieldError }) => (
        <>
          <button
            type="button"
            onClick={() => setFieldValue('expires_at', '2030-01-01')}
          >
            Edit stop date
          </button>
          <span data-testid="stop-error">{fieldError('expires_at')}</span>
        </>
      ),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    await waitFor(() =>
      expect(screen.getByTestId('stop-error')).toHaveTextContent('Stop date is in the past'),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit stop date' }));

    await waitFor(() => expect(screen.getByTestId('stop-error')).toBeEmptyDOMElement());
  });

  it('keeps Save from sending without a name, an entity and a version', async () => {
    const { onSubmit } = renderForm({ initialValues: { ...INITIAL, name: '' } });
    typePrompt('Hi');

    await save();

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(selectProps.helperText).toBe('Choose an agent or a pipeline');
    expect(screen.getByText('Choose an agent or a pipeline')).toBeInTheDocument();
    expect(screen.getByText('Choose a version')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the first of two fast changes', async () => {
    const { onSubmit } = renderForm();
    act(() => {
      selectProps.onValueChange(7);
      fireEvent.change(screen.getByLabelText(/^Starting input/), { target: { value: 'Hi' } });
    });
    await waitFor(() => expect(versionProps.value).toBe(71));

    await save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ application_id: 7, prompt: 'Hi' });
  });

  it('a change in SCHEDULE SETTINGS alone makes the form dirty and reaches the body', async () => {
    const { onSubmit } = renderForm({
      children: ({ values, setFieldValue }) => (
        <button
          type="button"
          onClick={() => setFieldValue('expires_at', '2026-12-31')}
        >
          {values.cron}
        </button>
      ),
    });
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });

    fireEvent.click(screen.getByRole('button', { name: INITIAL.cron }));

    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: true });
    pickEntity(7);
    await waitFor(() => expect(versionProps.value).toBe(71));
    typePrompt('Hi');
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      cron: INITIAL.cron,
      timezone: INITIAL.timezone,
      expires_at: '2026-12-31',
    });
  });

  it('unlocking an unavailable URL entity keeps the form clean', async () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 7 },
      lockedEntity: { type: 'pipeline', id: 7 },
    });

    await waitFor(() => expect(selectProps.value).toBe(''));
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
  });

  it('the default version of the URL entity keeps the form clean', async () => {
    renderForm({ initialValues: { ...INITIAL, application_id: 7 }, lockedEntity: { type: 'agent', id: 7 } });

    await waitFor(() => expect(checkRisk).toHaveBeenCalled());
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
  });

  it('shows the server text of a 409 in the banner', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({ status: 409, data: { error: 'Schedule limit reached' } }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Schedule limit reached');
  });

  it('blocks leaving only while the form has unsaved changes', () => {
    renderForm();
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nightly digest' } });
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: true });
  });

  it('returns through onCancel without saving', () => {
    const { onSubmit, onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows Save and Cancel in the page header bar, beside the breadcrumb', () => {
    renderForm();

    const bar = screen.getByRole('navigation').parentElement.parentElement;
    expect(bar).toContainElement(screen.getByTestId('schedule-save-button'));
    expect(bar).toContainElement(screen.getByTestId('schedule-cancel-button'));
    expect(screen.getByRole('tabpanel')).not.toContainElement(screen.getByTestId('schedule-save-button'));
  });

  it('shows the headerActions node in the header bar after Cancel', () => {
    renderForm({ headerActions: <span data-testid="header-menu" /> });

    const bar = screen.getByRole('navigation').parentElement.parentElement;
    const menu = screen.getByTestId('header-menu');
    expect(bar).toContainElement(menu);
    expect(screen.getByTestId('schedule-cancel-button').compareDocumentPosition(menu)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('collapses a section from its header', () => {
    renderForm();
    const header = screen.getByTestId('schedule-section-general');
    expect(header).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows Approval rule with Pause and ask me selected and sends it', async () => {
    const { onSubmit } = renderForm();

    expect(screen.getByTestId('schedule-approval-rule-pause_and_ask')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    pickEntity(7);
    typePrompt('Hi');
    await save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ approval_rule: 'pause_and_ask' });
  });

  it('selects the saved approval rule', () => {
    renderForm({ initialValues: { ...INITIAL, approval_rule: 'run_without_asking' } });

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('disables Run without asking with a hint when the project does not allow it', () => {
    runAllowed = false;
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
  });

  it('keeps Run without asking disabled with no hint while the project data loads', () => {
    runAllowed = undefined;
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.queryByText(/does not allow/)).not.toBeInTheDocument();
  });

  it('keeps Run without asking disabled with no hint when the project data fails', () => {
    runAllowed = undefined;
    listFailed = true;
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.queryByText(/does not allow/)).not.toBeInTheDocument();
  });

  it('links a project admin from the hint to Project General', () => {
    runAllowed = false;
    isAdmin = true;
    renderForm();

    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change it in Settings > Project General' })).toHaveAttribute(
      'href',
      '/settings/project-general',
    );
  });

  it('shows no settings link to a non-admin', () => {
    runAllowed = false;
    renderForm();

    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Project General/ })).not.toBeInTheDocument();
  });

  it('links the Approval rule label and the hint to the radio group', () => {
    runAllowed = false;
    renderForm();

    expect(screen.getByText('Approval rule')).toHaveAttribute('id', 'schedule-approval-rule-label');
    const hint = screen.getByText(/does not allow/);
    expect(screen.getByTestId('schedule-approval-rule-group')).toHaveAttribute('aria-describedby', hint.id);
  });

  it('shows the returned rule and a note without warnings, then returns on close', async () => {
    const result = { id: 1, approval_rule: 'pause_and_ask', warnings: [] };
    const onSaved = vi.fn();
    renderForm({
      initialValues: { ...INITIAL, approval_rule: 'run_without_asking' },
      onSubmit: vi.fn().mockResolvedValue(result),
      onSaved,
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByTestId('warnings-note')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onSaved).toHaveBeenCalledWith(result);
  });

  it('enables Run without asking when the project allows it', () => {
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeEnabled();
    expect(screen.queryByText(/does not allow/)).not.toBeInTheDocument();
  });

  it('shows the server text of approval_rule_not_allowed at the field', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({
        status: 400,
        data: {
          code: 'approval_rule_not_allowed',
          error: 'Run without asking is not allowed here.',
          field: 'approval_rule',
        },
      }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Run without asking is not allowed here.');
  });

  it('shows the returned rule and the hint when the save answers a different rule', async () => {
    renderForm({
      initialValues: { ...INITIAL, approval_rule: 'run_without_asking' },
      onSubmit: vi.fn().mockResolvedValue({ approval_rule: 'pause_and_ask', warnings: [{ code: 'x' }] }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    await screen.findByTestId('warnings-dialog');
    expect(screen.getByTestId('schedule-approval-rule-pause_and_ask')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
  });

  it('opens the warnings dialog after a save with warnings and returns on close', async () => {
    const result = { id: 1, warnings: [{ code: 'human_input_step', message: 'm' }] };
    const onSaved = vi.fn();
    renderForm({ onSubmit: vi.fn().mockResolvedValue(result), onSaved });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByTestId('warnings-dialog')).toHaveTextContent('1');
    expect(onSaved).not.toHaveBeenCalled();
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onSaved).toHaveBeenCalledWith(result);
  });

  it('returns at once without a dialog when the save has no warnings', async () => {
    const result = { id: 1, warnings: [] };
    const onSaved = vi.fn();
    renderForm({ onSubmit: vi.fn().mockResolvedValue(result), onSaved });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(result));
    expect(screen.queryByTestId('warnings-dialog')).not.toBeInTheDocument();
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
  });

  // The nested route of the agent editor gives the locked entity as a URL string
  describe('agent editor entry', () => {
    const renderFromEditor = () =>
      renderForm({
        initialValues: { ...INITIAL, application_id: '7' },
        lockedEntity: { type: 'agent', id: '7' },
      });

    it('TC-US35-08 locks Type Agent and this agent and presets the default version', async () => {
      const { onSubmit } = renderFromEditor();

      expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
      typePrompt('Hi');
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        entity_type: 'agent',
        application_id: '7',
        version_id: 71,
      });
    });

    it('TC-US35-16 TC-US35-17 keeps Prompt and Variables editable and saves them', async () => {
      const { onSubmit } = renderFromEditor();

      typePrompt('Digest for {{team}} in {{room}}');
      expect(screen.getByTestId('variables')).toHaveTextContent('room,team');
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        entity_type: 'agent',
        application_id: '7',
        version_id: 71,
        run_mode: null,
        prompt: 'Digest for {{team}} in {{room}}',
        variables: [
          { name: 'room', value: '' },
          { name: 'team', value: '' },
        ],
      });
    });

    it('TC-US35-17 still asks for the prompt', async () => {
      const { onSubmit } = renderFromEditor();

      await save();

      expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('pipeline editor entry', () => {
    const renderFromPipeline = () =>
      renderForm({
        initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: '9' },
        lockedEntity: { type: 'pipeline', id: '9' },
      });

    it('TC-US36-14 hides Type and this pipeline', () => {
      renderFromPipeline();

      expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
      expect(screen.queryByTestId('entity-select')).not.toBeInTheDocument();
    });

    it('TC-US36-15 saves Entry point with no prompt by default', async () => {
      const { onSubmit } = renderFromPipeline();

      expect(screen.getByTestId('schedule-run-mode-entry_point')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByLabelText(/^Starting input/)).not.toBeInTheDocument();
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        entity_type: 'pipeline',
        run_mode: 'entry_point',
        version_id: 90,
        prompt: null,
        variables: [],
      });
    });

    it('TC-US36-15 Prompt mode asks for the prompt and shows one field per placeholder', async () => {
      const { onSubmit } = renderFromPipeline();
      fireEvent.click(screen.getByTestId('schedule-run-mode-prompt'));

      await save();
      expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();

      typePrompt('Report for {{region}}');
      expect(screen.getByTestId('variables')).toHaveTextContent('region');
    });
  });

  describe('form nested in an editor', () => {
    const renderLocked = (type = 'agent', extra = {}) =>
      renderForm({
        initialValues:
          type === 'agent'
            ? { ...INITIAL, application_id: '7' }
            : { ...INITIAL, type, run_mode: 'entry_point', application_id: '9' },
        lockedEntity: { type, id: type === 'agent' ? '7' : '9', versionId: type === 'agent' ? 70 : 90 },
        ...extra,
      });

    // The section headers are siblings of their bodies, so "under General" means between its header and the next
    const expectUnderGeneral = element => {
      const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(after(screen.getByTestId('schedule-section-general'), element)).toBe(true);
      expect(after(element, screen.getByTestId('schedule-section-settings'))).toBe(true);
    };

    it('shows the locked entity, the version and the Settings link, without the type switch', () => {
      renderLocked();

      expect(screen.getAllByRole('heading').map(h => h.textContent)).toEqual([
        'Settings',
        'GENERAL',
        'WHAT TO RUN',
        'SCHEDULE SETTINGS',
        'APPROVAL RULE',
      ]);
      expect(screen.getByTestId('schedule-locked-entity')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-locked-entity-link')).toHaveAttribute(
        'href',
        '/settings/schedules',
      );
      expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
      expect(screen.queryByTestId('entity-select')).not.toBeInTheDocument();
      expect(screen.getByTestId('version-select')).toBeInTheDocument();
    });

    it('TC-US58-15 shows Prompt and Variables under General for an agent', () => {
      renderLocked();

      expectUnderGeneral(screen.getByLabelText(/^Starting input/));
      expectUnderGeneral(screen.getByTestId('variables'));
      expect(screen.queryByTestId('schedule-run-mode')).not.toBeInTheDocument();
    });

    it('TC-US58-15 shows Run mode under General for a pipeline', () => {
      renderLocked('pipeline');

      expectUnderGeneral(screen.getByTestId('schedule-run-mode'));
    });

    it('TC-US58-14 saves the version of the editor, not the default version', async () => {
      const { onSubmit } = renderLocked();

      typePrompt('Digest');
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ application_id: '7', version_id: 70 });
    });

    it('TC-US58-16 keeps every selector without a locked entity', () => {
      renderForm();

      expect(screen.getByTestId('schedule-type')).toBeInTheDocument();
      expect(screen.getByTestId('entity-select')).toBeInTheDocument();
      expect(screen.getByTestId('version-select')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-section-what-to-run')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    const SCHEDULE = {
      id: 3,
      owner: { id: 1, name: 'Ann Lee' },
      allowed_actions: ['edit', 'run'],
    };
    const EDIT_INITIAL = { ...INITIAL, application_id: 7, version_id: 71, prompt: 'Hi' };
    // The edit page's side panel holds Test run; this stand-in shows what the form passes
    const sidePanel = ({ onRunNow, runNowPending, runNowError }) => (
      <div data-testid="side-panel">
        <button
          type="button"
          data-testid="schedule-form-test-run"
          disabled={runNowPending}
          onClick={onRunNow}
        >
          Test run
        </button>
        {runNowError && <p data-testid="test-run-error">{runNowError}</p>}
      </div>
    );
    const renderEdit = (props = {}) =>
      renderForm({
        initialValues: EDIT_INITIAL,
        schedule: SCHEDULE,
        onRunNow: vi.fn().mockResolvedValue(undefined),
        sidePanel,
        ...props,
      });
    const testRun = () => fireEvent.click(screen.getByTestId('schedule-form-test-run'));
    const edit = () => fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Changed' } });
    const saveButton = () => screen.getByTestId('schedule-save-button');

    it('does not send enabled when a saved schedule is edited', async () => {
      const { onSubmit } = renderEdit();
      expect(screen.getByTestId('schedule-active-switch')).toHaveAttribute('data-saved', 'true');

      edit();
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('enabled');
    });

    it('keeps Save disabled on the edit page until a value changes', async () => {
      renderEdit();
      await act(async () => {});
      expect(saveButton()).toBeDisabled();

      edit();
      await act(async () => {});
      expect(saveButton()).toBeEnabled();

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: EDIT_INITIAL.name } });
      await act(async () => {});
      expect(saveButton()).toBeDisabled();
    });

    it('keeps Save enabled on the create page without a change', async () => {
      renderForm();
      await act(async () => {});
      expect(saveButton()).toBeEnabled();
    });

    it('shows the Owner as a line of text only for a saved schedule', () => {
      renderEdit();
      expect(screen.getByTestId('schedule-owner')).toHaveTextContent('Owner: Ann Lee');
      cleanup();

      renderForm();
      expect(screen.queryByTestId('schedule-owner')).not.toBeInTheDocument();
    });

    it('disables the fields and Save when allowed_actions has no edit', async () => {
      renderEdit({ schedule: { ...SCHEDULE, allowed_actions: ['run'] } });
      await act(async () => {});

      expect(screen.getByLabelText('Name')).toBeDisabled();
      expect(screen.getByLabelText('Description')).toBeDisabled();
      expect(screen.getByLabelText(/^Starting input/)).toBeDisabled();
      expect(screen.getByTestId('schedule-approval-rule-pause_and_ask')).toBeDisabled();
      expect(versionProps.disabled).toBe(true);
      expect(saveButton()).toBeDisabled();
      expect(screen.getByTestId('schedule-cancel-button')).toBeEnabled();
    });

    it('keeps the fields editable when allowed_actions has edit', async () => {
      renderEdit();
      await act(async () => {});

      expect(screen.getByLabelText('Name')).toBeEnabled();
      expect(versionProps.disabled).toBe(false);
    });

    it('shows the entity of a saved schedule locked, without a URL entity', () => {
      renderEdit();

      expect(screen.getByTestId('schedule-locked-entity')).toBeInTheDocument();
      expect(screen.queryByTestId('schedule-type-agent')).not.toBeInTheDocument();
    });

    it('has no Test run in the header; only the side panel holds it', () => {
      renderEdit({ sidePanel: undefined });
      expect(screen.queryByTestId('schedule-form-test-run')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Test run' })).not.toBeInTheDocument();
      cleanup();

      renderForm();
      expect(screen.queryByTestId('side-panel')).not.toBeInTheDocument();
      cleanup();

      renderEdit();
      expect(screen.getByTestId('side-panel')).toBeInTheDocument();
    });

    it('puts the side panel right of the form only from the lg breakpoint', () => {
      renderEdit();
      const panelColumn = screen.getByTestId('side-panel').parentElement;
      const formColumn = panelColumn.previousElementSibling;
      [panelColumn, formColumn].forEach(column => {
        expect(column).toHaveClass('MuiGrid-grid-xs-12', 'MuiGrid-grid-lg-6');
        expect(column).not.toHaveClass('MuiGrid-grid-xl-6');
      });
    });

    it('renders what sidePanel returns, the panel and the Runs section, in the right column', () => {
      renderEdit({
        sidePanel: () => (
          <>
            <div data-testid="side-panel" />
            <div data-testid="runs-section" />
          </>
        ),
      });

      const runs = screen.getByTestId('runs-section');
      expect(runs.closest('form')).toBeNull();
      expect(runs.parentElement).toBe(screen.getByTestId('side-panel').parentElement);
      expect(runs.parentElement).toHaveClass('MuiGrid-grid-xs-12', 'MuiGrid-grid-lg-6');
      expect(screen.getByLabelText('Name').closest('form').parentElement).not.toContainElement(runs);
    });

    it('saves a changed form first, then starts the run', async () => {
      const calls = [];
      const onSubmit = vi.fn().mockImplementation(async () => calls.push('save'));
      const onRunNow = vi.fn().mockImplementation(async () => calls.push('run'));
      renderEdit({ onSubmit, onRunNow });
      edit();

      testRun();

      await waitFor(() => expect(onRunNow).toHaveBeenCalledTimes(1));
      expect(calls).toEqual(['save', 'run']);
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Changed' });
    });

    it('runs a clean form without saving', async () => {
      const { onSubmit } = renderEdit();

      testRun();

      await waitFor(() => expect(screen.getByTestId('schedule-form-test-run')).toBeEnabled());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('disables Test run while the run is pending, so a double click sends one run', async () => {
      let finish;
      const onRunNow = vi.fn(() => new Promise(resolve => (finish = resolve)));
      renderEdit({ onRunNow });

      testRun();
      await waitFor(() => expect(screen.getByTestId('schedule-form-test-run')).toBeDisabled());
      testRun();
      expect(onRunNow).toHaveBeenCalledTimes(1);

      await act(async () => finish());
      expect(screen.getByTestId('schedule-form-test-run')).toBeEnabled();
    });

    it('a second Test run after a save does not save again', async () => {
      const { onSubmit } = renderEdit();
      edit();
      testRun();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

      testRun();

      await waitFor(() => expect(screen.getByTestId('schedule-form-test-run')).toBeEnabled());
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('sends no run when the save fails', async () => {
      const onRunNow = vi.fn();
      renderEdit({
        onRunNow,
        onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
      });
      edit();

      testRun();

      expect(await screen.findByText('Name is taken')).toBeInTheDocument();
      expect(onRunNow).not.toHaveBeenCalled();
    });

    it('sends no run when the form is invalid', async () => {
      const { onSubmit } = renderEdit();
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });

      testRun();

      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('passes the server reason of a 409 run to the side panel, not the form banner', async () => {
      renderEdit({
        onRunNow: vi.fn().mockRejectedValue({ status: 409, data: { error: 'Already running' } }),
      });

      testRun();

      expect(await screen.findByTestId('test-run-error')).toHaveTextContent('Already running');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('clears the run reason when the next Test run starts', async () => {
      const onRunNow = vi
        .fn()
        .mockRejectedValueOnce({ status: 409, data: { error: 'Already running' } })
        .mockResolvedValue(undefined);
      renderEdit({ onRunNow });

      testRun();
      await screen.findByTestId('test-run-error');
      testRun();

      await waitFor(() => expect(screen.queryByTestId('test-run-error')).not.toBeInTheDocument());
    });

    it('shows a 400 on save under its field and keeps the form open', async () => {
      renderEdit({
        onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
      });
      edit();

      await save();

      expect(await screen.findByText('Name is taken')).toBeInTheDocument();
    });

    it('starts the run after the warnings dialog closes, not before, and skips onSaved', async () => {
      const onSaved = vi.fn();
      const onRunNow = vi.fn().mockResolvedValue(undefined);
      renderEdit({
        onSubmit: vi.fn().mockResolvedValue({ id: 3, warnings: [{ code: 'x', message: 'm' }] }),
        onSaved,
        onRunNow,
      });
      edit();

      testRun();

      await screen.findByTestId('warnings-dialog');
      expect(onRunNow).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));
      await waitFor(() => expect(onRunNow).toHaveBeenCalledTimes(1));
      expect(onSaved).not.toHaveBeenCalled();
    });

    it('calls onSaved with the answer after a plain Save', async () => {
      const onSaved = vi.fn();
      renderEdit({ onSubmit: vi.fn().mockResolvedValue({ id: 3 }), onSaved });
      edit();

      await save();

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 3 }));
    });

    it('passes entityName to the breadcrumb and renders the side panel outside the form', () => {
      renderEdit({ entityName: 'Digest' });

      expect(screen.getByRole('navigation')).toHaveTextContent('Schedules / Digest');
      expect(screen.getByTestId('side-panel').closest('form')).toBeNull();
      expect(screen.getByLabelText('Name').closest('form')).not.toBeNull();
    });
  });

  // risk review before saving
  describe('risk review', () => {
    const SIGNIN = {
      code: 'personal_signin_required',
      toolkit: "GitHub toolkit 'github-personal'",
      reason: 'uses your own GitHub sign-in',
      fix: { entity_type: 'agent', id: 7, version_id: 71 },
    };
    const SENSITIVE = [
      { code: 'sensitive_action', toolkit: 'Outlook', tool: 'send_email', badge: 'sends_messages' },
    ];
    const RISKY = { ...CLEAR, sensitive: SENSITIVE, fingerprint: 'fp-1' };
    // Every refusal of the core branch: a machine code, a human text and the whole review
    const refusal = (status, code, extra = {}) => ({
      status,
      data: {
        code,
        error: `Human text of ${code}`,
        blocking: [],
        sensitive: [],
        notices: [],
        fingerprint: 'fp-x',
        ...extra,
      },
    });
    const conflict = (code, extra) => refusal(409, code, extra);
    const saveButton = () => screen.getByTestId('schedule-save-button');

    const fillAgent = async () => {
      pickEntity(7);
      await waitFor(() => expect(versionProps.value).toBe(71));
      typePrompt('Hi');
      await waitFor(() => expect(saveButton()).toBeEnabled());
    };

    it('checks the chosen entity type, agent and version', async () => {
      renderForm();
      await fillAgent();

      expect(checkRisk).toHaveBeenCalledWith({
        projectId: 5,
        entity_type: 'agent',
        application_id: 7,
        version_id: 71,
      });
    });

    it('shows the block box under the entity, disables Save and names the reason in the header', async () => {
      checkRisk.mockReturnValue(answer({ ...CLEAR, blocking: [SIGNIN] }));
      renderForm({ initialValues: { ...INITIAL, approval_rule: 'run_without_asking' } });
      pickEntity(7);

      const hint = await screen.findByText('Fix the risk check to save');
      const box = screen.getByTestId('schedule-risk-block-box');
      expect(box).toHaveTextContent('uses your own GitHub sign-in');
      // Under the entity select, above Version
      const select = screen.getByTestId('entity-select');
      expect(select.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(
        box.compareDocumentPosition(screen.getByTestId('version-select')) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(saveButton()).toBeDisabled();
      expect(saveButton()).toHaveAttribute('aria-disabled', 'true');
      expect(saveButton()).toHaveAttribute('aria-describedby', hint.closest('[id]').id);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    });

    it('disables Save and shows "Checking risks" while the check runs', async () => {
      let finish;
      checkRisk.mockReturnValue({ unwrap: () => new Promise(resolve => (finish = resolve)) });
      renderForm();
      pickEntity(7);

      expect(await screen.findByText('Checking risks')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
      expect(screen.queryByTestId('schedule-risk-block-box')).not.toBeInTheDocument();

      await act(async () => finish(CLEAR));
      expect(screen.queryByText('Checking risks')).not.toBeInTheDocument();
      expect(saveButton()).toBeEnabled();
    });

    it('keeps Save disabled with a Retry banner when the check does not run, and Retry checks again', async () => {
      checkRisk.mockReturnValue({ unwrap: () => Promise.reject({ status: 503 }) });
      renderForm();
      pickEntity(7);

      expect(await screen.findByText('The risk check did not run. Try again.')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
      checkRisk.mockReturnValue(answer(CLEAR));
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      await waitFor(() => expect(saveButton()).toBeEnabled());
      expect(screen.queryByText('The risk check did not run. Try again.')).not.toBeInTheDocument();
    });

    it('shows an error toast and the failed state when the check fails on Save', async () => {
      const { onSubmit } = renderForm();
      await fillAgent();
      checkRisk.mockReturnValue({ unwrap: () => Promise.reject({ status: 503 }) });

      await save();

      await waitFor(() => expect(toastError).toHaveBeenCalledWith('The risk check did not run. Try again.'));
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('checks again on Save and saves nothing when the fresh check blocks', async () => {
      const { onSubmit } = renderForm({ initialValues: { ...INITIAL, approval_rule: 'run_without_asking' } });
      await fillAgent();
      checkRisk.mockReturnValue(answer({ ...CLEAR, blocking: [SIGNIN] }));

      await save();

      expect(await screen.findByTestId('schedule-risk-block-box')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a personal sign-in as a warning under "Pause and ask me" and saves', async () => {
      checkRisk.mockReturnValue(answer({ ...CLEAR, blocking: [SIGNIN] }));
      const { onSubmit } = renderForm();
      await fillAgent();

      expect(screen.getByTestId('schedule-risk-wait-box')).toHaveTextContent('waits');
      expect(screen.queryByTestId('schedule-risk-block-box')).not.toBeInTheDocument();
      expect(screen.queryByText('Fix the risk check to save')).not.toBeInTheDocument();

      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    it('turns the warning into a block box when the rule changes to "Run without asking"', async () => {
      checkRisk.mockReturnValue(answer({ ...CLEAR, blocking: [SIGNIN] }));
      renderForm();
      await fillAgent();
      expect(screen.getByTestId('schedule-risk-wait-box')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('schedule-approval-rule-run_without_asking'));

      expect(await screen.findByTestId('schedule-risk-block-box')).toBeInTheDocument();
      expect(screen.queryByTestId('schedule-risk-wait-box')).not.toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('keeps a human-input step blocking under "Pause and ask me"', async () => {
      checkRisk.mockReturnValue(
        answer({
          ...CLEAR,
          blocking: [{ code: 'human_input_step', step: 'review', fix: SIGNIN.fix }],
        }),
      );
      const { onSubmit } = renderForm();
      pickEntity(7);

      expect(await screen.findByTestId('schedule-risk-block-box')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('opens the review dialog on Save with sensitive tools and saves nothing yet', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const { onSubmit } = renderForm();
      await fillAgent();

      await save();

      expect(await screen.findByTestId('risk-dialog')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(reviewProps).toMatchObject({
        tools: SENSITIVE,
        scheduleName: 'Daily digest',
        entityLabel: 'Digest agent v2',
        runWithoutAskingAllowed: true,
        changed: false,
      });
    });

    it('never opens the dialog on an invalid form', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const { onSubmit } = renderForm({ initialValues: { ...INITIAL, name: '' } });
      await fillAgent();

      await save();

      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Pause and ask me saves with the fingerprint and no typed name', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const onSaved = vi.fn();
      const { onSubmit } = renderForm({ onSaved });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () => reviewProps.onConfirm({ rule: 'pause_and_ask' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        approval_rule: 'pause_and_ask',
        risk_ack: { fingerprint: 'fp-1' },
      });
      expect(onSubmit.mock.calls[0][0].risk_ack).not.toHaveProperty('confirmed_name');
      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('Run without asking sets the form rule and saves with the typed name', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const { onSubmit } = renderForm();
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () =>
        reviewProps.onConfirm({ rule: 'run_without_asking', confirmedName: 'Daily digest' }),
      );

      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        approval_rule: 'run_without_asking',
        risk_ack: { fingerprint: 'fp-1', confirmed_name: 'Daily digest' },
      });
      expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('marks the dialog as saving while the save runs', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      let finish;
      renderForm({ onSubmit: vi.fn(() => new Promise(resolve => (finish = resolve))) });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      act(() => {
        reviewProps.onConfirm({ rule: 'pause_and_ask' });
      });

      await waitFor(() => expect(reviewProps.saving).toBe(true));
      await act(async () => finish({ id: 1 }));
    });

    it('Cancel closes the dialog and saves nothing', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const { onSubmit } = renderForm();
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      act(() => reviewProps.onCancel());

      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('409 risk_changed refreshes the tools, asks again and saves with the new fingerprint', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const newTools = [...SENSITIVE, { code: 'sensitive_action', toolkit: 'Jira', tool: 'delete_issue' }];
      const onSubmit = vi
        .fn()
        .mockRejectedValueOnce(conflict('risk_changed', { sensitive: newTools, fingerprint: 'fp-2' }))
        .mockResolvedValue({ id: 1 });
      renderForm({ onSubmit });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () =>
        reviewProps.onConfirm({ rule: 'run_without_asking', confirmedName: 'Daily digest' }),
      );

      expect(screen.getByTestId('risk-dialog')).toHaveTextContent('The tools changed.');
      expect(reviewProps.tools).toEqual(newTools);
      expect(reviewProps.saving).toBe(false);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      await act(async () =>
        reviewProps.onConfirm({ rule: 'run_without_asking', confirmedName: 'Daily digest' }),
      );

      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(onSubmit.mock.calls[1][0].risk_ack).toEqual({
        fingerprint: 'fp-2',
        confirmed_name: 'Daily digest',
      });
      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
    });

    it('409 risk_confirmation_required opens the dialog with the server findings', async () => {
      const onSubmit = vi
        .fn()
        .mockRejectedValueOnce(
          conflict('risk_confirmation_required', { sensitive: SENSITIVE, fingerprint: 'fp-3' }),
        )
        .mockResolvedValue({ id: 1 });
      renderForm({ initialValues: { ...INITIAL, approval_rule: 'run_without_asking' }, onSubmit });
      await fillAgent();

      await save();

      expect(await screen.findByTestId('risk-dialog')).toBeInTheDocument();
      expect(reviewProps.tools).toEqual(SENSITIVE);
      expect(reviewProps.changed).toBe(false);
      await act(async () =>
        reviewProps.onConfirm({ rule: 'run_without_asking', confirmedName: 'Daily digest' }),
      );
      expect(onSubmit.mock.calls[1][0].risk_ack).toEqual({
        fingerprint: 'fp-3',
        confirmed_name: 'Daily digest',
      });
    });

    it('409 schedule_blocked closes the dialog and shows the block box', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const onSubmit = vi.fn().mockRejectedValue(conflict('schedule_blocked', { blocking: [SIGNIN] }));
      renderForm({ onSubmit, initialValues: { ...INITIAL, approval_rule: 'run_without_asking' } });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () => reviewProps.onConfirm({ rule: 'run_without_asking' }));

      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('schedule-risk-block-box')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('starts a pending Test run only after the confirmed save', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const onRunNow = vi.fn().mockResolvedValue(undefined);
      const onSubmit = vi.fn().mockResolvedValue({ id: 3 });
      renderForm({
        initialValues: { ...INITIAL, application_id: 7, version_id: 71, prompt: 'Hi' },
        schedule: { id: 3, owner: { name: 'Ann Lee' } },
        onSubmit,
        onRunNow,
        sidePanel: ({ onRunNow: run }) => (
          <button
            type="button"
            onClick={run}
          >
            Test run
          </button>
        ),
      });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Daily digest' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Changed' } });
      await waitFor(() => expect(saveButton()).toBeEnabled());

      fireEvent.click(screen.getByRole('button', { name: 'Test run' }));
      await screen.findByTestId('risk-dialog');
      expect(onRunNow).not.toHaveBeenCalled();

      await act(async () => reviewProps.onConfirm({ rule: 'pause_and_ask' }));

      await waitFor(() => expect(onRunNow).toHaveBeenCalledTimes(1));
    });

    it('400 risk_name_mismatch keeps the dialog open and shows the server text at the typed name', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const onSubmit = vi
        .fn()
        .mockRejectedValueOnce(
          refusal(400, 'risk_name_mismatch', {
            field: 'risk_ack',
            sensitive: SENSITIVE,
            fingerprint: 'fp-1',
          }),
        )
        .mockResolvedValue({ id: 1 });
      renderForm({ onSubmit });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () =>
        reviewProps.onConfirm({ rule: 'run_without_asking', confirmedName: 'Daily digest' }),
      );

      expect(screen.getByTestId('risk-dialog')).toBeInTheDocument();
      expect(reviewProps.nameError).toBe('Human text of risk_name_mismatch');
      expect(reviewProps.saving).toBe(false);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      await act(async () =>
        reviewProps.onConfirm({ rule: 'run_without_asking', confirmedName: 'Daily digest' }),
      );
      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
    });

    it('branches on the machine code, not on the human text', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const onSubmit = vi.fn().mockRejectedValue({ status: 409, data: { error: 'risk_changed' } });
      renderForm({ onSubmit });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () => reviewProps.onConfirm({ rule: 'pause_and_ask' }));

      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('risk_changed');
    });

    it('shows who confirmed Run without asking and when on the edit page', () => {
      renderForm({
        initialValues: { ...INITIAL, application_id: 7, version_id: 71, approval_rule: 'run_without_asking' },
        schedule: {
          id: 3,
          owner: { name: 'Ann Lee' },
          approval_confirmed_by: 'Anna K.',
          approval_confirmed_at: '2026-10-21T09:00:00+00:00',
        },
      });

      expect(screen.getByText('Confirmed by Anna K. on 21 Oct 2026')).toBeInTheDocument();
    });

    it.each([[undefined], [null], ['not a date']])(
      'shows only who confirmed when the date is %s',
      confirmedAt => {
        renderForm({
          schedule: {
            id: 3,
            owner: { name: 'Ann Lee' },
            approval_confirmed_by: 'Anna K.',
            approval_confirmed_at: confirmedAt,
          },
        });

        expect(screen.getByText('Confirmed by Anna K.')).toBeInTheDocument();
      },
    );

    it('shows no confirmation line when the schedule has none', () => {
      renderForm({ schedule: { id: 3, owner: { name: 'Ann Lee' }, approval_confirmed_by: null } });

      expect(screen.queryByText(/Confirmed by/)).not.toBeInTheDocument();
    });

    // an edit that keeps a confirmed "Run without asking" saves without a new review
    const renderConfirmedEdit = rule =>
      renderForm({
        initialValues: { ...INITIAL, application_id: 7, version_id: 71, prompt: 'Hi', approval_rule: rule },
        schedule: { id: 3, owner: { name: 'Ann Lee' } },
      });

    it('sends schedule_id and skips the review when the check is confirmed', async () => {
      checkRisk.mockReturnValue(answer({ ...RISKY, confirmed: true }));
      const { onSubmit } = renderConfirmedEdit('run_without_asking');
      await waitFor(() =>
        expect(checkRisk).toHaveBeenCalledWith(expect.objectContaining({ schedule_id: 3 })),
      );
      typePrompt('Hi again');
      await waitFor(() => expect(saveButton()).toBeEnabled());

      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('risk_ack');
      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
    });

    it('still opens the review when the rule is Pause and ask me', async () => {
      checkRisk.mockReturnValue(answer({ ...RISKY, confirmed: true }));
      const { onSubmit } = renderConfirmedEdit('pause_and_ask');
      typePrompt('Hi again');
      await waitFor(() => expect(saveButton()).toBeEnabled());

      await save();

      expect(await screen.findByTestId('risk-dialog')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('applies the same flow to the edit page and a nested editor route', async () => {
      checkRisk.mockReturnValue(answer({ ...CLEAR, blocking: [SIGNIN] }));
      renderForm(
        {
          initialValues: {
            ...INITIAL,
            application_id: '7',
            version_id: 71,
            prompt: 'Hi',
            approval_rule: 'run_without_asking',
          },
          lockedEntity: { type: 'agent', id: '7' },
          schedule: { id: 3, owner: { name: 'Ann Lee' } },
        },
        '/agents/all/7/schedules/3',
      );

      expect(await screen.findByTestId('schedule-risk-block-box')).toBeInTheDocument();
      // an absolute app URL with the selected project, because the link opens a new tab
      expect(screen.getByRole('link', { name: /Open agent to change tools/ })).toHaveAttribute(
        'href',
        expect.stringMatching(/^https?:\/\/[^/]+.*\/5\/agents\/all\/7\/71\?viewMode=owner$/),
      );
      expect(saveButton()).toBeDisabled();
    });
  });

  // #7456 review: only the owner's confirmation clears the badge, and the editor lists only webhooks for it
  describe('Needs re-confirm badge', () => {
    const owned = { id: 3, owner: { name: 'Ann Lee' }, allowed_actions: ['edit'], needs_reconfirm: true };

    it('shows on a webhook that needs a new confirmation', () => {
      renderForm({ schedule: { ...owned, trigger_kind: 'webhook' } }, '/settings/webhooks/3');
      expect(screen.getByTestId('schedule-needs-reconfirm')).toBeInTheDocument();
    });

    it('never shows on a schedule, even with needs_reconfirm', () => {
      renderForm({ schedule: { ...owned, trigger_kind: 'cron' } }, '/settings/schedules/3');
      expect(screen.queryByTestId('schedule-needs-reconfirm')).toBeNull();
    });
  });

  // #7401: one row per toolkit; a webhook saves only when every row is OK
  describe('Connections panel', () => {
    const VERSIONED = { ...INITIAL, application_id: '7', version_id: 71, prompt: 'Hi' };
    const WEBHOOK = {
      ...VERSIONED,
      trigger_kind: 'webhook',
      webhook_type: 'custom',
      cron: undefined,
      timezone: undefined,
    };
    const SIGN_IN = {
      toolkit: 'Mail',
      status: 'sign_in_required',
      credential_title: 'team_outlook',
      credential_type: 'outlook',
      reason: 'no saved login: sign in on the credential',
    };
    const REMOTE = { toolkit: 'Remote', status: 'unsupported', reason: 'Webhooks cannot wait for a sign-in' };
    const saveButton = () => screen.getByTestId('schedule-save-button');
    const renderWith = initialValues =>
      renderForm(
        { initialValues, lockedEntity: { type: 'agent', id: '7' } },
        '/agents/all/7/webhooks/create',
      );

    it('blocks a webhook save while a row is not OK, under both rules', async () => {
      checkConnections.mockReturnValue(answer({ rows: [{ toolkit: 'GH', status: 'ok' }, REMOTE] }));
      renderWith({ ...WEBHOOK, approval_rule: 'run_without_asking' });

      expect(await screen.findByTestId('schedule-connections-panel')).toBeInTheDocument();
      expect(screen.getAllByTestId('schedule-connection-row').map(row => row.dataset.status)).toEqual([
        'ok',
        'unsupported',
      ]);
      expect(screen.getByText('Webhooks cannot wait for a sign-in')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
      expect(screen.getByText('Sign in to every connection to save')).toBeInTheDocument();
      expect(checkConnections).toHaveBeenCalledWith(
        expect.objectContaining({ trigger_kind: 'webhook', version_id: 71 }),
      );
    });

    it('saves a webhook once every row is OK', async () => {
      checkConnections.mockReturnValue(answer({ rows: [{ toolkit: 'Mail', status: 'ok' }] }));
      renderWith(WEBHOOK);

      await waitFor(() => expect(saveButton()).toBeEnabled());
    });

    it('shows a sign-in on a saved-login row and checks again after it', async () => {
      checkConnections.mockReturnValueOnce(answer({ rows: [SIGN_IN] }));
      renderWith(WEBHOOK);

      const signIn = await screen.findByTestId('connection-sign-in');
      expect(signIn).toHaveAttribute('data-title', 'team_outlook');
      checkConnections.mockReturnValue(answer({ rows: [{ ...SIGN_IN, status: 'ok', login: 'ok' }] }));
      fireEvent.click(signIn);

      await waitFor(() => expect(saveButton()).toBeEnabled());
      expect(checkConnections).toHaveBeenCalledTimes(2);
    });

    it('lets a schedule under "Pause and ask me" save with a notice', async () => {
      checkConnections.mockReturnValue(answer({ rows: [REMOTE] }));
      renderWith(VERSIONED);

      expect(await screen.findByText(/a run waits for you to sign in/)).toBeInTheDocument();
      await waitFor(() => expect(saveButton()).toBeEnabled());
      expect(checkConnections).toHaveBeenCalledWith(expect.objectContaining({ trigger_kind: 'cron' }));
    });

    it('shows the rows of a refused webhook save in the panel', async () => {
      checkConnections.mockReturnValue(answer({ rows: [{ toolkit: 'Mail', status: 'ok' }] }));
      const refused = { status: 409, data: { code: 'connections_not_ready', error: 'x', rows: [REMOTE] } };
      const onSubmit = vi.fn().mockRejectedValue(refused);
      renderForm(
        { initialValues: WEBHOOK, lockedEntity: { type: 'agent', id: '7' }, onSubmit },
        '/agents/all/7/webhooks/create',
      );
      await waitFor(() => expect(saveButton()).toBeEnabled());

      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(await screen.findByText('Webhooks cannot wait for a sign-in')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('says the connections could not be checked when the check fails', async () => {
      checkConnections.mockReturnValue({ unwrap: () => Promise.reject(new Error('down')) });
      renderWith(WEBHOOK);

      expect(
        await screen.findByText('Connections could not be checked; try again to save'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Sign in to every connection to save')).toBeNull();
      expect(saveButton()).toBeDisabled();
    });

    it('never shows the rows of the previous version while the new one is checked', async () => {
      checkConnections.mockReturnValueOnce(answer({ rows: [REMOTE] }));
      renderForm(
        {
          initialValues: { ...WEBHOOK, application_id: '' },
          lockedEntity: undefined,
        },
        '/settings/webhooks/create',
      );
      pickEntity(7);
      await waitFor(() => expect(versionProps.value).toBe(71));
      expect(await screen.findByText('Webhooks cannot wait for a sign-in')).toBeInTheDocument();

      checkConnections.mockReturnValue({ unwrap: () => new Promise(() => {}) });
      await act(async () => versionProps.onChange(70));

      expect(screen.queryByText('Webhooks cannot wait for a sign-in')).toBeNull();
      expect(screen.getByText('Checking connections')).toBeInTheDocument();
    });

    it('shows the server error when a refused save carries no rows', async () => {
      checkConnections.mockReturnValue(answer({ rows: [{ toolkit: 'Mail', status: 'ok' }] }));
      const refused = {
        status: 409,
        data: { code: 'connections_not_ready', error: 'Every toolkit must run unattended' },
      };
      const onSubmit = vi.fn().mockRejectedValue(refused);
      renderForm(
        { initialValues: WEBHOOK, lockedEntity: { type: 'agent', id: '7' }, onSubmit },
        '/agents/all/7/webhooks/create',
      );
      await waitFor(() => expect(saveButton()).toBeEnabled());

      await save();

      expect(await screen.findByText('Every toolkit must run unattended')).toBeInTheDocument();
    });

    it('keeps Save clickable before an agent and a version are chosen, so its errors show', async () => {
      checkConnections.mockClear();
      renderForm(
        { initialValues: { ...WEBHOOK, application_id: '', version_id: '' } },
        '/settings/webhooks/create',
      );
      await act(async () => {});

      expect(saveButton()).toBeEnabled();
      expect(screen.queryByText('Checking connections')).toBeNull();
      expect(checkConnections).not.toHaveBeenCalled();
      fireEvent.click(saveButton());
      expect(await screen.findByText('Choose an agent or a pipeline')).toBeInTheDocument();
    });

    it('says why Run Now did nothing while the connections hold the save', async () => {
      checkConnections.mockReturnValue(answer({ rows: [REMOTE] }));
      const onRunNow = vi.fn().mockResolvedValue(undefined);
      renderForm(
        {
          initialValues: { ...WEBHOOK, name: 'Changed' },
          lockedEntity: { type: 'agent', id: '7' },
          schedule: { id: 3, trigger_kind: 'webhook', enabled: true, allowed_actions: ['edit', 'run'] },
          onRunNow,
          sidePanel: ({ onRunNow: run, runNowError }) => (
            <div>
              <button
                type="button"
                data-testid="run-now"
                onClick={run}
              />
              {runNowError && <p data-testid="run-now-error">{runNowError}</p>}
            </div>
          ),
        },
        '/agents/all/7/webhooks/3',
      );
      await screen.findByTestId('schedule-connections-panel');
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed' } });

      fireEvent.click(screen.getByTestId('run-now'));

      expect(await screen.findByTestId('run-now-error')).toHaveTextContent(
        'Sign in to every connection to save',
      );
      expect(onRunNow).not.toHaveBeenCalled();
    });

    it('offers Re-enable on a webhook switched off by an expired login', async () => {
      checkConnections.mockReturnValue(answer({ rows: [SIGN_IN] }));
      renderForm(
        {
          initialValues: WEBHOOK,
          lockedEntity: { type: 'agent', id: '7' },
          schedule: {
            id: 3,
            trigger_kind: 'webhook',
            enabled: false,
            disabled_reason: 'credential_expired',
            allowed_actions: ['edit', 'resume'],
            owner: { name: 'Ann Lee' },
          },
        },
        '/agents/all/7/webhooks/3',
      );

      expect(await screen.findByTestId('schedule-reenable-banner')).toHaveTextContent(
        /saved login stopped working/,
      );
      expect(screen.getByTestId('schedule-reenable-button')).toBeInTheDocument();
      expect(checkConnections).toHaveBeenCalledWith(expect.objectContaining({ schedule_id: 3 }));
    });
  });
});
