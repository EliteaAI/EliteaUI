// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AutoRoutingSettings from '../AutoRoutingSettings';

const api = vi.hoisted(() => ({
  current: undefined,
  create: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
  refetch: vi.fn(),
  permitted: true,
  toastError: vi.fn(),
}));
vi.mock('@/api/configurations', async importOriginal => ({
  ...(await importOriginal()),
  useCreateConfigurationMutation: () => [api.create, {}],
  useUpdateConfigurationMutation: () => [api.update, {}],
  useGetConfigurationsListQuery: () => ({
    data: { items: api.current ? [api.current] : [] },
    refetch: api.refresh,
  }),
  useListModelsQuery: () => ({ data: { auto_routing: { enabled: true } }, refetch: api.refetch }),
}));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => api.permitted }) }));
vi.mock('@/hooks/useToast', () => ({ default: () => ({ toastError: api.toastError, toastInfo: vi.fn() }) }));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const renderSettings = () =>
  render(
    <ThemeProvider theme={theme}>
      <AutoRoutingSettings />
    </ThemeProvider>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  api.current = undefined;
  api.permitted = true;
  api.create.mockReturnValue({ unwrap: () => Promise.resolve() });
  api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('project Auto permission and configuration', () => {
  it('creates an explicit project opt-in and refreshes availability', async () => {
    renderSettings();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Enabled', exact: true }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        projectId: 2,
        body: expect.objectContaining({ data: { enabled: true } }),
      }),
    );
    expect(api.refresh).toHaveBeenCalled();
    expect(api.refetch).toHaveBeenCalled();
  });
  it('updates an existing configuration to use platform default', async () => {
    api.current = { id: 12, elitea_title: 'auto_routing', data: { enabled: false } };
    renderSettings();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Use platform default' }));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith({
        projectId: 2,
        configId: 12,
        body: expect.objectContaining({ data: { enabled: null } }),
      }),
    );
    expect(api.create).not.toHaveBeenCalled();
  });
  it('disables configuration without update permission', () => {
    api.permitted = false;
    renderSettings();
    expect(screen.getByTestId('auto-routing-project-setting')).toBeDisabled();
  });
});
