// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import WebhookRunCapSetting from '../WebhookRunCapSetting';

const SETTINGS = {
  allow_run_without_asking: true,
  webhook_max_concurrent_runs: null,
  webhook_max_concurrent_runs_default: 3,
  webhook_max_concurrent_runs_limit: 20,
};

const api = vi.hoisted(() => ({
  query: null,
  save: vi.fn(),
  isAdmin: true,
  saving: false,
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleSettingsQuery: () => api.query,
  useUpdateScheduleSettingsMutation: () => [api.save, { isLoading: api.saving }],
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => api.isAdmin }) }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError, toastSuccess: api.toastSuccess }),
}));

const theme = createTheme({ palette: lightPalette });
const renderSetting = () =>
  render(
    <ThemeProvider theme={theme}>
      <WebhookRunCapSetting />
    </ThemeProvider>,
  );
const input = () => screen.getByTestId('schedule-webhook-run-cap-input');
const setBadInput = badInput =>
  Object.defineProperty(input(), 'validity', { configurable: true, value: { badInput } });
const enter = value => {
  fireEvent.change(input(), { target: { value } });
  fireEvent.blur(input());
};

beforeEach(() => {
  vi.clearAllMocks();
  api.query = { data: { ...SETTINGS }, isError: false };
  api.isAdmin = true;
  api.saving = false;
  api.save.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('Running runs per webhook setting', () => {
  it('shows the platform maximum and default as the hint', () => {
    renderSetting();
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('Platform maximum: 20');
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('default (3)');
    expect(input()).toHaveValue(null);
  });

  it('saves a lower value and sends only the cap', async () => {
    renderSetting();
    enter('2');
    await waitFor(() =>
      // only the cap: a save here must not resend the approval switch
      expect(api.save).toHaveBeenCalledWith({ projectId: 2, webhookMaxConcurrentRuns: 2 }),
    );
  });

  it('refuses a value above the platform maximum without calling the API', () => {
    renderSetting();
    enter('25');
    expect(api.save).not.toHaveBeenCalled();
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('from 1 to 20');
  });

  it('clears the value back to the default with an empty field', async () => {
    api.query = { data: { ...SETTINGS, webhook_max_concurrent_runs: 2 }, isError: false };
    renderSetting();
    enter('');
    await waitFor(() => expect(api.save.mock.calls[0][0].webhookMaxConcurrentRuns).toBeNull());
  });

  it('shows the server 400 text on the field', async () => {
    api.save.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 400, data: { error: 'Running runs per webhook can be at most 5' } }),
    });
    renderSetting();
    enter('7');
    await waitFor(() =>
      expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('can be at most 5'),
    );
    expect(input()).toHaveValue(7); // the refused value stays, so it can be corrected
  });

  it('puts the saved value back after a store error', async () => {
    api.query = { data: { ...SETTINGS, webhook_max_concurrent_runs: 2 }, isError: false };
    api.save.mockReturnValue({
      unwrap: () => Promise.reject({ status: 503, data: { error: 'store down' } }),
    });
    renderSetting();
    enter('4');
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('store down'));
    expect(input()).toHaveValue(2);
  });

  it('does not save again while a save is in flight', () => {
    api.saving = true;
    renderSetting();
    enter('2');
    expect(api.save).not.toHaveBeenCalled();
  });

  it('is read-only for a member who is not a schedules admin', () => {
    api.isAdmin = false;
    renderSetting();
    expect(input()).toBeDisabled();
  });

  // #7400 review: InputBase blurs 10 ms after each change unless told not to, which saved on the first keystroke
  it('does not save while typing, only when the field is left', async () => {
    vi.useFakeTimers();
    try {
      renderSetting();
      input().focus();
      fireEvent.change(input(), { target: { value: '1' } });
      vi.advanceTimersByTime(50);
      fireEvent.change(input(), { target: { value: '12' } });
      vi.advanceTimersByTime(50);
      expect(api.save).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
    fireEvent.blur(input());
    await waitFor(() => expect(api.save).toHaveBeenCalledTimes(1));
    expect(api.save.mock.calls[0][0].webhookMaxConcurrentRuns).toBe(12);
  });

  // #7400 review: a number input reports an unparsable entry such as `2e` as an empty value
  it('refuses an unparsable entry instead of resetting the cap to the default', () => {
    api.query = { data: { ...SETTINGS, webhook_max_concurrent_runs: 2 }, isError: false };
    renderSetting();
    setBadInput(true);
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.blur(input());
    expect(api.save).not.toHaveBeenCalled();
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('Enter a whole number');
  });

  // React fires no onChange while the value stays '', so only the blur can see the current validity
  it('refuses a bad entry typed into a field that is already empty', () => {
    api.query = { data: { ...SETTINGS, webhook_max_concurrent_runs: 2 }, isError: false };
    renderSetting();
    fireEvent.change(input(), { target: { value: '' } });
    setBadInput(true);
    fireEvent.input(input(), { target: { value: '' } });
    fireEvent.blur(input());
    expect(api.save).not.toHaveBeenCalled();
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('Enter a whole number');
  });

  it('treats the field as empty once the bad entry is deleted, and clears its error', async () => {
    api.query = { data: { ...SETTINGS, webhook_max_concurrent_runs: 2 }, isError: false };
    renderSetting();
    setBadInput(true);
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.blur(input());
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('Enter a whole number');
    setBadInput(false);
    fireEvent.input(input(), { target: { value: '' } });
    fireEvent.blur(input());
    await waitFor(() => expect(api.save.mock.calls[0][0].webhookMaxConcurrentRuns).toBeNull());
    expect(screen.getByTestId('schedule-webhook-run-cap-help')).toHaveTextContent('Platform maximum: 20');
  });
});
