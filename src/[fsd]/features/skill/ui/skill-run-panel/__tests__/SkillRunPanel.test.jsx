// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render } from '@testing-library/react';

import SkillRunPanel from '../SkillRunPanel';

const VERSION_LLM_SETTINGS = vi.hoisted(() => ({ model_name: 'unsaved-haiku' }));
const RUN_LLM_SETTINGS = vi.hoisted(() => ({ model_name: 'saved-sonnet' }));
const RUN_OVERRIDE = vi.hoisted(() => ({ model_name: 'run-only-gpt', steps_limit: 12 }));
const fixture = vi.hoisted(() => ({
  canEditVersionModel: true,
  unsavedVersionLLMSettings: null,
  chatBoxProps: null,
  onSetRunLLMSettings: vi.fn(),
  setRunLLMSettings: vi.fn(),
  onSetVersionLLMSettings: vi.fn(),
}));

vi.mock('@/[fsd]/features/chat/ui', () => ({
  ChatBox: props => {
    fixture.chatBoxProps = props;
    return null;
  },
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useFocusRunInput: () => {},
  useSkillRunChat: () => ({
    activeConversation: { id: 7, chat_history: [] },
    activeParticipant: { id: 3 },
    llmSettings: RUN_LLM_SETTINGS,
    unsavedLLMSettings: RUN_OVERRIDE,
    setUnsavedLLMSettings: fixture.setRunLLMSettings,
    onSetLLMSettings: fixture.onSetRunLLMSettings,
  }),
  useSkillVersionModel: () => ({
    llmSettings: VERSION_LLM_SETTINGS,
    canEditVersionModel: fixture.canEditVersionModel,
    unsavedVersionLLMSettings: fixture.canEditVersionModel ? fixture.unsavedVersionLLMSettings : null,
    onSetLLMSettings: fixture.onSetVersionLLMSettings,
  }),
}));
vi.mock('@/[fsd]/shared/ui/button', () => ({ ViewRunHistoryButton: () => null }));
vi.mock('@/[fsd]/widgets/context-budget', () => ({ ContextBudgetUI: { ContextBudgetInfo: () => null } }));
vi.mock('@/components/Chat/FullScreenToggle', () => ({ default: () => null }));
vi.mock('@/hooks/chat/useUploadAttachments', () => ({ default: () => ({}) }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('../SkillRunActions', () => ({ default: () => null }));

const renderPanel = canEditVersionModel => {
  fixture.canEditVersionModel = canEditVersionModel;
  return render(
    <SkillRunPanel
      skillId={10}
      skillName="Reviewer"
      versionDetails={{ id: 100 }}
    />,
  );
};

describe('SkillRunPanel model chip', () => {
  afterEach(() => {
    cleanup();
    fixture.chatBoxProps = null;
    fixture.unsavedVersionLLMSettings = null;
    fixture.setRunLLMSettings.mockClear();
  });

  it('runs on and edits the version model, unsaved included, like the agent chat pane', () => {
    renderPanel(true);

    expect(fixture.chatBoxProps.llmSettings).toBe(VERSION_LLM_SETTINGS);
    expect(fixture.chatBoxProps.onSetLLMSettings).toBe(fixture.onSetVersionLLMSettings);
  });

  it('keeps the model to this run when the version model cannot be edited', () => {
    renderPanel(false);

    expect(fixture.chatBoxProps.llmSettings).toBe(RUN_LLM_SETTINGS);
    expect(fixture.chatBoxProps.onSetLLMSettings).toBe(fixture.onSetRunLLMSettings);
    expect(fixture.chatBoxProps.unsavedLLMSettings).toBe(RUN_OVERRIDE);
  });

  it('sends the unsaved version model with every message and keeps the run steps limit', () => {
    fixture.unsavedVersionLLMSettings = VERSION_LLM_SETTINGS;
    renderPanel(true);

    expect(fixture.chatBoxProps.unsavedLLMSettings).toEqual({ ...VERSION_LLM_SETTINGS, steps_limit: 12 });
  });

  it('runs on the saved settings once the version model is saved or discarded', () => {
    renderPanel(true);

    expect(fixture.chatBoxProps.unsavedLLMSettings).toBeNull();
  });

  it('drops the run override once the version model is saved or discarded', () => {
    renderPanel(true);

    expect(fixture.setRunLLMSettings).toHaveBeenCalledWith(null);
  });

  it('keeps the run override while the version model is unsaved or cannot be edited', () => {
    fixture.unsavedVersionLLMSettings = VERSION_LLM_SETTINGS;
    renderPanel(true);
    cleanup();
    renderPanel(false);

    expect(fixture.setRunLLMSettings).not.toHaveBeenCalled();
  });
});
