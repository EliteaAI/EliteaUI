// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useChatEditors } from '../useChatEditors.hooks';

const editSkill = vi.hoisted(() => ({ current: null }));

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('@/slices/settings', () => ({ actions: { setBlockNav: vi.fn() } }));
vi.mock('@/hooks/chat/useAgentCreation', () => ({ default: () => ({}) }));
vi.mock('@/hooks/chat/usePipelineCreation', () => ({ default: () => ({}) }));
vi.mock('@/hooks/chat/useToolkitCreation', () => ({ default: () => ({}) }));
vi.mock('@/hooks/chat/useAgentEditorUrlSync', () => ({ useAgentEditorUrlSync: () => ({}) }));
vi.mock('@/hooks/chat/useEditAgent', () => ({ default: () => ({}) }));
vi.mock('@/hooks/chat/useEditPipeline', () => ({ default: () => ({}) }));
vi.mock('@/hooks/chat/useEditToolkit', () => ({ default: () => ({}) }));
vi.mock('../useAttachmentToolChange.hooks', () => ({ useAttachmentToolChange: () => ({}) }));
vi.mock('../useConversationStarters.hooks', () => ({ useConversationStarters: () => ({}) }));
vi.mock('../useEditProjectContext.hooks', () => ({ useEditProjectContext: () => ({}) }));
vi.mock('../useMutuallyExclusiveEditors.hooks', () => ({ useMutuallyExclusiveEditors: () => ({}) }));
vi.mock('../useEditSkill.hooks', () => ({
  useEditSkill: () => ({ isEditingSkill: true, editingSkill: editSkill.current }),
}));
vi.mock('../../helpers', () => ({ buildEntityParticipant: vi.fn() }));

const NEW_CHAT_SKILL = {
  id: 1,
  entity_name: 'skill',
  entity_meta: { id: 1, project_id: 2 },
  entity_settings: { version_id: 705 },
};
const USER_PARTICIPANT = { id: 1, entity_name: 'user', entity_meta: { id: 7 }, entity_settings: {} };
const CHAT_SKILL = {
  id: 58,
  entity_name: 'skill',
  entity_meta: { id: 1, project_id: 2 },
  entity_settings: { version_id: 705 },
};

const renderEditors = (activeConversation, onChangeParticipantSettings = vi.fn()) => {
  editSkill.current = NEW_CHAT_SKILL;
  return renderHook(() => useChatEditors({ activeConversation, onChangeParticipantSettings })).result.current;
};

describe('useChatEditors skill canvas', () => {
  it('writes to the chat participant once the new chat is created', () => {
    const onChangeParticipantSettings = vi.fn();
    const editors = renderEditors(
      { id: 3, participants: [USER_PARTICIPANT, CHAT_SKILL] },
      onChangeParticipantSettings,
    );

    expect(editors.editingSkill.id).toBe(58);
    expect(editors.handleSkillSettingsChange).toBe(onChangeParticipantSettings);
  });

  it('cannot write before the chat exists', () => {
    const editors = renderEditors({ isNew: true, participants: [USER_PARTICIPANT, CHAT_SKILL] });

    expect(editors.editingSkill).toBe(NEW_CHAT_SKILL);
    expect(editors.handleSkillSettingsChange).toBeUndefined();
  });

  it('cannot write while the skill is not a participant of the chat', () => {
    const editors = renderEditors({ id: 3, participants: [USER_PARTICIPANT] });

    expect(editors.editingSkill).toBe(NEW_CHAT_SKILL);
    expect(editors.handleSkillSettingsChange).toBeUndefined();
  });
});
