// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import BuildScheduleWithAiModal from '../BuildScheduleWithAiModal';

// EL-7011 US-34: the Build with AI popup of the schedule form (R1 to R3).

const generateDraft = vi.fn();
const resetGenerate = vi.fn();
let mutationState;

vi.mock('@/[fsd]/features/schedule/api', () => ({
  useGenerateScheduleDraftMutation: () => [
    generateDraft,
    { error: mutationState.error, reset: resetGenerate },
  ],
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError: vi.fn() }),
}));

const VALUES = {
  name: '',
  description: '',
  type: 'agent',
  application_id: '',
  version_id: '',
  run_mode: null,
  prompt: '',
  variables: [],
  cron: '0 0 * * 6',
  timezone: 'UTC',
  expires_at: null,
};
const DRAFT = {
  name: 'Weekly report',
  description: 'Sends the report',
  entity_type: 'agent',
  application_id: 'A1',
  version_id: 'V1',
  prompt: 'Report on {{topic}}',
  variables: [{ name: 'topic', value: 'sales' }],
  cron: '0 9 * * 1',
  timezone: 'UTC',
};
const answer = body => generateDraft.mockReturnValue({ unwrap: () => Promise.resolve(body), abort: vi.fn() });

const setup = (formik = {}, extra = {}) => {
  const props = {
    open: true,
    onClose: vi.fn(),
    lockedEntity: null,
    ...extra,
    formik: { values: VALUES, dirty: false, setValues: vi.fn(), ...formik },
  };
  const ui = p => (
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <BuildScheduleWithAiModal {...p} />
    </ThemeProvider>
  );
  const { rerender } = render(ui(props));
  return { ...props, rerenderWith: next => rerender(ui({ ...props, ...next })) };
};
const generate = text => {
  fireEvent.change(screen.getByTestId('schedule-ai-prompt'), { target: { value: text } });
  fireEvent.click(screen.getByTestId('schedule-ai-generate'));
};

describe('EL-7011 US-34 BuildScheduleWithAiModal', () => {
  beforeEach(() => {
    mutationState = { error: undefined };
    answer({ draft: DRAFT, warnings: [] });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('follows the component rules: memo wrapper with a displayName', () => {
    expect(BuildScheduleWithAiModal.$$typeof).toBe(Symbol.for('react.memo'));
    expect(BuildScheduleWithAiModal.displayName).toBe('BuildScheduleWithAiModal');
  });

  it('R1.1 opens a popup with a prompt field', () => {
    setup();
    expect(screen.getByText('Build with AI')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-ai-prompt')).toBeInTheDocument();
  });

  it('R2.2 shows the drafted fields for an empty form and R2.4 fills the form on approve without a save', async () => {
    const { formik, onClose } = setup();
    generate('weekly report on Monday');
    expect(generateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 5,
        prompt: 'weekly report on Monday',
        timezone: expect.any(String),
      }),
    );
    expect(await screen.findByText('Weekly report')).toBeInTheDocument();
    expect(formik.setValues).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('schedule-ai-approve'));
    await waitFor(() => expect(formik.setValues).toHaveBeenCalledTimes(1));
    expect(formik.setValues.mock.calls[0][0]).toMatchObject({
      name: 'Weekly report',
      application_id: 'A1',
      prompt: 'Report on {{topic}}',
      variables: [{ name: 'topic', value: 'sales' }],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('R2.3 shows a warning next to the field it names', async () => {
    answer({ draft: DRAFT, warnings: [{ field: 'cron', reason: 'Cron was not valid' }] });
    setup();
    generate('x');
    expect(await screen.findByText('Cron was not valid')).toHaveAttribute('role', 'status');
  });

  it('R2.2 EL-7011 hides Type and Entity in the review of a locked entity', async () => {
    setup({}, { lockedEntity: { type: 'agent', id: 'A1' } });
    generate('x');
    expect(await screen.findByText('Weekly report')).toBeInTheDocument();
    expect(screen.queryByText('Entity')).not.toBeInTheDocument();
    expect(screen.queryByText('Type')).not.toBeInTheDocument();
  });

  it('R3.1 EL-7011 gives a filled form that is not dirty the edit flow', async () => {
    setup({ values: { ...VALUES, name: 'Old name' }, dirty: false });
    generate('rename it');
    expect(await screen.findByText('Old name')).toBeInTheDocument();
    expect(screen.getByText('Accept changes')).toBeInTheDocument();
  });

  it('R2.2 EL-7011 keeps the popup variant while it is open and after approve', async () => {
    const { rerenderWith } = setup();
    generate('x');
    await screen.findByText('Weekly report');
    rerenderWith({
      formik: { values: { ...VALUES, name: 'Weekly report' }, dirty: true, setValues: vi.fn() },
    });
    expect(screen.getByTestId('schedule-ai-approve')).toBeInTheDocument();
    expect(screen.queryByText('Accept changes')).not.toBeInTheDocument();
  });

  it('R3.1 shows current and drafted value of a changed field for a filled form, R3.2 applies on accept', async () => {
    const values = {
      ...VALUES,
      name: 'Old name',
      application_id: 'A1',
      version_id: 'V1',
      prompt: 'Report on {{topic}}',
    };
    const { formik } = setup({ values, dirty: true });
    generate('rename it');
    expect(await screen.findByText('Old name')).toBeInTheDocument();
    expect(screen.getByText('Weekly report')).toBeInTheDocument();
    expect(formik.setValues).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Accept changes'));
    await waitFor(() => expect(formik.setValues).toHaveBeenCalledTimes(1));
    expect(formik.setValues.mock.calls[0][0].name).toBe('Weekly report');
  });

  it('R3.3 leaves the form unchanged when the popup closes', async () => {
    const { formik, onClose } = setup({ dirty: true });
    fireEvent.click(screen.getByTestId('schedule-ai-cancel'));
    expect(onClose).toHaveBeenCalled();
    expect(formik.setValues).not.toHaveBeenCalled();
  });

  it('R3.1 tells the user when the draft changes no field', async () => {
    const values = {
      ...VALUES,
      ...DRAFT,
      type: 'agent',
      run_mode: null,
    };
    setup({ values, dirty: true });
    generate('same');
    expect(await screen.findByText(/no changes/i)).toBeInTheDocument();
  });

  it('R1.3 shows the server text of a 400 and leaves the form unchanged', async () => {
    mutationState.error = { status: 400, data: { error: 'Cron is wrong' } };
    const { formik } = setup();
    expect(screen.getByText('Cron is wrong')).toBeInTheDocument();
    expect(formik.setValues).not.toHaveBeenCalled();
  });

  it('R1.4 names the wait time of a 503', () => {
    mutationState.error = { status: 503, data: { error: 'busy', retry_after: 30 } };
    setup();
    expect(screen.getByText(/30 seconds/)).toBeInTheDocument();
  });
});
