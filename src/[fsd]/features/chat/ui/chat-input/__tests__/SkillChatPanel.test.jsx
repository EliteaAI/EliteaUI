// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillChatPanel from '../SkillChatPanel';

vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({ useParticipantEntityIcon: () => ({}) }));
vi.mock('@/[fsd]/widgets/llm-model-selector', () => ({ LLMModelSelector: () => null }));
vi.mock('@/components/EntityIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/AttentionIcon', () => ({ default: () => <span>!</span> }));
vi.mock('@/hooks/useAgentEditorPanelFit', () => ({
  default: () => ({ containerRef: { current: null }, isSmallView: false }),
}));
vi.mock('../SwitchToModelButton', () => ({ default: () => null }));
vi.mock('../VersionSelector', () => ({ default: () => null }));

const skill = { entity_name: 'skill', entity_meta: { id: 5, project_id: 2 }, meta: { name: 'writer' } };

const renderPanel = unavailableReason =>
  render(
    <ThemeProvider theme={createTheme({ palette: { border: { lines: '#ccc' } } })}>
      <SkillChatPanel
        activeParticipant={skill}
        participantDetails={undefined}
        models={[]}
        unavailableReason={unavailableReason}
      />
    </ThemeProvider>,
  );

const tooltipFor = async unavailableReason => {
  renderPanel(unavailableReason);
  fireEvent.mouseOver(screen.getByTestId('chat-skill-panel-unavailable'));
  return (await screen.findByRole('tooltip')).textContent;
};

describe('SkillChatPanel unavailable skill', () => {
  afterEach(() => cleanup());

  it('shows no warning while the skill can run', () => {
    renderPanel(undefined);
    expect(screen.queryByTestId('chat-skill-panel-unavailable')).not.toBeInTheDocument();
  });

  it('does not offer another version when the whole skill is gone', async () => {
    expect(await tooltipFor('skill')).toBe(
      'This skill is no longer available. Switch to a model or remove it from the chat.',
    );
  });

  it('offers another version when only the pinned version is gone', async () => {
    expect(await tooltipFor('version')).toBe(
      'This skill version is no longer available. Select another version or switch to a model.',
    );
  });
});
