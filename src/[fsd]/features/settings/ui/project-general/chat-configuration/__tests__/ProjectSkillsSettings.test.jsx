// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ProjectSkillsSettings from '../ProjectSkillsSettings';

const api = vi.hoisted(() => ({
  current: undefined,
  platform: { available: true, project_default: false },
  create: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
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
}));
vi.mock('@/[fsd]/features/settings/api', () => ({
  useProjectSkillsPlatformSettingsQuery: () => ({ data: api.platform }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => api.permitted }) }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError, toastInfo: vi.fn() }),
}));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const renderSettings = () =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectSkillsSettings />
    </ThemeProvider>,
  );
const choiceSelect = () => screen.getByRole('combobox');
const projectSetting = () => screen.getByTestId('project-skills-project-setting');

beforeEach(() => {
  vi.clearAllMocks();
  api.current = undefined;
  api.platform = { available: true, project_default: false };
  api.permitted = true;
  api.refresh.mockReturnValue(undefined);
  api.create.mockReturnValue({ unwrap: () => Promise.resolve() });
  api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('project skills in chat setting', () => {
  it('renders as a card with the title, info icon and description', () => {
    renderSettings();
    expect(screen.getByText('Project skills in chat')).toBeInTheDocument();
    expect(
      screen.getByText('Let chats use every skill in this project, not only the skills added to the chat.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('project-skills-info-tooltip')).toBeInTheDocument();
  });

  it.each([
    [false, 'Use platform default (Disabled)'],
    [true, 'Use platform default (Enabled)'],
  ])('names the platform default in the default option (project_default=%s)', (projectDefault, label) => {
    api.platform = { available: true, project_default: projectDefault };
    renderSettings();
    expect(choiceSelect()).toHaveTextContent(label);
  });

  it('shows the saved project choice', () => {
    api.current = { id: 7, elitea_title: 'project_skills', data: { enabled: true } };
    renderSettings();
    expect(choiceSelect()).toHaveTextContent('Enabled');
    expect(projectSetting()).toHaveValue('true');
  });

  it('creates an explicit project opt-in and re-reads the setting', async () => {
    renderSettings();
    await userEvent.click(choiceSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Enabled', exact: true }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        projectId: 2,
        body: {
          elitea_title: 'project_skills',
          label: 'Project skills in chat',
          type: 'project_skills',
          shared: false,
          data: { enabled: true },
        },
      }),
    );
    expect(api.refresh).toHaveBeenCalled();
    expect(api.update).not.toHaveBeenCalled();
  });

  it('updates an existing choice back to the platform default', async () => {
    api.current = { id: 7, elitea_title: 'project_skills', data: { enabled: false } };
    renderSettings();
    await userEvent.click(choiceSelect());
    await userEvent.click(screen.getByRole('option', { name: /Use platform default/ }));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith({
        projectId: 2,
        configId: 7,
        body: expect.objectContaining({ data: { enabled: null } }),
      }),
    );
    expect(api.create).not.toHaveBeenCalled();
  });

  it('stays locked until the saved setting is re-read', async () => {
    let settingsReread;
    api.refresh.mockReturnValue(new Promise(resolve => (settingsReread = resolve)));
    renderSettings();
    await userEvent.click(choiceSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Disabled', exact: true }));
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    expect(projectSetting()).toBeDisabled();
    settingsReread();
    await waitFor(() => expect(projectSetting()).not.toBeDisabled());
  });

  it('reports a failed save', async () => {
    api.create.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: 'managed by project admins' } }),
    });
    renderSettings();
    await userEvent.click(choiceSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Enabled', exact: true }));
    await waitFor(() => expect(api.toastError).toHaveBeenCalledWith('managed by project admins'));
  });

  it('is locked without update permission', () => {
    api.permitted = false;
    renderSettings();
    expect(projectSetting()).toBeDisabled();
  });

  it('is locked with a hint while platform administrators keep the feature off', () => {
    api.platform = { available: false, project_default: true };
    api.current = { id: 7, elitea_title: 'project_skills', data: { enabled: true } };
    renderSettings();
    expect(projectSetting()).toBeDisabled();
    expect(screen.getByTestId('project-skills-platform-off-hint')).toHaveTextContent(
      'Turned off for the whole environment by platform administrators.',
    );
    expect(screen.queryByTestId('project-skills-disabled-hint')).not.toBeInTheDocument();
  });

  it.each([
    ['the platform default is off and the project has no choice', undefined, false, true],
    ['the project turned it off', { enabled: false }, true, true],
    ['the platform default is on', undefined, true, false],
    ['the project turned it on', { enabled: true }, false, false],
  ])(
    'shows the disabled hint only when it is off for this project: %s',
    (_case, data, projectDefault, hinted) => {
      api.platform = { available: true, project_default: projectDefault };
      api.current = data ? { id: 7, elitea_title: 'project_skills', data } : undefined;
      renderSettings();
      expect(screen.queryByTestId('project-skills-disabled-hint') !== null).toBe(hinted);
      expect(screen.queryByTestId('project-skills-platform-off-hint')).not.toBeInTheDocument();
    },
  );
});
