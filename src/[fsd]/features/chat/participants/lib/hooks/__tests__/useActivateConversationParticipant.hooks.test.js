// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useActivateConversationParticipant } from '../useActivateConversationParticipant.hooks';

const AGENT = { id: 31, entity_name: 'application', entity_meta: { id: 9, project_id: 2 } };
const AGENT_UNIQUE_ID = 'application_9_2';

const renderActivate = openConversationId => {
  const setActiveParticipant = vi.fn();
  const setLocalActiveParticipant = vi.fn();
  const { activateParticipant } = renderHook(() =>
    useActivateConversationParticipant({
      activeConversationIdRef: { current: openConversationId },
      setActiveParticipant,
      setLocalActiveParticipant,
    }),
  ).result.current;
  return { activateParticipant, setActiveParticipant, setLocalActiveParticipant };
};

describe('useActivateConversationParticipant', () => {
  it('activates and remembers the participant in the open chat', () => {
    const { activateParticipant, setActiveParticipant, setLocalActiveParticipant } = renderActivate(100);

    activateParticipant(100, AGENT);

    expect(setActiveParticipant).toHaveBeenCalledWith(AGENT);
    expect(setLocalActiveParticipant).toHaveBeenCalledWith(100, AGENT_UNIQUE_ID);
  });

  it('only remembers the participant for its chat once another chat is open', () => {
    const { activateParticipant, setActiveParticipant, setLocalActiveParticipant } = renderActivate(200);

    activateParticipant(100, AGENT);

    expect(setActiveParticipant).not.toHaveBeenCalled();
    expect(setLocalActiveParticipant).toHaveBeenCalledWith(100, AGENT_UNIQUE_ID);
  });

  it('activates without remembering in an unsaved chat', () => {
    const { activateParticipant, setActiveParticipant, setLocalActiveParticipant } =
      renderActivate(undefined);

    activateParticipant(undefined, AGENT);

    expect(setActiveParticipant).toHaveBeenCalledWith(AGENT);
    expect(setLocalActiveParticipant).not.toHaveBeenCalled();
  });

  it('does not activate in a saved chat opened after leaving an unsaved one', () => {
    const { activateParticipant, setActiveParticipant } = renderActivate(200);

    activateParticipant(undefined, AGENT);

    expect(setActiveParticipant).not.toHaveBeenCalled();
  });
});
