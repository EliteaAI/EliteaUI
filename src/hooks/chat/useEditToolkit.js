import { useCallback, useEffect, useRef, useState } from 'react';

import useNavBlocker from '../useNavBlocker';

/**
 * Hook for managing toolkit editing state in chat
 */
const useEditToolkit = () => {
  // Store local state for toolkit editing
  const { isEditingToolkit, setToolkitEditingBlockNav, setToolkitCreateMode } = useNavBlocker();
  const setToolkitEditingBlockNavRef = useRef(setToolkitEditingBlockNav);
  const setToolkitCreateModeRef = useRef(setToolkitCreateMode);

  useEffect(() => {
    setToolkitEditingBlockNavRef.current = setToolkitEditingBlockNav;
    setToolkitCreateModeRef.current = setToolkitCreateMode;
  }, [setToolkitEditingBlockNav, setToolkitCreateMode]);

  const [editingToolkit, setEditingToolkit] = useState(null);
  // Store whether we're in create mode
  const [isToolkitCreateMode, setIsToolkitCreateMode] = useState(false);

  /**
   * Show the toolkit editor for a participant
   */
  const onShowToolkitEditor = useCallback(theSelectedParticipant => {
    if (!theSelectedParticipant) {
      return;
    }

    // Important: set editing toolkit first, then set isEditingToolkit flag
    // This ensures the toolkit is available when the editor is displayed
    setEditingToolkit(theSelectedParticipant);
    setIsToolkitCreateMode(false);
    setToolkitEditingBlockNavRef?.current?.(true);
  }, []);

  /**
   * Close the toolkit editor
   */
  const onCloseToolkitEditor = useCallback(() => {
    setToolkitEditingBlockNavRef?.current?.(false);
    setToolkitCreateModeRef?.current?.(false); // Clear create mode in Redux state
    setEditingToolkit(null);
    setIsToolkitCreateMode(false);
  }, []);

  /**
   * Show the toolkit creator (open editor in create mode)
   */
  const onShowToolkitEditorCreator = useCallback((isMCP = false) => {
    setEditingToolkit(null); // No existing toolkit to edit
    setIsToolkitCreateMode(true);
    // Set a flag to indicate we're creating a toolkit and whether it's MCP
    setEditingToolkit({ isCreating: true, isMCP });
    setToolkitEditingBlockNavRef?.current?.(true);
    setToolkitCreateModeRef?.current?.(true); // Set create mode in Redux state
  }, []);

  /**
   * Handle toolkit creation completion for editor state
   */
  const onToolkitEditorCreated = useCallback(createdToolkit => {
    // Toolkit was created successfully, we can keep the editor open
    // or perform any other necessary actions
    setEditingToolkit(createdToolkit);
    setIsToolkitCreateMode(false); // Switch from create to edit mode
    setToolkitCreateModeRef?.current?.(false); // Clear create mode in Redux state
  }, []);

  useEffect(() => {
    return () => {
      setToolkitEditingBlockNavRef.current(false);
      setToolkitCreateModeRef.current(false);
    };
  }, []);

  return {
    isEditingToolkit,
    editingToolkit,
    isToolkitCreateMode,
    onShowToolkitEditor,
    onShowToolkitEditorCreator,
    onToolkitEditorCreated,
    onCloseToolkitEditor,
  };
};

export default useEditToolkit;
