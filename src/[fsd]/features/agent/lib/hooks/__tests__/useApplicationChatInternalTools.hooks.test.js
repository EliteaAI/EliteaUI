// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook, waitFor } from '@testing-library/react';

import { useApplicationChatInternalTools } from '../useApplicationChatInternalTools.hooks';

const shared = vi.hoisted(() => ({
  editConversation: vi.fn(() => Promise.resolve({})),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError: shared.toastError }),
}));

vi.mock('@/common/utils', () => ({
  buildErrorMessage: err => err?.data?.error,
}));

vi.mock('@/api', () => ({
  useConversationEditMutation: () => [shared.editConversation],
}));

const conversation = tools => ({ id: 7, meta: { persona: 'nerdy', internal_tools: tools } });

describe('useApplicationChatInternalTools (EL-7383)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves the editor modules on the test chat when they differ', () => {
    const setActiveConversation = vi.fn();
    renderHook(() =>
      useApplicationChatInternalTools({
        activeConversation: conversation([]),
        setActiveConversation,
        internalTools: ['elitea_builder'],
        projectId: 2,
      }),
    );
    expect(shared.editConversation).toHaveBeenCalledWith({
      projectId: 2,
      id: 7,
      meta: { persona: 'nerdy', internal_tools: ['elitea_builder'] },
    });
    const update = setActiveConversation.mock.calls[0][0];
    expect(update(conversation([])).meta.internal_tools).toEqual(['elitea_builder']);
  });

  it('turns a module off when the editor removes it', () => {
    renderHook(() =>
      useApplicationChatInternalTools({
        activeConversation: conversation(['elitea_builder', 'ask_user']),
        setActiveConversation: vi.fn(),
        internalTools: ['ask_user'],
        projectId: 2,
      }),
    );
    expect(shared.editConversation.mock.calls[0][0].meta.internal_tools).toEqual(['ask_user']);
  });

  it('does nothing when the modules already match, in any order', () => {
    renderHook(() =>
      useApplicationChatInternalTools({
        activeConversation: conversation(['ask_user', 'elitea_builder']),
        setActiveConversation: vi.fn(),
        internalTools: ['elitea_builder', 'ask_user'],
        projectId: 2,
      }),
    );
    expect(shared.editConversation).not.toHaveBeenCalled();
  });

  it('does nothing before the chat has a saved conversation', () => {
    renderHook(() =>
      useApplicationChatInternalTools({
        activeConversation: { isNew: true, meta: {} },
        setActiveConversation: vi.fn(),
        internalTools: ['elitea_builder'],
        projectId: 2,
      }),
    );
    expect(shared.editConversation).not.toHaveBeenCalled();
  });

  it('saves the same change only once across re-renders', () => {
    const props = {
      activeConversation: conversation([]),
      setActiveConversation: vi.fn(),
      internalTools: ['elitea_builder'],
      projectId: 2,
    };
    const { rerender } = renderHook(p => useApplicationChatInternalTools(p), { initialProps: props });
    rerender({ ...props, internalTools: ['elitea_builder'] });
    expect(shared.editConversation).toHaveBeenCalledTimes(1);
  });

  it('reverts the chat modules and shows an error when the save fails', async () => {
    shared.editConversation.mockResolvedValueOnce({ error: { data: { error: 'boom' } } });
    const setActiveConversation = vi.fn();
    renderHook(() =>
      useApplicationChatInternalTools({
        activeConversation: conversation(['ask_user']),
        setActiveConversation,
        internalTools: ['ask_user', 'elitea_builder'],
        projectId: 2,
      }),
    );
    await waitFor(() => expect(shared.toastError).toHaveBeenCalledWith('boom'));
    const revert = setActiveConversation.mock.calls[1][0];
    const reverted = revert(conversation(['ask_user', 'elitea_builder']));
    expect(reverted.meta).toEqual({ persona: 'nerdy', internal_tools: ['ask_user'] });
  });
});
