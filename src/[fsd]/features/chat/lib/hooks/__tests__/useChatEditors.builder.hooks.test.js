// @vitest-environment jsdom
import { act } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useChatEditors } from '../useChatEditors.hooks';

const dispatch = vi.hoisted(() => vi.fn());
const invalidateTags = vi.hoisted(() => vi.fn(tags => ({ type: 'invalidate', tags })));

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));
vi.mock('@/api/eliteaApi', () => ({ eliteaApi: { util: { invalidateTags } } }));
vi.mock('@/api/applications', () => ({ TAG_TYPE_APPLICATION_DETAILS: 'TAG_TYPE_APPLICATION_DETAILS' }));
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
vi.mock('../useEditSkill.hooks', () => ({ useEditSkill: () => ({}) }));
vi.mock('../../helpers', () => ({ buildEntityParticipant: vi.fn(() => ({})) }));

describe('EL-7383 Builder entity events', () => {
  it('reload the open agent version so a linked toolkit shows without a page refresh', () => {
    const { result } = renderHook(() =>
      useChatEditors({ activeConversation: { id: 3, participants: [] }, projectId: 4 }),
    );

    act(() =>
      result.current.onGeneratedEntityCreated({ entity_type: 'agent', entity_id: 604, version_id: 818 }),
    );

    expect(invalidateTags).toHaveBeenCalledWith([{ type: 'TAG_TYPE_APPLICATION_DETAILS', id: '4_604_818' }]);
    expect(dispatch).toHaveBeenCalled();
  });
});
