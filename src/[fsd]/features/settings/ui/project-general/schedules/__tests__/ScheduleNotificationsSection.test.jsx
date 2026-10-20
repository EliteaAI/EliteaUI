// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScheduleNotificationsSection from '../ScheduleNotificationsSection';

const api = vi.hoisted(() => ({
  query: { data: { get_notified: true }, isError: false },
  save: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock('@/[fsd]/features/settings/api', () => ({
  useGetSchedulePreferencesQuery: () => api.query,
  useUpdateSchedulePreferencesMutation: () => [api.save],
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError }),
}));

const theme = createTheme({ palette: lightPalette });
const renderSection = () =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleNotificationsSection />
    </ThemeProvider>,
  );
const box = () => screen.getByRole('checkbox', { name: 'Get notified' });

beforeEach(() => {
  vi.clearAllMocks();
  api.query = { data: { get_notified: true }, isError: false };
  api.save.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('EL-7011 US-39 Get notified section', () => {
  it('R1.3 shows the always-notify text', () => {
    renderSection();
    expect(screen.getByText(/failures, approvals/i)).toBeInTheDocument();
  });

  it('R2.1 shows the saved value unchecked', () => {
    api.query = { data: { get_notified: false }, isError: false };
    renderSection();
    expect(box()).not.toBeChecked();
  });

  it('R2.2 shows checked when the server returns true', () => {
    renderSection();
    expect(box()).toBeChecked();
  });

  it('R2.3 sends the new value at once', async () => {
    renderSection();
    await userEvent.click(box());
    expect(api.save).toHaveBeenCalledWith({ projectId: 2, getNotified: false });
  });

  it('R2.5 shows an error toast when the save fails', async () => {
    api.save.mockReturnValue({ unwrap: () => Promise.reject({ data: { error: 'boom' } }) });
    renderSection();
    await userEvent.click(box());
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('boom'));
  });

  it('R2.6 disables the checkbox and shows a load error', () => {
    api.query = { data: undefined, isError: true };
    renderSection();
    expect(box()).toBeDisabled();
    expect(screen.getByText('Could not load the setting')).toBeInTheDocument();
  });
});
