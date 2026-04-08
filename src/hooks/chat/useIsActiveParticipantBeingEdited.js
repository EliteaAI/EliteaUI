import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants';
import useNavBlocker from '@/hooks/useNavBlocker';

/**
 * Custom hook to determine if the active participant is currently being edited
 *
 * @param {Object} activeParticipant - The currently active participant object
 * @returns {boolean} True if the active participant is being edited, false otherwise
 */
export const useIsActiveParticipantBeingEdited = activeParticipant => {
  // Get editing states from Redux state - check both agent and pipeline editing
  const { isEditingAgent, isEditingPipeline } = useNavBlocker();

  // Get edited_participant_id from URL
  const [searchParams] = useSearchParams();
  const editedParticipantId = searchParams.get(SearchParams.EditedParticipantId);

  // Check if the current active participant is the one being edited
  const isActiveParticipantBeingEdited = useMemo(() => {
    // Need to be editing either an agent or pipeline
    if (!(isEditingAgent || isEditingPipeline) || !editedParticipantId || !activeParticipant) {
      return false;
    }

    // Get all possible IDs from the participant
    // The edited_participant_id in URL might match either participant.id OR participant.entity_meta.id
    const participantId = activeParticipant.id;
    const entityMetaId = activeParticipant.entity_meta?.id;
    const metaId = activeParticipant.meta?.id;
    const entityId = activeParticipant.entity_id;

    // Check if any of the participant's IDs match the edited_participant_id from URL
    // This handles cases where URL contains entity_meta.id but we need to match against participant.id (or vice versa)
    return (
      (participantId && String(participantId) === String(editedParticipantId)) ||
      (entityMetaId && String(entityMetaId) === String(editedParticipantId)) ||
      (metaId && String(metaId) === String(editedParticipantId)) ||
      (entityId && String(entityId) === String(editedParticipantId))
    );
  }, [isEditingAgent, isEditingPipeline, editedParticipantId, activeParticipant]);

  return isActiveParticipantBeingEdited;
};

export default useIsActiveParticipantBeingEdited;
