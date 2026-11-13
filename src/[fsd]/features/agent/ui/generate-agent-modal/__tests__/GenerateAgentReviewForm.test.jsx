// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import GenerateAgentReviewForm from '../GenerateAgentReviewForm';

vi.mock('@/[fsd]/features/agent/lib/hooks', () =>
  vi.importActual('@/[fsd]/features/agent/lib/hooks/useConversationStartersAddGate.hooks'),
);
vi.mock('@/[fsd]/features/agent/lib/hooks/useConversationStartersLimit.hooks', () => ({
  useConversationStartersLimit: () => 4,
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));

const theme = createTheme(getDesignTokens('dark'));
const noop = () => {};
const toast = {
  toastHandlers: { toastError: noop, toastSuccess: noop, toastInfo: noop, toastWarning: noop },
  clearToast: noop,
  setTopPosition: noop,
  setIcon: noop,
  setOnCloseToast: noop,
};

const items = (count, extra = {}) =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `item-${i + 1}`, ...extra }));

const renderForm = draft =>
  render(
    <ThemeProvider theme={theme}>
      <ToastContext.Provider value={toast}>
        <GenerateAgentReviewForm
          draft={{ name: 'Agent', description: 'Does things', instructions: 'Do things', ...draft }}
          onChange={noop}
          selectedToolkitIds={new Set()}
          onToggleToolkit={noop}
          selectedAgentIds={new Set()}
          onToggleAgent={noop}
          selectedMcpIds={new Set()}
          onToggleMcp={noop}
          selectedPipelineIds={new Set()}
          onTogglePipeline={noop}
          selectedSkillIds={new Set()}
          onToggleSkill={noop}
        />
      </ToastContext.Provider>
    </ThemeProvider>,
  );

const renderedIds = entityType =>
  screen
    .queryAllByTestId(new RegExp(`^generate-agent-resource-item-${entityType}-`))
    .map(node => Number(node.dataset.testid.split('-').pop()));

describe('GenerateAgentReviewForm suggestion caps (#7388)', () => {
  afterEach(cleanup);

  it('shows every suggested skill the server returns', () => {
    renderForm({ suggested_skills: items(7) });
    expect(renderedIds('skill')).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps the other categories capped at five', () => {
    renderForm({
      suggested_toolkits: items(7, { type: 'github' }),
      suggested_mcp: items(7, { type: 'mcp' }),
      suggested_agents: items(7, { type: 'agent' }),
      suggested_pipelines: items(7, { type: 'pipeline' }),
    });
    ['toolkit', 'mcp', 'agent', 'pipeline'].forEach(entityType =>
      expect(renderedIds(entityType)).toEqual([1, 2, 3, 4, 5]),
    );
  });
});
