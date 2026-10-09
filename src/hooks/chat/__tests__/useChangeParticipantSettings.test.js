// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import useChangeParticipantSettings from '../useChangeParticipantSettings';

const shared = vi.hoisted(() => ({ result: {} }));

vi.mock('@/api', () => ({
  useUpdateParticipantSettingsMutation: () => [vi.fn(async () => shared.result), { isError: false }],
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: () => '' }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));

const participant = { id: 7, entity_settings: { version_id: 2 } };

const renderSettings = () => {
  const setActiveParticipant = vi.fn();
  const { result } = renderHook(() =>
    useChangeParticipantSettings({
      setActiveConversation: vi.fn(),
      setConversations: vi.fn(),
      activeConversation: { id: 3, participants: [participant] },
      activeParticipant: participant,
      setActiveParticipant,
      toastError: vi.fn(),
    }),
  );
  return { change: result.current.onChangeParticipantSettings, setActiveParticipant };
};

describe('useChangeParticipantSettings result', () => {
  it('reports a saved change and applies it', async () => {
    shared.result = { data: {} };
    const { change, setActiveParticipant } = renderSettings();
    let saved;
    await act(async () => {
      saved = await change(participant, true);
    });
    expect(saved).toBe(true);
    expect(setActiveParticipant).toHaveBeenCalledWith(participant);
  });

  it('reports a rejected change without applying it', async () => {
    shared.result = { error: { status: 400 } };
    const { change, setActiveParticipant } = renderSettings();
    let saved;
    await act(async () => {
      saved = await change(participant, true);
    });
    expect(saved).toBe(false);
    expect(setActiveParticipant).not.toHaveBeenCalled();
  });

  it('reports nothing saved when nothing changed', async () => {
    const { change } = renderSettings();
    let saved;
    await act(async () => {
      saved = await change(participant, false);
    });
    expect(saved).toBe(false);
  });
});
