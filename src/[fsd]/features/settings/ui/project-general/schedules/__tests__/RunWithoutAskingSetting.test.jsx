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
  personalProjectId: undefined,
  checked: [],
  toastError: vi.fn(),
}));
vi.mock('@/[fsd]/entities/schedule', async () => ({
  useIsScheduleAdmin: (await vi.importActual('@/[fsd]/entities/schedule/lib/hooks/useIsScheduleAdmin.hooks'))
    .useIsScheduleAdmin,
  useGetScheduleSettingsQuery: () => api.query,
  useUpdateScheduleSettingsMutation: () => [api.save, { isLoading: api.saving }],
}));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: api.personalProjectId } }),
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
const box = () => screen.getByRole('checkbox', { name: 'Run without approval' });

beforeEach(() => {
  vi.clearAllMocks();
  api.query = { data: { allow_run_without_asking: false }, isError: false };
  api.saving = false;
  api.isAdmin = true;
  api.personalProjectId = undefined;
  api.checked = [];
  api.save.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('Run without approval setting', () => {
  it('shows the hint and the saved value', () => {
    api.query = { data: { allow_run_without_asking: true }, isError: false };
    renderSetting();
    expect(box()).toBeChecked();
    expect(
      screen.getByText(/sensitive actions of schedules and webhooks without asking the owner/i),
    ).toBeInTheDocument();
    // The admin sees that the setting also covers webhook secrets
    expect(screen.getByText(/Treat it like a password/)).toBeInTheDocument();
  });

  it('checks the schedules admin permission', () => {
    renderSetting();
    expect(api.checked).toContain('models.applications.schedules.admin');
  });

  it('lets a project admin turn it on and sends the PUT value', async () => {
    renderSetting();
    expect(box()).toBeEnabled();
    await userEvent.click(box());
    expect(api.save).toHaveBeenCalledWith({ projectId: 2, allowRunWithoutAsking: true });
  });

  it('lets a project admin turn it off', async () => {
    api.query = { data: { allow_run_without_asking: true }, isError: false };
    renderSetting();
    await userEvent.click(box());
    expect(api.save).toHaveBeenCalledWith({ projectId: 2, allowRunWithoutAsking: false });
  });

  it('shows it disabled for a non-admin', () => {
    api.isAdmin = false;
    api.query = { data: { allow_run_without_asking: true }, isError: false };
    renderSetting();
    expect(box()).toBeDisabled();
    expect(box()).toBeChecked();
  });

  it('lets the owner of a personal project without the admin role turn it on', async () => {
    api.isAdmin = false;
    api.personalProjectId = 2;
    renderSetting();
    expect(box()).toBeEnabled();
    expect(
      screen.queryByText(/Only a project administrator can change this setting/),
    ).not.toBeInTheDocument();
    await userEvent.click(box());
    expect(api.save).toHaveBeenCalledWith({ projectId: 2, allowRunWithoutAsking: true });
  });

  it('keeps it disabled with the admin-only hint for a non-admin in a team project', () => {
    api.isAdmin = false;
    api.personalProjectId = 99;
    renderSetting();
    expect(box()).toBeDisabled();
    expect(screen.getByText(/Only a project administrator can change this setting/)).toBeInTheDocument();
  });

  it('shows no admin-only hint to a project admin', () => {
    renderSetting();
    expect(
      screen.queryByText(/Only a project administrator can change this setting/),
    ).not.toBeInTheDocument();
  });

  it('shows an error toast when the save fails', async () => {
    api.save.mockReturnValue({ unwrap: () => Promise.reject({ data: { error: 'boom' } }) });
    renderSetting();
    await userEvent.click(box());
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('boom'));
  });

  it('shows a default toast text when the error has no text', async () => {
    api.save.mockReturnValue({ unwrap: () => Promise.reject({}) });
    renderSetting();
    await userEvent.click(box());
    await waitFor(() =>
      expect(api.toastError).toHaveBeenCalledWith('Unable to update the Run without asking setting'),
    );
  });

  it('disables the checkbox and shows a load error', () => {
    api.query = { data: undefined, isError: true };
    renderSetting();
    expect(box()).toBeDisabled();
    expect(screen.getByText('Could not load the setting')).toBeInTheDocument();
  });

  it('blocks a second change while a save runs', () => {
    api.saving = true;
    renderSetting();
    expect(box()).toBeDisabled();
  });
});
