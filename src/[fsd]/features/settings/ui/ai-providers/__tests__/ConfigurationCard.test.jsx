// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ConfigurationCard from '../ConfigurationCard';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));
vi.mock('@/[fsd]/features/settings/lib/hooks', () => ({
  useConfigurationNavigation: () => ({ navigateToConfiguration: vi.fn() }),
}));
vi.mock('../ConfigurationIcon', () => ({ default: () => null }));

const theme = createTheme({ palette: lightPalette });

const configurationOf = overrides => ({
  id: 5,
  project_id: 1,
  section: 'llm',
  type: 'llm_model',
  label: 'GPT-5.6-Luna',
  status_ok: true,
  shared: false,
  data: { name: 'gpt-5.6-luna' },
  ...overrides,
});

const renderCard = configuration =>
  render(
    <ThemeProvider theme={theme}>
      <ConfigurationCard
        configuration={configuration}
        canEdit
        isDefault
        isHighTier
      />
    </ThemeProvider>,
  );

afterEach(cleanup);

describe('ConfigurationCard', () => {
  it('shows an LLM model description under its name and keeps the status and badges', () => {
    renderCard(configurationOf({ data: { name: 'gpt-5.6-luna', description: 'Fast for everyday tasks' } }));

    expect(screen.getByTestId('ai-provider-configuration-card-description')).toHaveTextContent(
      'Fast for everyday tasks',
    );
    expect(screen.getAllByTestId('ai-provider-configuration-badge').map(badge => badge.textContent)).toEqual([
      'High-Tier',
      'Default',
    ]);
  });

  it('shows no description line for an LLM model without one', () => {
    renderCard(configurationOf());
    expect(screen.queryByTestId('ai-provider-configuration-card-description')).not.toBeInTheDocument();
  });

  it('ignores a description key on configurations outside the LLM section', () => {
    renderCard(
      configurationOf({ section: 'ai_credentials', type: 'open_ai', data: { description: 'Team key' } }),
    );
    expect(screen.queryByTestId('ai-provider-configuration-card-description')).not.toBeInTheDocument();
  });
});
