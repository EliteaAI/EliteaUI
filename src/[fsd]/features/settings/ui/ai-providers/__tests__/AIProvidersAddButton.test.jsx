// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { PERMISSIONS } from '@/common/constants';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AIProvidersContent from '../AIProvidersContent';

const fixture = vi.hoisted(() => ({
  permissions: [],
  restricted: false,
  navigateToCreateConfiguration: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useLocation: () => ({ state: null }) }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => fixture.permissions.includes(permission) }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 5,
  useIsOwnLLMsRestricted: () => fixture.restricted,
}));
vi.mock('@/api/configurations.js', async importOriginal => ({
  ...(await importOriginal()),
  useListModelsQuery: () => ({}),
  useSetProjectDefaultModelMutation: () => [vi.fn()],
}));
vi.mock('@/[fsd]/features/settings/lib/hooks', () => ({
  useConfigurationNavigation: () => ({
    navigateToCreateConfiguration: fixture.navigateToCreateConfiguration,
  }),
  useMultiSectionConfigurations: () => ({ data: [], isLoading: false }),
  useModelOptions: () => ({ uniqueConfigurations: [], modelOptions: [] }),
  useModelConfiguration: () => ({ model: {} }),
}));
vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  ModelConfigurationHelpers: {
    getConfigurationOptions: () => [],
    getModelCapabilities: () => ({}),
  },
}));
vi.mock('../ConfigurationsPanel', () => ({ default: () => null }));
vi.mock('../ModelCapabilitiesSection', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const renderPage = ({ permissions = [PERMISSIONS.configuration.update], restricted = false } = {}) => {
  Object.assign(fixture, { permissions, restricted });
  render(
    <ThemeProvider theme={theme}>
      <AIProvidersContent />
    </ThemeProvider>,
  );
};

describe('AI Providers "+" button', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('opens the create AI provider page', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ai-providers-add-button'));
    expect(fixture.navigateToCreateConfiguration).toHaveBeenCalledTimes(1);
  });

  it('is hidden without the permission to manage AI providers', () => {
    renderPage({ permissions: [] });
    expect(screen.queryByTestId('ai-providers-add-button')).toBeNull();
  });

  it('is disabled while own LLMs are restricted', () => {
    renderPage({ restricted: true });
    expect(screen.getByTestId('ai-providers-add-button')).toBeDisabled();
  });
});
