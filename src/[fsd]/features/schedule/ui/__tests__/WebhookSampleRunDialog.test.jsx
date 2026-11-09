// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import WebhookSampleRunDialog from '../WebhookSampleRunDialog';

// #7456: the owner runs a saved webhook with a pasted body; the body is never kept in the browser

const mocks = vi.hoisted(() => ({
  runSchedule: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
}));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useRunScheduleMutation: () => [mocks.runSchedule, { isLoading: false }],
}));

const theme = createTheme(getDesignTokens('light'));
const WEBHOOK = { id: 19, name: 'On issue', trigger_kind: 'webhook', webhook_type: 'custom' };

const renderDialog = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <WebhookSampleRunDialog
        open
        webhook={WEBHOOK}
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const typeBody = text =>
  fireEvent.change(screen.getByTestId('webhook-sample-body'), { target: { value: text } });
const confirm = () => fireEvent.click(screen.getByTestId('webhook-sample-run-confirm'));

describe('WebhookSampleRunDialog', () => {
  let setItem;
  let sessionSetItem;

  beforeEach(() => {
    mocks.runSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    setItem = vi.spyOn(Storage.prototype, 'setItem');
    sessionSetItem = vi.spyOn(window.sessionStorage, 'setItem');
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('shows the confirm line', () => {
    renderDialog();
    expect(
      screen.getByText('This runs the real agent or pipeline as you, with its tools.'),
    ).toBeInTheDocument();
  });

  it('sends the body as payload with the test trigger and stores nothing', async () => {
    const onClose = vi.fn();
    const onStarted = vi.fn();
    renderDialog({ onClose, onStarted });
    typeBody('{"action":"opened"}');
    confirm();

    await waitFor(() =>
      expect(mocks.runSchedule).toHaveBeenCalledWith({
        projectId: 5,
        scheduleId: 19,
        trigger: 'test',
        payload: '{"action":"opened"}',
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onStarted).toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(sessionSetItem).not.toHaveBeenCalled();
  });

  it('warns on a body that is not JSON but still runs it', async () => {
    renderDialog();
    typeBody('plain text body');
    expect(screen.getByText(/Not valid JSON/)).toBeInTheDocument();
    confirm();
    await waitFor(() =>
      expect(mocks.runSchedule).toHaveBeenCalledWith(expect.objectContaining({ payload: 'plain text body' })),
    );
  });

  it('refuses an empty body without calling the API', () => {
    renderDialog();
    confirm();
    expect(screen.getByRole('alert')).toHaveTextContent('Paste a sample body');
    expect(mocks.runSchedule).not.toHaveBeenCalled();
  });

  it('refuses a body over 512 KB', () => {
    renderDialog();
    typeBody('x'.repeat(512 * 1024 + 1));
    expect(screen.getByText('The body is over 512 KB.')).toBeInTheDocument();
    confirm();
    expect(mocks.runSchedule).not.toHaveBeenCalled();
  });

  it('keeps the dialog open with the server text on 409 run_active', async () => {
    const onClose = vi.fn();
    mocks.runSchedule.mockReturnValue({
      unwrap: () => Promise.reject({ status: 409, data: { error: 'A sample run is already active' } }),
    });
    renderDialog({ onClose });
    typeBody('{}');
    confirm();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('A sample run is already active'),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
