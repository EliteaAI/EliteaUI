// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillChatPanel from '../SkillChatPanel';

vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({ useParticipantEntityIcon: () => ({}) }));
vi.mock('@/[fsd]/shared/ui/icon/EntityIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/AttentionIcon', () => ({ default: () => <span>!</span> }));
vi.mock('@/components/Icons/SettingIcon', () => ({
  default: ({ fill }) => (
    <span
      data-testid="setting-icon"
      data-fill={fill ?? ''}
    />
  ),
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useAgentEditorPanelFit: () => ({ containerRef: { current: null }, isSmallView: false }),
}));
vi.mock('../SwitchToModelButton', () => ({ default: () => null }));
const versionSelectorProps = vi.hoisted(() => ({ current: null }));
vi.mock('../VersionSelector', () => ({
  default: props => {
    versionSelectorProps.current = props;
    return null;
  },
}));

const skill = { entity_name: 'skill', entity_meta: { id: 5, project_id: 2 }, meta: { name: 'writer' } };

const renderPanel = (unavailableReason, props = {}) =>
  render(
    <ThemeProvider
      theme={createTheme({ palette: { border: { lines: '#ccc' }, icon: { disabled: '#999' } } })}
    >
      <SkillChatPanel
        activeParticipant={skill}
        participantDetails={undefined}
        unavailableReason={unavailableReason}
        {...props}
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

describe('SkillChatPanel settings', () => {
  afterEach(() => cleanup());

  it('opens the skill canvas instead of offering a model selector', () => {
    const onShowSkillEditor = vi.fn();
    renderPanel(undefined, { onShowSkillEditor });

    expect(screen.queryByTestId('model-selector-button')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('chat-skill-settings-button'));
    expect(onShowSkillEditor).toHaveBeenCalledWith(skill);
  });

  it('shows the canvas is open for this skill only', () => {
    renderPanel(undefined, { onShowSkillEditor: vi.fn(), editingSkill: { ...skill, id: 41 } });
    expect(screen.getByTestId('chat-skill-settings-button')).toHaveTextContent('Editing...');
    cleanup();

    renderPanel(undefined, {
      onShowSkillEditor: vi.fn(),
      editingSkill: { ...skill, entity_meta: { id: 6, project_id: 2 } },
    });
    expect(screen.getByTestId('chat-skill-settings-button')).not.toHaveTextContent('Editing...');
    expect(screen.getByTestId('setting-icon')).toBeInTheDocument();
  });

  it('does not mistake a skill of another project with the same id for this one', () => {
    renderPanel(undefined, {
      onShowSkillEditor: vi.fn(),
      editingSkill: { ...skill, entity_meta: { id: 5, project_id: 1 } },
    });
    expect(screen.getByTestId('chat-skill-settings-button')).not.toHaveTextContent('Editing...');
  });

  it('cannot open a canvas the page does not provide', () => {
    renderPanel(undefined);
    expect(screen.getByTestId('chat-skill-settings-button')).toBeDisabled();
  });
});

describe('SkillChatPanel version switch', () => {
  afterEach(() => cleanup());

  it('guards unsaved canvas edits like the agent panel', () => {
    const onCloseSkillEditor = vi.fn();
    const onShowVersionChangeAlert = vi.fn();
    renderPanel(undefined, {
      participantDetails: { id: 5, name: 'writer', versions: [{ id: 1, name: 'base' }] },
      onCloseSkillEditor,
      isEditorDirty: true,
      onShowVersionChangeAlert,
    });

    expect(versionSelectorProps.current).toMatchObject({
      onCloseEditor: onCloseSkillEditor,
      isEditorDirty: true,
      onShowVersionChangeAlert,
    });
  });
});

describe('SkillChatPanel settings icon', () => {
  afterEach(() => cleanup());

  it('greys out with the button while the chat streams', () => {
    renderPanel(undefined, { onShowSkillEditor: vi.fn(), disabled: true });
    expect(screen.getByTestId('setting-icon')).toHaveAttribute('data-fill', '#999');
  });

  it('keeps its colour while the canvas can open', () => {
    renderPanel(undefined, { onShowSkillEditor: vi.fn() });
    expect(screen.getByTestId('setting-icon')).toHaveAttribute('data-fill', '');
  });
});
