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

const mocks = vi.hoisted(() => ({ isMcpVisible: false, tools: [], projectId: 2 }));

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
vi.mock('@/[fsd]/features/toolkits', () => ({ useAvailableInternalTools: () => mocks.tools }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsMcpVisible: () => mocks.isMcpVisible,
  useSelectedProjectId: () => mocks.projectId,
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('../AttachmentButton', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const openSkillsSubmenu = onCreateSkill => {
  render(
    <ThemeProvider theme={theme}>
      <PlusChatButton onCreateSkill={onCreateSkill} />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByTestId('plus-menu-button'));
  fireEvent.click(screen.getByTestId('skills-menuitem'));
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

  it('closes the menu on Escape while focus is outside it', () => {
    openSkillsSubmenu(vi.fn());

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(screen.queryByTestId('skills-menuitem')).toBeNull();
    expect(screen.queryByTestId('skills-submenu')).toBeNull();
  });
});

const renderMenu = (props = {}) => {
  render(
    <ThemeProvider theme={theme}>
      <PlusChatButton {...props} />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByTestId('plus-menu-button'));
};

const participants = [
  { entity_name: 'user' },
  { entity_name: 'application', entity_settings: { agent_type: 'openai' } },
  { entity_name: 'application', entity_settings: { agent_type: 'react' } },
  { entity_name: 'application', entity_settings: { agent_type: 'pipeline' } },
  { entity_name: 'toolkit', entity_settings: { toolkit_type: 'mcp' } },
];

describe('PlusChatButton rows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMcpVisible = true;
    mocks.tools = [];
    mocks.projectId = 2;
  });
  afterEach(() => cleanup());

  it("shows how many of each kind the chat has, and no number for a kind it doesn't have", () => {
    renderMenu({ participants });

    expect(screen.getByTestId('agents-menuitem-count')).toHaveTextContent('2');
    expect(screen.getByTestId('pipelines-menuitem-count')).toHaveTextContent('1');
    expect(screen.getByTestId('mcps-menuitem-count')).toHaveTextContent('1');
    expect(screen.queryByTestId('skills-menuitem-count')).toBeNull();
    expect(screen.queryByTestId('toolkits-menuitem-count')).toBeNull();
  });

  it('counts the modules that are on and available', () => {
    mocks.tools = [
      { name: 'web_search', title: 'Web Search' },
      { name: 'planner', title: 'Planner' },
      { name: 'image_generation', title: 'Image Creation', unavailable: true },
    ];
    renderMenu({ internal_tools: ['web_search', 'image_generation'] });

    expect(screen.getByTestId('internal-tools-menuitem-count')).toHaveTextContent('1');
  });

  it('has no MCPs row nor its count when MCP is hidden', () => {
    mocks.isMcpVisible = false;
    renderMenu({ participants });

    expect(screen.queryByTestId('mcps-menuitem')).toBeNull();
    expect(screen.queryByTestId('mcps-menuitem-count')).toBeNull();
  });

  it('offers Invite Users when the chat can invite (a new chat)', () => {
    const onInviteUsers = vi.fn();
    renderMenu({ onInviteUsers });

    fireEvent.click(screen.getByTestId('invite-users-menuitem'));

    expect(onInviteUsers).toHaveBeenCalledTimes(1);
  });

  it('has no Invite Users in the personal project', () => {
    mocks.projectId = 1;
    renderMenu({ onInviteUsers: vi.fn() });

    expect(screen.queryByTestId('invite-users-menuitem')).toBeNull();
  });

  it('has no Invite Users in a saved chat', () => {
    renderMenu();

    expect(screen.queryByTestId('invite-users-menuitem')).toBeNull();
  });
});

describe('PlusChatButton modules', () => {
  const tools = [
    {
      name: 'planner',
      title: 'Planner',
      icon: 'CalendarIcon',
      infoTooltip: { text: 'Create, manage, and track tasks.' },
    },
    {
      name: 'web_search',
      title: 'Web Search',
      icon: 'GlobeIcon',
      infoTooltip: { text: 'Search the Internet.' },
      unavailable: true,
      unavailableTooltip: 'Web search is not configured on this platform.',
    },
  ];

  const openModules = (props = {}) => {
    renderMenu(props);
    fireEvent.click(screen.getByTestId('internal-tools-menuitem'));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tools = tools;
  });
  afterEach(() => cleanup());

  it('lists each module with its description, an unavailable one with its reason', () => {
    openModules({ internal_tools: ['web_search'] });

    expect(screen.getByTestId('modules-row-planner')).toHaveTextContent('Create, manage, and track tasks.');
    const webSearch = screen.getByTestId('modules-row-web_search');
    expect(webSearch).toHaveTextContent('Web search is not configured on this platform.');
    expect(webSearch).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('modules-toggle-web_search')).not.toBeChecked();
  });

  it('turns a module on by a click on its row', () => {
    const onInternalToolsConfigChange = vi.fn();
    openModules({ onInternalToolsConfigChange });

    fireEvent.click(screen.getByTestId('modules-row-planner'));

    expect(onInternalToolsConfigChange).toHaveBeenCalledWith({ key: 'planner', value: true });
  });

  it('locks every module while the chat cannot change them', () => {
    const onInternalToolsConfigChange = vi.fn();
    openModules({ onInternalToolsConfigChange, disableInternalTools: true });

    fireEvent.click(screen.getByTestId('modules-row-planner'));

    expect(screen.getByTestId('modules-row-planner')).toHaveAttribute('aria-disabled', 'true');
    expect(onInternalToolsConfigChange).not.toHaveBeenCalled();
  });
});
