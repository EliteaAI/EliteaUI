// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SectionAddMenu from '../SectionAddMenu';

const fixture = vi.hoisted(() => ({
  actions: {},
}));

vi.mock('@/[fsd]/widgets/section-page/lib/hooks', () => ({
  useSectionAddActions: () => fixture.actions,
}));
vi.mock('@/[fsd]/features/agent/ui/generate-agent-modal', () => ({ GenerateAgentModal: () => null }));
vi.mock('@/[fsd]/features/skill/ui/generate-skill-modal', () => ({ GenerateSkillModal: () => null }));
vi.mock('@/[fsd]/features/skill/ui/import/SkillImportModal', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const renderAdd = (sectionKey, actions = {}) => {
  fixture.actions = {
    canCreate: true,
    canImport: true,
    canBuildWithAi: true,
    onNew: vi.fn(),
    onImport: vi.fn(),
    onBuildWithAi: vi.fn(),
    isBuildWithAiOpen: false,
    onCloseBuildWithAi: vi.fn(),
    skillImport: {},
    ...actions,
  };
  return render(
    <ThemeProvider theme={theme}>
      <SectionAddMenu sectionKey={sectionKey} />
    </ThemeProvider>,
  );
};

describe('SectionAddMenu', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it.each([
    ['toolkits', 'Add toolkit'],
    ['mcps', 'Add MCP'],
    ['credentials', 'Add credential'],
    ['applications', 'Add application'],
  ])('opens the %s create flow at once, without a menu', (sectionKey, label) => {
    renderAdd(sectionKey);
    const button = screen.getByTestId(`${sectionKey}-add-button`);
    expect(button).toHaveAttribute('aria-label', label);
    expect(button).not.toHaveAttribute('aria-haspopup');
    fireEvent.click(button);
    expect(fixture.actions.onNew).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('hides the direct button without the create permission', () => {
    renderAdd('toolkits', { canCreate: false });
    expect(screen.queryByTestId('toolkits-add-button')).not.toBeInTheDocument();
  });

  it('keeps the menu on Agents', () => {
    renderAdd('agents');
    const button = screen.getByTestId('agents-add-button');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    fireEvent.click(button);
    expect(fixture.actions.onNew).not.toHaveBeenCalled();
    expect(screen.getByTestId('agents-add-new')).toBeInTheDocument();
    expect(screen.getByTestId('agents-import-button')).toBeInTheDocument();
    expect(screen.getByTestId('agents-build-with-ai')).toBeInTheDocument();
  });
});
