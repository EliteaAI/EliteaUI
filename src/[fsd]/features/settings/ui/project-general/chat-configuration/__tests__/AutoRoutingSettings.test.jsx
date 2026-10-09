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
  autoEnabled: true,
  readiness: undefined,
  items: [],
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
  useListModelsQuery: () => ({
    data: { items: api.items, auto_routing: { enabled: api.autoEnabled, readiness: api.readiness } },
    refetch: api.refetch,
  }),
}));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => api.permitted }) }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: api.toastError, toastInfo: vi.fn() }),
}));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const theme = createTheme({ palette: lightPalette });
const renderSettings = () =>
  render(
    <ThemeProvider theme={theme}>
      <AutoRoutingSettings />
    </ThemeProvider>,
  );
const enableSelect = () => screen.getAllByRole('combobox')[0];
const classifierSelect = () => screen.getByTestId('auto-routing-classifier-combobox');
const chat = (name, extra = {}) => ({ name, project_id: 2, display_name: name, ...extra });
const optionLabels = () => screen.getAllByRole('option').map(o => o.textContent);
beforeEach(() => {
  vi.clearAllMocks();
  api.current = undefined;
  api.permitted = true;
  api.autoEnabled = true;
  api.readiness = undefined;
  api.items = [];
  api.create.mockReturnValue({ unwrap: () => Promise.resolve() });
  api.update.mockReturnValue({ unwrap: () => Promise.resolve() });
});
afterEach(cleanup);

describe('project Auto permission and configuration', () => {
  it('renders as a card with the title, info icon and description', () => {
    renderSettings();
    expect(screen.getByText('Auto model selection')).toBeInTheDocument();
    expect(screen.getByText('Allow Auto model selection in chats and standard agents.')).toBeInTheDocument();
    expect(screen.getByTestId('auto-routing-info-tooltip')).toBeInTheDocument();
    expect(screen.queryByTestId('auto-routing-disabled-hint')).not.toBeInTheDocument();
  });
  it('shows a hint when Auto is disabled by project or platform settings', () => {
    api.autoEnabled = false;
    renderSettings();
    expect(screen.getByTestId('auto-routing-disabled-hint')).toHaveTextContent(
      'Currently disabled by project or platform settings.',
    );
  });
  it('creates an explicit project opt-in and refreshes availability', async () => {
    renderSettings();
    await userEvent.click(enableSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Enabled', exact: true }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        projectId: 2,
        body: expect.objectContaining({ data: { enabled: true, classifier: null } }),
      }),
    );
    expect(api.refresh).toHaveBeenCalled();
    expect(api.refetch).toHaveBeenCalled();
  });
  it('updates an existing configuration to use platform default', async () => {
    api.current = { id: 12, elitea_title: 'auto_routing', data: { enabled: false } };
    renderSettings();
    await userEvent.click(enableSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Use platform default' }));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith({
        projectId: 2,
        configId: 12,
        body: expect.objectContaining({ data: { enabled: null, classifier: null } }),
      }),
    );
    expect(api.create).not.toHaveBeenCalled();
  });
  it('disables configuration without update permission', () => {
    api.permitted = false;
    renderSettings();
    expect(screen.getByTestId('auto-routing-project-setting')).toBeDisabled();
  });

  describe('classifier', () => {
    beforeEach(() => {
      api.items = [
        chat('claude-haiku', { low_tier: true, description: 'fast' }),
        chat('gpt-luna-2026-07-09', {
          display_name: 'GPT Luna',
          identity: { low_tier_hint: true, kind: 'chat' },
        }),
        chat('gpt-big', { identity: { low_tier_hint: false, kind: 'chat' } }),
        chat('embed-small', { low_tier: true, identity: { low_tier_hint: true, kind: 'embedding' } }),
      ];
    });

    it('lists the platform default and only low-tier chat models', async () => {
      renderSettings();
      await userEvent.click(classifierSelect());
      expect(optionLabels()).toEqual(
        ['Use platform default', 'claude-haiku', 'GPT Luna'].map(label => expect.stringContaining(label)),
      );
      expect(screen.getByRole('option', { name: /GPT Luna/ })).toHaveTextContent('gpt-luna-2026-07-09');
      expect(screen.queryByRole('option', { name: /gpt-big/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /embed-small/ })).not.toBeInTheDocument();
      expect(
        screen.queryByText('No low-tier models are flagged; showing all models.'),
      ).not.toBeInTheDocument();
    });

    it('falls back to all chat models with a hint when none is low-tier', async () => {
      api.items = [
        chat('gpt-big'),
        chat('claude-opus', { identity: { kind: 'chat' } }),
        chat('img', { identity: { kind: 'image' } }),
      ];
      renderSettings();
      expect(screen.getByText('No low-tier models are flagged; showing all models.')).toBeInTheDocument();
      await userEvent.click(classifierSelect());
      expect(optionLabels()).toEqual(
        ['Use platform default', 'gpt-big', 'claude-opus'].map(label => expect.stringContaining(label)),
      );
    });

    it('shows the platform classifier name in the default option', async () => {
      api.readiness = {
        ready: true,
        classifier: { name: 'claude-haiku', display_name: 'Claude Haiku 4.5', source: 'platform' },
      };
      renderSettings();
      expect(classifierSelect()).toHaveTextContent('Use platform default (Claude Haiku 4.5)');
    });

    it('prefers platform_classifier for the default label, even when the project overrides it', () => {
      api.readiness = {
        ready: true,
        platform_classifier: { name: 'claude-haiku', project_id: 1, display_name: 'Claude Haiku 4.5' },
        classifier: { name: 'gpt-luna', display_name: 'GPT Luna', source: 'project' },
      };
      renderSettings();
      expect(classifierSelect()).toHaveTextContent('Use platform default (Claude Haiku 4.5)');
    });

    it('saves the classifier together with the current enabled value', async () => {
      api.current = { id: 12, elitea_title: 'auto_routing', data: { enabled: true } };
      renderSettings();
      await userEvent.click(classifierSelect());
      await userEvent.click(screen.getByRole('option', { name: /GPT Luna/ }));
      await waitFor(() =>
        expect(api.update).toHaveBeenCalledWith({
          projectId: 2,
          configId: 12,
          body: expect.objectContaining({
            data: { enabled: true, classifier: { name: 'gpt-luna-2026-07-09', project_id: 2 } },
          }),
        }),
      );
      expect(api.refetch).toHaveBeenCalled();
    });

    it('keeps the classifier when enabled changes and clears it with the platform default', async () => {
      api.current = {
        id: 12,
        elitea_title: 'auto_routing',
        data: { enabled: true, classifier: { name: 'claude-haiku', project_id: 2 } },
      };
      renderSettings();
      await userEvent.click(enableSelect());
      await userEvent.click(screen.getByRole('option', { name: 'Disabled' }));
      await waitFor(() =>
        expect(api.update).toHaveBeenLastCalledWith({
          projectId: 2,
          configId: 12,
          body: expect.objectContaining({
            data: { enabled: false, classifier: { name: 'claude-haiku', project_id: 2 } },
          }),
        }),
      );
      await userEvent.click(classifierSelect());
      await userEvent.click(screen.getByRole('option', { name: /Use platform default/ }));
      await waitFor(() =>
        expect(api.update).toHaveBeenLastCalledWith({
          projectId: 2,
          configId: 12,
          body: expect.objectContaining({ data: { enabled: true, classifier: null } }),
        }),
      );
    });

    it('shows a configured classifier that is no longer available', () => {
      api.current = {
        id: 12,
        elitea_title: 'auto_routing',
        data: { enabled: true, classifier: { name: 'gone-model', project_id: 2 } },
      };
      renderSettings();
      expect(classifierSelect()).toHaveTextContent('gone-model (unavailable)');
    });

    it('keeps a configured classifier that is available but not low-tier', () => {
      api.current = {
        id: 12,
        elitea_title: 'auto_routing',
        data: { enabled: true, classifier: { name: 'gpt-big', project_id: 2 } },
      };
      renderSettings();
      expect(classifierSelect()).toHaveTextContent('gpt-big');
      expect(classifierSelect()).not.toHaveTextContent('unavailable');
    });

    it('disables the classifier without update permission', () => {
      api.permitted = false;
      renderSettings();
      expect(screen.getByTestId('auto-routing-classifier')).toHaveClass('Mui-disabled');
    });
  });

  describe('readiness warning', () => {
    const notReady = {
      ready: false,
      reasons: [
        { code: 'CLASSIFIER_UNAVAILABLE', message: 'Classifier model gpt-luna is no longer available' },
      ],
    };
    it('shows an inline warning when Auto is enabled but not ready', () => {
      api.readiness = notReady;
      renderSettings();
      expect(screen.getByTestId('auto-routing-not-ready')).toHaveTextContent(
        'Auto model selection is enabled but not ready: Classifier model gpt-luna is no longer available. Select a replacement classifier.',
      );
    });
    it('shows no warning when ready, when readiness is absent, or when Auto is disabled', () => {
      for (const [enabled, readiness] of [
        [true, { ready: true, reasons: [] }],
        [true, undefined],
        [false, notReady],
      ]) {
        api.autoEnabled = enabled;
        api.readiness = readiness;
        const { unmount } = renderSettings();
        expect(screen.queryByTestId('auto-routing-not-ready')).not.toBeInTheDocument();
        unmount();
      }
    });
  });
});
