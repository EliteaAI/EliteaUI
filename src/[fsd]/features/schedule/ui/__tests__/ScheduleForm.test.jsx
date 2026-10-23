// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleForm from '../ScheduleForm';

// EL-7011 US-31: the three-section schedule form (R2 to R6). Child widgets are replaced by plain elements.

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

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission => (permission === 'models.applications.schedules.admin' ? isAdmin : allowed),
  }),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleListQuery: () => ({
    data: runAllowed === undefined ? undefined : { runWithoutAskingAllowed: runAllowed },
    isError: listFailed,
  }),
  useCheckScheduleRiskMutation: () => [checkRisk],
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

vi.mock('@/[fsd]/entities/version', async importOriginal => ({
  ...(await importOriginal()),
  VersionSelect: props => {
    versionProps = props;
    return <div data-testid="version-select" />;
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
const typePrompt = text => fireEvent.change(screen.getByLabelText(/Prompt/), { target: { value: text } });
const CLEAR = {
  blocking: [],
  sensitive: [],
  notices: [],
  run_without_asking_allowed: true,
  fingerprint: 'fp-0',
};
const answer = data => ({ unwrap: () => Promise.resolve(data) });
// The risk check answers in a promise; Save is disabled until it does (owner CR 2026-10-21)
const save = async () => {
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('ScheduleForm EL-7011', () => {
  beforeEach(() => {
    allowed = true;
    isAdmin = false;
    runAllowed = true;
    listFailed = false;
    listQuery.mockReturnValue({ data: { rows: ROWS, total: 2 }, isFetching: false });
    checkRisk.mockReturnValue(answer(CLEAR));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R1.1 EL-7011 opens the Build with AI popup with formik, dirty state and the locked entity', () => {
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
    'US-35 owner bug 4 shows no selected-tab indicator in the header of %s, which has no tabs',
    path => {
      renderForm({ lockedEntity: { type: 'agent', id: 7 } }, path);

      expect(document.querySelector('.MuiTabs-indicator')).toHaveStyle({ display: 'none' });
    },
  );

  it('R1.2 EL-7011 hides Build with AI without the schedules create permission', () => {
    allowed = false;
    renderForm();

    expect(screen.queryByRole('button', { name: 'Build with AI' })).not.toBeInTheDocument();
  });

  it('R1.1 CR-26 shows Build with AI on the New schedule form', () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'Build with AI' })).toBeInTheDocument();
  });

  it('R1.1 CR-26 hides Build with AI on an existing schedule', () => {
    renderForm({ schedule: { id: 3, owner: { name: 'Ann Lee' } } }, '/settings/schedules/3');

    expect(screen.queryByRole('button', { name: 'Build with AI' })).not.toBeInTheDocument();
  });

  it('R2.1 EL-7011 shows GENERAL, WHAT TO RUN and SCHEDULE SETTINGS in this order', () => {
    renderForm();

    expect(screen.getAllByRole('heading').map(h => h.textContent)).toEqual([
      'GENERAL',
      'WHAT TO RUN',
      'SCHEDULE SETTINGS',
    ]);
  });

  it('R2.2 EL-7011 shows Name and a multiline Description capped at 2304, and no tags field', () => {
    renderForm();

    expect(screen.getByLabelText(/Name/)).toHaveValue('Daily digest');
    const description = screen.getByLabelText('Description');
    expect(description.tagName).toBe('TEXTAREA');
    expect(description).toHaveAttribute('maxlength', String(MAX_DESCRIPTION_LENGTH));
    expect(screen.queryByText(/tags/i)).not.toBeInTheDocument();
  });

  it('R3.1 EL-7011 shows the Type radio with Agent selected', () => {
    renderForm();

    expect(screen.getByTestId('schedule-type-agent')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('schedule-type-pipeline')).toHaveAttribute('aria-pressed', 'false');
  });

  it('R3.2 EL-7011 lists only entities of the selected Type, labeled by it', () => {
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

  it('R3.3 EL-7011 loads the next page at the end of the list', () => {
    renderForm();

    act(() => selectProps.onLoadMore());

    expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('R3.3 EL-7011 asks the same page again after a failed page (BUG-46, TC-US25-05)', () => {
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
    listQuery.mockImplementation(args => ({ data: { rows: ROWS, total: 60 }, isFetching: false, originalArgs: args }));
    act(() => selectProps.onLoadMore());
    expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    expect(selectProps.options.map(o => o.label)).toEqual(['Digest agent', 'Other agent']);
  });

  it('R3.4 EL-7011 presets the version to the default version of the selected entity', async () => {
    renderForm();

    pickEntity(7);

    await waitFor(() => expect(versionProps.value).toBe(71));
    expect(versionProps.onChange).toBeTypeOf('function');
  });

  it('R4.2 EL-7011 shows a required Prompt with Variables for an agent', () => {
    renderForm();
    pickEntity(7);

    typePrompt('Hello {{team}}');

    expect(screen.getByTestId('variables')).toHaveTextContent('team');
  });

  it('R4.1 R4.4 EL-7011 shows Run mode for a pipeline and hides Prompt in Entry point', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('schedule-type-pipeline'));

    expect(screen.getByTestId('schedule-run-mode-entry_point')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText(/Prompt/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('variables')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('schedule-run-mode-prompt'));

    expect(screen.getByLabelText(/Prompt/)).toBeInTheDocument();
  });

  it('R4.5 EL-7011 keeps Save from sending and shows "Prompt is required"', async () => {
    const { onSubmit } = renderForm();
    pickEntity(7);

    await save();

    expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('R5.1 R5.2 EL-7011 hides Type and the entity of the URL and keeps Run mode editable', () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 9 },
      lockedEntity: { type: 'pipeline', id: 9 },
    });

    expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entity-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedule-run-mode-prompt')).toBeEnabled();
  });

  it('R5.3 EL-7011 unlocks and shows a banner when the URL entity has another type', async () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 7 },
      lockedEntity: { type: 'pipeline', id: 7 },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('not available');
    expect(selectProps.disabled).toBeFalsy();
    expect(selectProps.value).toBe('');
    // CR-19: the failed lock brings back the full form with its WHAT TO RUN section
    expect(screen.getAllByRole('heading').map(h => h.textContent)).toContain('WHAT TO RUN');
  });

  it('R6.1 EL-7011 sends the create body on Save', async () => {
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

  it('R6.3 EL-7011 shows a 400 message under its field and keeps the form open', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByText('Name is taken')).toBeInTheDocument();
  });

  it('R6.3 EL-7011 shows a 400 message for a field without an input in the banner', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({
        status: 400,
        data: { field: 'cron', error: 'Runs must be at least 5 minutes apart' },
      }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Runs must be at least 5 minutes apart');
  });

  it('R6.1 EL-7011 keeps Save from sending without a name, an entity and a version', async () => {
    const { onSubmit } = renderForm({ initialValues: { ...INITIAL, name: '' } });
    typePrompt('Hi');

    await save();

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(selectProps.helperText).toBe('Choose an agent or a pipeline');
    expect(screen.getByText('Choose an agent or a pipeline')).toBeInTheDocument();
    expect(screen.getByText('Choose a version')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('R4.2 EL-7011 keeps the first of two fast changes', async () => {
    const { onSubmit } = renderForm();
    act(() => {
      selectProps.onValueChange(7);
      fireEvent.change(screen.getByLabelText(/Prompt/), { target: { value: 'Hi' } });
    });
    await waitFor(() => expect(versionProps.value).toBe(71));

    await save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ application_id: 7, prompt: 'Hi' });
  });

  it('R1.3 EL-7011 a change in SCHEDULE SETTINGS alone makes the form dirty and reaches the body', async () => {
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

  it('R1.3 R5.3 EL-7011 unlocking an unavailable URL entity keeps the form clean', async () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 7 },
      lockedEntity: { type: 'pipeline', id: 7 },
    });

    await waitFor(() => expect(selectProps.value).toBe(''));
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
  });

  it('R1.3 R3.4 EL-7011 the default version of the URL entity keeps the form clean', async () => {
    renderForm({ initialValues: { ...INITIAL, application_id: 7 }, lockedEntity: { type: 'agent', id: 7 } });

    await waitFor(() => expect(checkRisk).toHaveBeenCalled());
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
  });

  it('R6.4 EL-7011 shows the server text of a 409 in the banner', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({ status: 409, data: { error: 'Schedule limit reached' } }),
    });
    pickEntity(7);
    typePrompt('Hi');

    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Schedule limit reached');
  });

  it('R1.3 EL-7011 blocks leaving only while the form has unsaved changes', () => {
    renderForm();
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nightly digest' } });
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: true });
  });

  it('R6.5 EL-7011 returns through onCancel without saving', () => {
    const { onSubmit, onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('EL-7011 shows Save and Cancel in the page header bar, beside the breadcrumb', () => {
    renderForm();

    const bar = screen.getByRole('navigation').parentElement.parentElement;
    expect(bar).toContainElement(screen.getByTestId('schedule-save-button'));
    expect(bar).toContainElement(screen.getByTestId('schedule-cancel-button'));
    expect(screen.getByRole('tabpanel')).not.toContainElement(screen.getByTestId('schedule-save-button'));
  });

  it('CR-16 R4.3 EL-7011 shows the headerActions node in the header bar after Cancel', () => {
    renderForm({ headerActions: <span data-testid="header-menu" /> });

    const bar = screen.getByRole('navigation').parentElement.parentElement;
    const menu = screen.getByTestId('header-menu');
    expect(bar).toContainElement(menu);
    expect(screen.getByTestId('schedule-cancel-button').compareDocumentPosition(menu)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('EL-7011 collapses a section from its header', () => {
    renderForm();
    const header = screen.getByTestId('schedule-section-general');
    expect(header).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  it('R1.1 EL-7011 shows Approval rule with Pause and ask me selected and sends it', async () => {
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

  it('R1.2 EL-7011 selects the saved approval rule', () => {
    renderForm({ initialValues: { ...INITIAL, approval_rule: 'run_without_asking' } });

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('R1.3 EL-7011 disables Run without asking with a hint when the project does not allow it', () => {
    runAllowed = false;
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
  });

  it('R1.3 EL-7011 keeps Run without asking disabled with no hint while the project data loads', () => {
    runAllowed = undefined;
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.queryByText(/does not allow/)).not.toBeInTheDocument();
  });

  it('R1.3 EL-7011 keeps Run without asking disabled with no hint when the project data fails', () => {
    runAllowed = undefined;
    listFailed = true;
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.queryByText(/does not allow/)).not.toBeInTheDocument();
  });

  it('R1.3 EL-7011 owner CR links a project admin from the hint to Project General', () => {
    runAllowed = false;
    isAdmin = true;
    renderForm();

    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change it in Settings > Project General' })).toHaveAttribute(
      'href',
      '/settings/project-general',
    );
  });

  it('R1.3 EL-7011 owner CR shows no settings link to a non-admin', () => {
    runAllowed = false;
    renderForm();

    expect(screen.getByText(/does not allow/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Project General/ })).not.toBeInTheDocument();
  });

  it('R1.3 EL-7011 links the Approval rule label and the hint to the radio group', () => {
    runAllowed = false;
    renderForm();

    expect(screen.getByText('Approval rule')).toHaveAttribute('id', 'schedule-approval-rule-label');
    const hint = screen.getByText(/does not allow/);
    expect(screen.getByTestId('schedule-approval-rule-group')).toHaveAttribute('aria-describedby', hint.id);
  });

  it('R1.5 EL-7011 shows the returned rule and a note without warnings, then returns on close', async () => {
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

  it('R1.3 EL-7011 enables Run without asking when the project allows it', () => {
    renderForm();

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeEnabled();
    expect(screen.queryByText(/does not allow/)).not.toBeInTheDocument();
  });

  it('R1.5 EL-7011 shows the server text of approval_rule_not_allowed at the field', async () => {
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

  it('R1.5 EL-7011 shows the returned rule and the hint when the save answers a different rule', async () => {
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

  it('R2.1 R2.4 EL-7011 opens the warnings dialog after a save with warnings and returns on close', async () => {
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

  it('R2.5 EL-7011 returns at once without a dialog when the save has no warnings', async () => {
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

  // The nested route of the agent editor gives the locked entity as a URL string (owner CR 2026-10-21)
  describe('agent editor entry (US-35)', () => {
    const renderFromEditor = () =>
      renderForm({
        initialValues: { ...INITIAL, application_id: '7' },
        lockedEntity: { type: 'agent', id: '7' },
      });

    it('TC-US35-08 R4.1 EL-7011 locks Type Agent and this agent and presets the default version', async () => {
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

    it('TC-US35-16 TC-US35-17 R4.2 keeps Prompt and Variables editable and saves them', async () => {
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

    it('TC-US35-17 R4.2 still asks for the prompt', async () => {
      const { onSubmit } = renderFromEditor();

      await save();

      expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('pipeline editor entry (US-36)', () => {
    const renderFromPipeline = () =>
      renderForm({
        initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: '9' },
        lockedEntity: { type: 'pipeline', id: '9' },
      });

    it('TC-US36-14 R4.1 EL-7011 hides Type and this pipeline', () => {
      renderFromPipeline();

      expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
      expect(screen.queryByTestId('entity-select')).not.toBeInTheDocument();
    });

    it('TC-US36-15 R4.2 saves Entry point with no prompt by default', async () => {
      const { onSubmit } = renderFromPipeline();

      expect(screen.getByTestId('schedule-run-mode-entry_point')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByLabelText(/Prompt/)).not.toBeInTheDocument();
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

    it('TC-US36-15 R4.2 Prompt mode asks for the prompt and shows one field per placeholder', async () => {
      const { onSubmit } = renderFromPipeline();
      fireEvent.click(screen.getByTestId('schedule-run-mode-prompt'));

      await save();
      expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();

      typePrompt('Report for {{region}}');
      expect(screen.getByTestId('variables')).toHaveTextContent('region');
    });
  });

  describe('form nested in an editor (CR-19)', () => {
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

    it('TC-US58-14 R5.3 EL-7011 hides the type switch, the entity, the version and WHAT TO RUN', () => {
      renderLocked();

      expect(screen.getAllByRole('heading').map(h => h.textContent)).toEqual([
        'GENERAL',
        'SCHEDULE SETTINGS',
      ]);
      expect(screen.queryByTestId('schedule-type')).not.toBeInTheDocument();
      expect(screen.queryByTestId('entity-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('version-select')).not.toBeInTheDocument();
    });

    it('TC-US58-15 R5.4 EL-7011 shows Prompt and Variables under General for an agent', () => {
      renderLocked();

      expectUnderGeneral(screen.getByLabelText(/Prompt/));
      expectUnderGeneral(screen.getByTestId('variables'));
      expect(screen.queryByTestId('schedule-run-mode')).not.toBeInTheDocument();
    });

    it('TC-US58-15 R5.4 EL-7011 shows Run mode under General for a pipeline', () => {
      renderLocked('pipeline');

      expectUnderGeneral(screen.getByTestId('schedule-run-mode'));
    });

    it('TC-US58-14 R5.3 EL-7011 saves the version of the editor, not the default version', async () => {
      const { onSubmit } = renderLocked();

      typePrompt('Digest');
      await save();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ application_id: '7', version_id: 70 });
    });

    it('TC-US58-16 R5.6 EL-7011 keeps every selector without a locked entity', () => {
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
    // The edit page's side panel holds Test run (owner CR 2026-10-21); this stand-in shows what the form passes
    const sidePanel = ({ onTestRun, testRunPending, testRunError }) => (
      <div data-testid="side-panel">
        <button
          type="button"
          data-testid="schedule-form-test-run"
          disabled={testRunPending}
          onClick={onTestRun}
        >
          Test run
        </button>
        {testRunError && <p data-testid="test-run-error">{testRunError}</p>}
      </div>
    );
    const renderEdit = (props = {}) =>
      renderForm({
        initialValues: EDIT_INITIAL,
        schedule: SCHEDULE,
        onTestRun: vi.fn().mockResolvedValue(undefined),
        sidePanel,
        ...props,
      });
    const testRun = () => fireEvent.click(screen.getByTestId('schedule-form-test-run'));
    const edit = () => fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Changed' } });
    const saveButton = () => screen.getByTestId('schedule-save-button');

    it('R1.5 EL-7011 BUG-34 keeps Save disabled on the edit page until a value changes', async () => {
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

    it('R1.5 EL-7011 BUG-34 keeps Save enabled on the create page without a change', async () => {
      renderForm();
      await act(async () => {});
      expect(saveButton()).toBeEnabled();
    });

    it('R2.2 EL-7011 shows the Owner as read-only text only for a saved schedule', () => {
      renderEdit();
      expect(screen.getByLabelText('Owner')).toHaveValue('Ann Lee');
      expect(screen.getByLabelText('Owner')).toBeDisabled();
      cleanup();

      renderForm();
      expect(screen.queryByLabelText('Owner')).not.toBeInTheDocument();
    });

    it('R1.6 EL-7011 keeps Type and the entity editable without a URL entity', () => {
      renderEdit();

      expect(screen.getByTestId('schedule-type-agent')).toBeEnabled();
      expect(selectProps.disabled).toBeFalsy();
    });

    it('R3.3 EL-7011 has no Test run in the header; only the side panel holds it', () => {
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

    it('EL-7011 QA 2026-10-21 puts the side panel right of the form only from the xl breakpoint', () => {
      renderEdit();
      const panelColumn = screen.getByTestId('side-panel').parentElement;
      const formColumn = panelColumn.previousElementSibling;
      [panelColumn, formColumn].forEach(column => {
        expect(column).toHaveClass('MuiGrid-grid-xs-12', 'MuiGrid-grid-xl-6');
        expect(column).not.toHaveClass('MuiGrid-grid-lg-6');
      });
    });

    it('R4.1 EL-7011 CR-21 renders what sidePanel returns, the panel and the Runs section, in the right column', () => {
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
      expect(runs.parentElement).toHaveClass('MuiGrid-grid-xs-12', 'MuiGrid-grid-xl-6');
      expect(screen.getByLabelText('Name').closest('form').parentElement).not.toContainElement(runs);
    });

    it('R3.1 R3.2 EL-7011 saves a changed form first, then starts the run', async () => {
      const calls = [];
      const onSubmit = vi.fn().mockImplementation(async () => calls.push('save'));
      const onTestRun = vi.fn().mockImplementation(async () => calls.push('run'));
      renderEdit({ onSubmit, onTestRun });
      edit();

      testRun();

      await waitFor(() => expect(onTestRun).toHaveBeenCalledTimes(1));
      expect(calls).toEqual(['save', 'run']);
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Changed' });
    });

    it('R3.1 EL-7011 runs a clean form without saving', async () => {
      const { onSubmit } = renderEdit();

      testRun();

      await waitFor(() => expect(screen.getByTestId('schedule-form-test-run')).toBeEnabled());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('R3.1 EL-7011 disables Test run while the run is pending, so a double click sends one run', async () => {
      let finish;
      const onTestRun = vi.fn(() => new Promise(resolve => (finish = resolve)));
      renderEdit({ onTestRun });

      testRun();
      await waitFor(() => expect(screen.getByTestId('schedule-form-test-run')).toBeDisabled());
      testRun();
      expect(onTestRun).toHaveBeenCalledTimes(1);

      await act(async () => finish());
      expect(screen.getByTestId('schedule-form-test-run')).toBeEnabled();
    });

    it('R3.1 EL-7011 a second Test run after a save does not save again', async () => {
      const { onSubmit } = renderEdit();
      edit();
      testRun();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

      testRun();

      await waitFor(() => expect(screen.getByTestId('schedule-form-test-run')).toBeEnabled());
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('R3.4 EL-7011 sends no run when the save fails', async () => {
      const onTestRun = vi.fn();
      renderEdit({
        onTestRun,
        onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
      });
      edit();

      testRun();

      expect(await screen.findByText('Name is taken')).toBeInTheDocument();
      expect(onTestRun).not.toHaveBeenCalled();
    });

    it('R3.4 EL-7011 sends no run when the form is invalid', async () => {
      const { onSubmit } = renderEdit();
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });

      testRun();

      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('R3.5 EL-7011 passes the server reason of a 409 run to the side panel, not the form banner', async () => {
      renderEdit({
        onTestRun: vi.fn().mockRejectedValue({ status: 409, data: { error: 'Already running' } }),
      });

      testRun();

      expect(await screen.findByTestId('test-run-error')).toHaveTextContent('Already running');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('R3.5 EL-7011 clears the run reason when the next Test run starts', async () => {
      const onTestRun = vi
        .fn()
        .mockRejectedValueOnce({ status: 409, data: { error: 'Already running' } })
        .mockResolvedValue(undefined);
      renderEdit({ onTestRun });

      testRun();
      await screen.findByTestId('test-run-error');
      testRun();

      await waitFor(() => expect(screen.queryByTestId('test-run-error')).not.toBeInTheDocument());
    });

    it('R2.4 EL-7011 shows a 400 on save under its field and keeps the form open', async () => {
      renderEdit({
        onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
      });
      edit();

      await save();

      expect(await screen.findByText('Name is taken')).toBeInTheDocument();
    });

    it('R3.1 EL-7011 starts the run after the warnings dialog closes, not before, and skips onSaved', async () => {
      const onSaved = vi.fn();
      const onTestRun = vi.fn().mockResolvedValue(undefined);
      renderEdit({
        onSubmit: vi.fn().mockResolvedValue({ id: 3, warnings: [{ code: 'x', message: 'm' }] }),
        onSaved,
        onTestRun,
      });
      edit();

      testRun();

      await screen.findByTestId('warnings-dialog');
      expect(onTestRun).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));
      await waitFor(() => expect(onTestRun).toHaveBeenCalledTimes(1));
      expect(onSaved).not.toHaveBeenCalled();
    });

    it('EL-7011 calls onSaved with the answer after a plain Save', async () => {
      const onSaved = vi.fn();
      renderEdit({ onSubmit: vi.fn().mockResolvedValue({ id: 3 }), onSaved });
      edit();

      await save();

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 3 }));
    });

    it('EL-7011 passes entityName to the breadcrumb and renders the side panel outside the form', () => {
      renderEdit({ entityName: 'Digest' });

      expect(screen.getByRole('navigation')).toHaveTextContent('Schedules / Digest');
      expect(screen.getByTestId('side-panel').closest('form')).toBeNull();
      expect(screen.getByLabelText('Name').closest('form')).not.toBeNull();
    });
  });

  // EL-7011 owner CR 2026-10-21: risk review before saving (US-33, US-31, US-32)
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
      renderForm();
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

    it('checks again on Save and saves nothing when the fresh check blocks', async () => {
      const { onSubmit } = renderForm();
      await fillAgent();
      checkRisk.mockReturnValue(answer({ ...CLEAR, blocking: [SIGNIN] }));

      await save();

      expect(await screen.findByTestId('schedule-risk-block-box')).toBeInTheDocument();
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
      renderForm({ onSubmit });
      await fillAgent();
      await save();
      await screen.findByTestId('risk-dialog');

      await act(async () => reviewProps.onConfirm({ rule: 'pause_and_ask' }));

      expect(screen.queryByTestId('risk-dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('schedule-risk-block-box')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('starts a pending Test run only after the confirmed save', async () => {
      checkRisk.mockReturnValue(answer(RISKY));
      const onTestRun = vi.fn().mockResolvedValue(undefined);
      const onSubmit = vi.fn().mockResolvedValue({ id: 3 });
      renderForm({
        initialValues: { ...INITIAL, application_id: 7, version_id: 71, prompt: 'Hi' },
        schedule: { id: 3, owner: { name: 'Ann Lee' } },
        onSubmit,
        onTestRun,
        sidePanel: ({ onTestRun: run }) => (
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
      expect(onTestRun).not.toHaveBeenCalled();

      await act(async () => reviewProps.onConfirm({ rule: 'pause_and_ask' }));

      await waitFor(() => expect(onTestRun).toHaveBeenCalledTimes(1));
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

    // US-33 R2.6 (BUG-36): an edit that keeps a confirmed "Run without asking" saves without a new review
    const renderConfirmedEdit = rule =>
      renderForm({
        initialValues: { ...INITIAL, application_id: 7, version_id: 71, prompt: 'Hi', approval_rule: rule },
        schedule: { id: 3, owner: { name: 'Ann Lee' } },
      });

    it('R2.6 EL-7011 BUG-36 sends schedule_id and skips the review when the check is confirmed', async () => {
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

    it('R2.6 EL-7011 BUG-36 still opens the review when the rule is Pause and ask me', async () => {
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
          initialValues: { ...INITIAL, application_id: '7', version_id: 71, prompt: 'Hi' },
          lockedEntity: { type: 'agent', id: '7' },
          schedule: { id: 3, owner: { name: 'Ann Lee' } },
        },
        '/agents/all/7/schedules/3',
      );

      expect(await screen.findByTestId('schedule-risk-block-box')).toBeInTheDocument();
      // CR-11 review r2: an absolute app URL with the selected project, because the link opens a new tab
      expect(screen.getByRole('link', { name: /Open agent to change tools/ })).toHaveAttribute(
        'href',
        expect.stringMatching(/^https?:\/\/[^/]+.*\/5\/agents\/all\/7\/71\?viewMode=owner$/),
      );
      expect(saveButton()).toBeDisabled();
    });
  });
});
