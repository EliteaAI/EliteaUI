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

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationListQuery: args => listQuery(args),
  useApplicationDetailsQuery: ({ applicationId }, { skip }) => ({
    currentData: skip ? undefined : DETAILS[applicationId],
    isFetching: false,
  }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
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
          disabled={disabled}
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
  default: ({ message }) => <div role="alert">{message}</div>,
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
};

const theme = createTheme(getDesignTokens('dark'));

const renderForm = (props = {}) => {
  const handlers = { onSubmit: vi.fn().mockResolvedValue(undefined), onCancel: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/schedules/create']}>
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
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('ScheduleForm EL-7011', () => {
  beforeEach(() => {
    listQuery.mockReturnValue({ data: { rows: ROWS, total: 2 }, isFetching: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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

    save();

    expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('R5.1 R5.2 EL-7011 locks Type and the entity from the URL and keeps the rest editable', () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 9 },
      lockedEntity: { type: 'pipeline', id: 9 },
    });

    expect(screen.getByTestId('schedule-type-agent')).toBeDisabled();
    expect(selectProps.disabled).toBe(true);
    expect(screen.getByTestId('schedule-run-mode-prompt')).toBeEnabled();
    expect(versionProps.disabled).toBeFalsy();
  });

  it('R5.3 EL-7011 unlocks and shows a banner when the URL entity has another type', async () => {
    renderForm({
      initialValues: { ...INITIAL, type: 'pipeline', run_mode: 'entry_point', application_id: 7 },
      lockedEntity: { type: 'pipeline', id: 7 },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('not available');
    expect(selectProps.disabled).toBeFalsy();
    expect(selectProps.value).toBe('');
  });

  it('R6.1 EL-7011 sends the create body on Save', async () => {
    const { onSubmit } = renderForm();
    pickEntity(7);
    await waitFor(() => expect(versionProps.value).toBe(71));
    typePrompt('Hello {{team}}');

    save();

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

    save();

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

    save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Runs must be at least 5 minutes apart');
  });

  it('R6.1 EL-7011 keeps Save from sending without a name, an entity and a version', async () => {
    const { onSubmit } = renderForm({ initialValues: { ...INITIAL, name: '' } });
    typePrompt('Hi');

    save();

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

    save();

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
    save();
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

    await waitFor(() => expect(versionProps.value).toBe(71));
    expect(navBlocker).toHaveBeenLastCalledWith({ blockCondition: false });
  });

  it('R6.4 EL-7011 shows the server text of a 409 in the banner', async () => {
    renderForm({
      onSubmit: vi.fn().mockRejectedValue({ status: 409, data: { error: 'Schedule limit reached' } }),
    });
    pickEntity(7);
    typePrompt('Hi');

    save();

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

  it('EL-7011 collapses a section from its header', () => {
    renderForm();
    const header = screen.getByTestId('schedule-section-general');
    expect(header).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  describe('edit mode', () => {
    const SCHEDULE = {
      id: 3,
      owner: { id: 1, name: 'Ann Lee' },
      allowed_actions: ['edit', 'run'],
    };
    const EDIT_INITIAL = { ...INITIAL, application_id: 7, version_id: 71, prompt: 'Hi' };
    const renderEdit = (props = {}) =>
      renderForm({
        initialValues: EDIT_INITIAL,
        schedule: SCHEDULE,
        onTestRun: vi.fn().mockResolvedValue(undefined),
        ...props,
      });
    const testRun = () => fireEvent.click(screen.getByTestId('schedule-form-test-run'));
    const edit = () => fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Changed' } });

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

    it('R3.3 EL-7011 hides Test run without the run action and in create mode', () => {
      renderEdit({ schedule: { ...SCHEDULE, allowed_actions: ['edit'] } });
      expect(screen.queryByTestId('schedule-form-test-run')).not.toBeInTheDocument();
      cleanup();

      renderForm();
      expect(screen.queryByTestId('schedule-form-test-run')).not.toBeInTheDocument();
      cleanup();

      renderEdit();
      expect(screen.getByTestId('schedule-form-test-run')).toBeInTheDocument();
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

    it('R3.5 EL-7011 shows the server reason of a 409 run in the banner', async () => {
      renderEdit({ onTestRun: vi.fn().mockRejectedValue({ status: 409, data: { error: 'Already running' } }) });

      testRun();

      expect(await screen.findByRole('alert')).toHaveTextContent('Already running');
    });

    it('R2.4 EL-7011 shows a 400 on save under its field and keeps the form open', async () => {
      renderEdit({
        onSubmit: vi.fn().mockRejectedValue({ status: 400, data: { field: 'name', error: 'Name is taken' } }),
      });
      edit();

      save();

      expect(await screen.findByText('Name is taken')).toBeInTheDocument();
    });

    it('EL-7011 calls onSaved with the answer after a plain Save', async () => {
      const onSaved = vi.fn();
      renderEdit({ onSubmit: vi.fn().mockResolvedValue({ id: 3 }), onSaved });
      edit();

      save();

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 3 }));
    });

    it('EL-7011 passes entityName to the breadcrumb and renders extra sections', () => {
      renderEdit({ entityName: 'Digest', extraSections: [{ title: 'RUNS', content: <p>run list</p> }] });

      expect(screen.getByRole('navigation')).toHaveTextContent('Schedules / Digest');
      expect(screen.getByText('RUNS')).toBeInTheDocument();
      expect(screen.getByText('run list')).toBeInTheDocument();
    });
  });
});
