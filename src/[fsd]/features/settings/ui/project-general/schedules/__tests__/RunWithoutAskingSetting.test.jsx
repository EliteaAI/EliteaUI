// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RunWithoutAskingSetting from '../RunWithoutAskingSetting';

const api = vi.hoisted(() => ({
  query: { data: { allow_run_without_asking: false }, isError: false },
  save: vi.fn(),
  saving: false,
  isAdmin: true,
  checked: [],
  toastError: vi.fn(),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleSettingsQuery: () => api.query,
  useUpdateScheduleSettingsMutation: () => [api.save, { isLoading: api.saving }],
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission => {
      api.checked.push(permission);
      return api.isAdmin;
    },
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError }),
}));

const theme = createTheme({ palette: lightPalette });
const renderSetting = () =>
  render(
    <ThemeProvider theme={theme}>
      <RunWithoutAskingSetting />
    </ThemeProvider>,
  );
const box = () => screen.getByRole('checkbox', { name: 'Allow Run without asking' });

beforeEach(() => {
  vi.clearAllMocks();
  api.query = { data: { allow_run_without_asking: false }, isError: false };
  api.saving = false;
  api.isAdmin = true;
  api.checked = [];
  api.save.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('EL-7011 owner CR Allow Run without asking setting', () => {
  it('US-33 shows the hint and the saved value', () => {
    api.query = { data: { allow_run_without_asking: true }, isError: false };
    renderSetting();
    expect(box()).toBeChecked();
    expect(
      screen.getByText('Scheduled runs with this rule approve sensitive actions by themselves.'),
    ).toBeInTheDocument();
  });

  it('US-33 checks the schedules admin permission', () => {
    renderSetting();
    expect(api.checked).toContain('models.applications.schedules.admin');
  });

  it('US-33 lets a project admin turn it on and sends the PUT value', async () => {
    renderSetting();
    expect(box()).toBeEnabled();
    await userEvent.click(box());
    expect(api.save).toHaveBeenCalledWith({ projectId: 2, allowRunWithoutAsking: true });
  });

  it('US-33 lets a project admin turn it off', async () => {
    api.query = { data: { allow_run_without_asking: true }, isError: false };
    renderSetting();
    await userEvent.click(box());
    expect(api.save).toHaveBeenCalledWith({ projectId: 2, allowRunWithoutAsking: false });
  });

  it('US-33 shows it disabled with a note for a non-admin', async () => {
    api.isAdmin = false;
    api.query = { data: { allow_run_without_asking: true }, isError: false };
    renderSetting();
    expect(box()).toBeDisabled();
    expect(box()).toBeChecked();
    expect(screen.getByText('Only a project admin can change this setting.')).toBeInTheDocument();
    await userEvent.click(box());
    expect(api.save).not.toHaveBeenCalled();
  });

  it('US-33 hides the admin note for a project admin', () => {
    renderSetting();
    expect(screen.queryByText('Only a project admin can change this setting.')).not.toBeInTheDocument();
  });

  it('US-33 shows an error toast when the save fails', async () => {
    api.save.mockReturnValue({ unwrap: () => Promise.reject({ data: { error: 'boom' } }) });
    renderSetting();
    await userEvent.click(box());
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('boom'));
  });

  it('US-33 shows a default toast text when the error has no text', async () => {
    api.save.mockReturnValue({ unwrap: () => Promise.reject({}) });
    renderSetting();
    await userEvent.click(box());
    await waitFor(() =>
      expect(api.toastError).toHaveBeenCalledWith('Unable to update the Run without asking setting'),
    );
  });

  it('US-33 disables the checkbox and shows a load error', () => {
    api.query = { data: undefined, isError: true };
    renderSetting();
    expect(box()).toBeDisabled();
    expect(screen.getByText('Could not load the setting')).toBeInTheDocument();
  });

  it('US-33 blocks a second change while a save runs', () => {
    api.saving = true;
    renderSetting();
    expect(box()).toBeDisabled();
  });
});
