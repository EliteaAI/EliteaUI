import { useCallback, useEffect, useState } from 'react';

/**
 * Manages conversation starters display logic for the chat view.
 *
 * Derives which starters to show based on whether the currently edited agent/pipeline
 * matches the active participant. When the entity open in the editor matches the active
 * participant, live starters from the editor form are displayed; otherwise, starters from the
 * active participant's saved version details are shown.
 */
export const useConversationStarters = ({
  activeParticipant,
  activeParticipantDetails,
  editingAgent,
  editingPipeline,
}) => {
  const [conversationStarters, setConversationStarters] = useState([]);
  const [editorConversationStarters, setEditorConversationStarters] = useState(null);

  useEffect(() => {
    const detailsMatchParticipant = activeParticipantDetails.id === activeParticipant?.entity_meta?.id;

    let starters = [];

    if (activeParticipant?.version_details?.conversation_starters) {
      starters = activeParticipant.version_details.conversation_starters;
    } else if (detailsMatchParticipant && activeParticipantDetails.version_details?.conversation_starters) {
      starters = activeParticipantDetails.version_details.conversation_starters;
    }

    setConversationStarters(starters);
  }, [
    activeParticipant?.entity_meta?.id,
    activeParticipant?.entity_settings?.version_id,
    activeParticipant?.version_details?.conversation_starters,
    activeParticipantDetails.id,
    activeParticipantDetails.version_details?.conversation_starters,
  ]);

  const handleEditorConversationStartersChange = useCallback(starters => {
    setEditorConversationStarters(starters);
  }, []);

  const resetEditorConversationStarters = useCallback(() => {
    setEditorConversationStarters(null);
  }, []);

  const activeParticipantId = activeParticipant?.entity_meta?.id;
  const isEditingActiveParticipant =
    editorConversationStarters !== null &&
    !!activeParticipantId &&
    (editingAgent?.entity_meta?.id === activeParticipantId ||
      editingPipeline?.entity_meta?.id === activeParticipantId);
  const displayedConversationStarters = isEditingActiveParticipant
    ? editorConversationStarters
    : conversationStarters;

  return {
    displayedConversationStarters,
    handleEditorConversationStartersChange,
    resetEditorConversationStarters,
  };
};
