import { useEffect, useRef } from 'react';

import { useSearchParams } from 'react-router-dom';

import { ChatParticipantType, SearchParams } from '@/common/constants';
import useNavBlocker from '@/hooks/useNavBlocker';

/**
 * Synchronizes participant editor (Agent/Pipeline) open/close state with the URL param 'edited_participant_id',
 * and restores the appropriate editor from the URL param on mount.
 *
 * @param {Object} params
 * @param {Object} params.editingAgent - The agent being edited
 * @param {Object} params.editingPipeline - The pipeline being edited
 * @param {Object} params.activeParticipant - The currently active participant
 * @param {Function} params.onShowAgentEditor - Function to open AgentEditor for a participant
 * @param {Function} params.onShowPipelineEditor - Function to open PipelineEditor for a participant
 * @param {Object} params.activeConversation - The active conversation object
 */
export function useAgentEditorUrlSync({
  editingAgent,
  editingPipeline,
  onShowAgentEditor,
  onShowPipelineEditor,
  activeConversation,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEditingAgent, isEditingPipeline, isAnyEditorOpen } = useNavBlocker();
  // Track if editors were explicitly closed
  const agentEditorClosedByUser = useRef(false);
  const pipelineEditorClosedByUser = useRef(false);

  // Call this when you want to close AgentEditor explicitly
  const markAgentEditorClosed = () => {
    agentEditorClosedByUser.current = true;
  };

  // Call this when you want to close PipelineEditor explicitly
  const markPipelineEditorClosed = () => {
    pipelineEditorClosedByUser.current = true;
  };

  // Get the ID of the currently edited participant
  const getEditedParticipantId = () => {
    if (isEditingAgent && editingAgent) {
      return editingAgent.id || editingAgent.entity_meta?.id;
    }
    if (isEditingPipeline && editingPipeline) {
      return editingPipeline.entity_meta?.id || editingPipeline.id;
    }
    return null;
  };

  // Sync editor state with URL param 'edited_participant_id'
  useEffect(() => {
    const editedId = getEditedParticipantId();
    const urlEditedId = searchParams.get(SearchParams.EditedParticipantId);

    if (editedId) {
      // Reset closed flags when opening an editor
      agentEditorClosedByUser.current = false;
      pipelineEditorClosedByUser.current = false;

      // Add the param to URL if it's different or missing
      if (urlEditedId !== String(editedId)) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set(SearchParams.EditedParticipantId, editedId);
        setSearchParams(newParams, { replace: true });
      }
    } else if (urlEditedId) {
      // Only remove the param if we have an explicit reason AND the param exists in URL

      // IMPORTANT: Don't remove the param if we're in the transient state where
      // isEditingAgent/Pipeline is true but editingAgent/Pipeline hasn't been set yet.
      // This happens during restoration from URL when Redux state updates before local state.
      const isTransientRestorationState =
        (isEditingAgent && !editingAgent && urlEditedId) ||
        (isEditingPipeline && !editingPipeline && urlEditedId);

      if (isTransientRestorationState) {
        // Preserve URL param during transient state
        return;
      }

      const shouldRemoveParam =
        agentEditorClosedByUser.current ||
        pipelineEditorClosedByUser.current ||
        (isAnyEditorOpen && !isEditingAgent && !isEditingPipeline) ||
        (isEditingAgent && !editingAgent && !urlEditedId) || // Agent create mode (no URL param)
        (isEditingPipeline && !editingPipeline && !urlEditedId); // Pipeline create mode (no URL param)

      if (shouldRemoveParam) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete(SearchParams.EditedParticipantId);
        setSearchParams(newParams, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEditingAgent,
    editingAgent?.id,
    editingAgent?.entity_meta?.id,
    isEditingPipeline,
    editingPipeline?.entity_meta?.id,
    editingPipeline?.id,
    isAnyEditorOpen,
    searchParams, // Need this to detect when URL param is removed externally
  ]);

  // Restore editor from URL when edited_participant_id is present
  useEffect(() => {
    const editedId = searchParams.get(SearchParams.EditedParticipantId);

    if (editedId && !agentEditorClosedByUser.current && !pipelineEditorClosedByUser.current) {
      // Wait for conversation to be loaded with participants
      if (!activeConversation?.id || !activeConversation?.participants?.length) {
        return;
      }

      // Don't open editor if one is already open (prevents duplicate opening)
      if (isEditingAgent || isEditingPipeline) {
        return;
      }

      // Find the participant from conversation that matches edited_participant_id
      // The editedId could match either participant.id OR participant.entity_meta.id
      const participants = activeConversation.participants;
      const participantToEdit = participants.find(p => {
        const participantId = p.id;
        const entityMetaId = p.entity_meta?.id;
        return String(participantId) === String(editedId) || String(entityMetaId) === String(editedId);
      });

      if (participantToEdit) {
        // Determine if this is a pipeline or agent
        const isPipeline =
          participantToEdit.entity_settings?.agent_type === 'pipeline' ||
          participantToEdit.entity_name === ChatParticipantType.Pipelines;

        if (isPipeline && onShowPipelineEditor) {
          onShowPipelineEditor(participantToEdit);
        } else if (!isPipeline && onShowAgentEditor) {
          onShowAgentEditor(participantToEdit);
        }
      }
    } else if (!editedId) {
      // Reset the flags when URL param is actually removed
      agentEditorClosedByUser.current = false;
      pipelineEditorClosedByUser.current = false;
    }
    // Only run when participants or URL params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeConversation?.id, activeConversation?.participants]);

  return { markAgentEditorClosed, markPipelineEditorClosed };
}
