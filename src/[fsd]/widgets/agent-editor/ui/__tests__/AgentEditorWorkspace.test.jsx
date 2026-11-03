// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { section, openTestPanel, onSend } = vi.hoisted(() => ({
  section: name => props => (
    <div
      data-testid={name}
      data-default-expanded={String(props.defaultExpanded ?? true)}
    />
  ),
  openTestPanel: vi.fn(),
  onSend: vi.fn(),
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({ initialValues: { name: 'Story Creator' }, values: { version_details: {} } }),
}));
vi.mock('@/[fsd]/features/agent/ui/ai-edit-agent-modal', () => ({
  AIEditAgentButton: () => <button data-testid="edit-agent-with-ai-button" />,
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations', () => ({
  AgentInput: {
    InstructionsInput: section('instructions'),
    WelcomeMessageInput: section('welcome-message'),
  },
  ApplicationTools: section('tools'),
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationAdvanceSettings', () => ({
  default: section('advanced'),
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationEditorNotes', () => ({
  default: section('editor-notes'),
}));
vi.mock('@/[fsd]/features/interactive-tours/lib/constants', () => ({
  AGENT_TOUR_TARGET_IDS: { workspace: 'agent-workspace', testChat: 'agent-test-chat' },
}));
vi.mock('@/[fsd]/features/project-governance', () => ({
  GovernanceReadinessCard: section('agent-governance-readiness'),
}));
vi.mock('@/[fsd]/features/skill/ui', () => ({ ApplicationSkills: section('skills') }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useRunHistoryNavigation: () => ({ goToRunHistory: vi.fn() }) }));
vi.mock('@/[fsd]/shared/ui', async () => ({
  EditorLayout: await import('@/[fsd]/shared/ui/editor-layout'),
}));
vi.mock('@/[fsd]/widgets/entity-test-panel', () => ({
  EntityTestPanelConstants: { TEST_PANEL_STORAGE_KEYS: { agent: 'agentTestPanelWidth' } },
  EntityTestPanelUI: {
    EntityEditorWorkspace: ({ renderConfig, toolbarActions, testButton }) => (
      <>
        <div data-testid="toolbar">
          {toolbarActions}
          {testButton}
        </div>
        {renderConfig({ isConfigStacked: false })}
      </>
    ),
    TestEntityButton: ({ label, onClick, testId }) => (
      <button
        data-testid={testId}
        onClick={onClick}
      >
        {label}
      </button>
    ),
    EntityTestPanelControls: () => null,
  },
}));
vi.mock('@/[fsd]/widgets/entity-schedules-section', () => ({ EntitySchedulesSection: section('schedules') }));
vi.mock('@/common/constants', () => ({
  PERMISSIONS: { applications: { update: 'applications.update' } },
  ViewMode: { Owner: 'owner' },
}));
vi.mock('@/components/ApplicationVariables.jsx', () => ({ default: section('variables') }));
vi.mock('@/components/ConversationStarters', () => ({ default: section('conversation-starters') }));
vi.mock('@/hooks/application/useAgentMCPToolsStatusMonitor', () => ({ default: () => {} }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/pages/Applications/Components/Applications/ApplicationEditForm', () => ({
  default: props => (
    <div
      data-testid="general"
      data-default-expanded="true"
      data-show-ai-edit={String(props.showAIEditButton)}
    />
  ),
}));
vi.mock('@/pages/Applications/Components/Applications/ApplicationInformation', () => ({
  default: section('information'),
}));
vi.mock('@/routes', () => ({ default: { ApplicationsRunHistory: '/agents/:tab/:agentId/history' } }));
vi.mock('../../lib/hooks', () => ({
  useAgentTestChat: () => ({ settings: { onSend }, isClearDisabled: true }),
}));
vi.mock('../AgentTestChat', () => ({ default: () => null }));

const { default: AgentEditorWorkspace } = await import('../AgentEditorWorkspace');

const theme = createTheme({ palette: darkPalette });

const renderWorkspace = () =>
  render(
    <ThemeProvider theme={theme}>
      <AgentEditorWorkspace
        applicationId={7}
        viewMode="owner"
        isTestPanelOpen={false}
        onOpenTestPanel={openTestPanel}
        onCloseTestPanel={vi.fn()}
      />
    </ThemeProvider>,
  );

const childTestIds = columnTestId =>
  [...screen.getByTestId(columnTestId).querySelectorAll('[data-default-expanded]')].map(
    el => el.dataset.testid,
  );

describe('AgentEditorWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('lays out the left panel sections in order', () => {
    renderWorkspace();

    expect(childTestIds('agent-config-panels-left')).toEqual([
      'agent-governance-readiness',
      'general',
      'instructions',
      'variables',
      'welcome-message',
      'conversation-starters',
      'advanced',
      'editor-notes',
      'information',
    ]);
  });

  it('lays out the right panel sections in order', () => {
    renderWorkspace();

    expect(childTestIds('agent-config-panels-right')).toEqual(['tools', 'skills', 'schedules']);
  });

  it('collapses only Advanced, Editor Notes and Information by default', () => {
    renderWorkspace();

    const collapsed = [...document.querySelectorAll('[data-default-expanded="false"]')].map(
      el => el.dataset.testid,
    );
    expect(collapsed).toEqual(['advanced', 'editor-notes', 'information']);
  });

  it('puts Edit with AI before Test Agent in the toolbar, not in General', () => {
    renderWorkspace();

    const buttons = [...screen.getByTestId('toolbar').querySelectorAll('button')].map(
      el => el.dataset.testid,
    );
    expect(buttons).toEqual(['edit-agent-with-ai-button', 'agent-test-button']);
    expect(screen.getByTestId('general')).toHaveAttribute('data-show-ai-edit', 'false');
  });

  it('opens the Test panel without sending anything', () => {
    renderWorkspace();

    fireEvent.click(screen.getByTestId('agent-test-button'));

    expect(screen.getByTestId('agent-test-button')).toHaveTextContent('Test Agent');
    expect(openTestPanel).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });
});
