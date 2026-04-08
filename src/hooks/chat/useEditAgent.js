import { useCallback, useEffect, useRef, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';
import { syncVariableKeys } from '@/utils/variableSync';

/**
 * Hook for managing agent editing state in chat
 */
const useEditAgent = ({ activeParticipant, setActiveParticipant, onChangeParticipantSettings } = {}) => {
  // Get agent editing state from Redux via the navigation blocker
  const { isEditingAgent, setAgentEditingBlockNav } = useNavBlocker();
  const setAgentEditingBlockNavRef = useRef(setAgentEditingBlockNav);

  useEffect(() => {
    setAgentEditingBlockNavRef.current = setAgentEditingBlockNav;
  }, [setAgentEditingBlockNav]);

  // Store the agent currently being edited (keep this as local state)
  const [editingAgent, setEditingAgent] = useState(null);
  // Store whether we're in create mode
  const [isCreateMode, setIsCreateMode] = useState(false);

  /**
   * Show the agent editor for a participant
   */
  const onShowAgentEditor = useCallback(theSelectedParticipant => {
    if (!theSelectedParticipant) {
      return;
    }

    // Important: set editing agent first, then set isEditingAgent flag
    // This ensures the agent is available when the editor is displayed
    setEditingAgent(theSelectedParticipant);
    setIsCreateMode(false);

    // Use the Redux action to set isEditingAgent
    setAgentEditingBlockNavRef.current(true);
  }, []);

  /**
   * Close the agent editor
   */
  const onCloseAgentEditor = useCallback(() => {
    // Use the Redux action to reset isEditingAgent
    setAgentEditingBlockNavRef.current(false);
    setEditingAgent(null);
    setIsCreateMode(false);
  }, []);

  /**
   * Callback to update active participant after successful agent save (editing only)
   */
  const handleAgentSaved = useCallback(
    savedData => {
      if (!savedData || !activeParticipant || !setActiveParticipant) return;

      // Only update if the saved agent is the currently active participant
      if (activeParticipant.entity_meta?.id === savedData.id) {
        // Preserve participant custom values for variables
        const currentParticipantVariables = activeParticipant.entity_settings?.variables || [];
        const agentVariables = savedData.version_details?.variables || [];

        const syncedKeysVariables = syncVariableKeys(agentVariables, currentParticipantVariables);

        // Create a completely refreshed participant with the latest agent data
        const refreshedParticipant = {
          ...activeParticipant,
          // Update version_details with the latest agent data
          version_details: {
            ...savedData.version_details,
          },
          entity_settings: {
            ...activeParticipant.entity_settings,
            // Use synced variables that preserve participant values but sync with agent schema
            variables: syncedKeysVariables,
            // Update version_id to reflect the saved version
            version_id: savedData.version_details?.id || activeParticipant.entity_settings?.version_id,
          },
        };

        // Always update local React state first to ensure UI updates immediately
        setActiveParticipant(prev => (prev?.id === refreshedParticipant.id ? refreshedParticipant : prev));

        // Also call onChangeParticipantSettings if available to persist changes to backend
        if (onChangeParticipantSettings) {
          onChangeParticipantSettings(refreshedParticipant, true);
        }
      }
    },
    [activeParticipant, setActiveParticipant, onChangeParticipantSettings],
  );

  /**
   * Show the agent creator (open editor in create mode)
   */
  const onShowAgentEditorCreator = useCallback(() => {
    setEditingAgent(null); // No existing agent to edit
    setIsCreateMode(true);
    // Use the Redux action to set isEditingAgent
    setAgentEditingBlockNavRef.current(true);
  }, []);

  /**
   * Handle agent creation completion for editor state
   */
  const onAgentEditorCreated = useCallback(createdAgent => {
    // Agent was created successfully, we can keep the editor open
    // or perform any other necessary actions
    setEditingAgent(createdAgent);
    setIsCreateMode(false); // Switch from create to edit mode
  }, []);

  useEffect(() => {
    return () => {
      setAgentEditingBlockNavRef.current(false);
    };
  }, []);

  return {
    // Use Redux state instead of local state
    isEditingAgent,
    editingAgent,
    isCreateMode,
    onShowAgentEditor,
    onShowAgentEditorCreator,
    onAgentEditorCreated,
    onCloseAgentEditor,
    handleAgentSaved,
  };
};

export default useEditAgent;
