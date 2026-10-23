// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers/participants.helpers';
import { renderHook } from '@testing-library/react';

import usePipelineCreation from '../usePipelineCreation';

vi.mock('@/GA', () => ({ useTrackEvent: () => vi.fn() }));

const CREATED_PIPELINE = {
  id: 137,
  name: 'pipeline',
  version_details: { id: 900 },
  entity_settings: { agent_type: 'pipeline' },
};

const SERVER_PIPELINE_PARTICIPANT = {
  id: 77,
  entity_name: 'application',
  entity_meta: { id: 137, project_id: 2 },
  entity_settings: { agent_type: 'pipeline', version_id: 900 },
};

describe('usePipelineCreation', () => {
  it('activates the pipeline under the same identity the chat restores it by', () => {
    const onSetActiveParticipant = vi.fn();
    const { result } = renderHook(() =>
      usePipelineCreation({
        projectId: 2,
        onPipelineEditorCreated: vi.fn(),
        addNewParticipants: vi.fn(),
        onSetActiveParticipant,
      }),
    );

    result.current.onPipelineCreated(CREATED_PIPELINE);

    const activated = onSetActiveParticipant.mock.calls[0][0];
    expect(getChatParticipantUniqueId(activated)).toBe(
      getChatParticipantUniqueId(SERVER_PIPELINE_PARTICIPANT),
    );
  });
});
