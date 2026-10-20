// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PlusChatButton from '../PlusChatButton';

const emptySubmenu = vi.hoisted(() => ({
  items: [],
  isLoading: false,
  searchValue: '',
  onSearchChange: () => {},
  onScroll: () => {},
  resetSearch: () => {},
}));

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { personal_project_id: 1 } }) }));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useApplicationSubmenu: () => ({
    agents: emptySubmenu,
    pipelines: emptySubmenu,
    skills: emptySubmenu,
    toolkits: emptySubmenu,
    mcps: emptySubmenu,
  }),
}));
vi.mock('@/[fsd]/features/toolkits', () => ({ useAvailableInternalTools: () => [] }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsMcpVisible: () => false,
  useSelectedProjectId: () => 2,
}));
vi.mock('../AttachmentButton', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const openSkillsSubmenu = onCreateSkill => {
  render(
    <ThemeProvider theme={theme}>
      <PlusChatButton onCreateSkill={onCreateSkill} />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByTestId('plus-menu-button'));
  fireEvent.mouseEnter(screen.getByTestId('skills-menuitem'));
};

describe('PlusChatButton skills submenu', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('offers Create Skill and hands off to the skill creator', () => {
    const onCreateSkill = vi.fn();
    openSkillsSubmenu(onCreateSkill);

    const createButton = screen.getByTestId('skills-create-new-button');
    expect(createButton).toHaveTextContent('Create Skill');

    fireEvent.click(createButton);

    expect(onCreateSkill).toHaveBeenCalledTimes(1);
  });

  it('hides Create Skill where the chat cannot create one', () => {
    openSkillsSubmenu(undefined);

    expect(screen.queryByTestId('skills-create-new-button')).toBeNull();
  });
});
