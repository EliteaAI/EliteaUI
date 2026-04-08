import { useCallback, useMemo, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

// --- Custom hook for mutual exclusivity between AgentEditor, ToolkitEditor, PipelineEditor, CanvasEditor, and ArtifactEditor ---
export function useMutuallyExclusiveEditors({
  //AgentEditor
  onShowAgentEditor,
  onCloseAgentEditor,
  //ToolkitEditor
  onShowToolkitEditor,
  onCloseToolkitEditor,
  //PipelineEditor
  onShowPipelineEditor,
  onClosePipelineEditor,
  //CanvasEditor
  onShowCanvasEditor,
  canvasEditorRef,
  //ArtifactEditor
  onShowArtifactEditor,
  onCloseArtifactEditor,
  // Agent creation
  onShowAgentEditorCreator,
  // Toolkit creation
  onShowToolkitEditorCreator,
  // Pipeline creation
  onShowPipelineEditorCreator,
}) {
  const [openEditingAlert, setEditingAlert] = useState(false);
  const [newEditingBlockInfo, setNewEditingBlockInfo] = useState();
  const {
    isEditingCanvas,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingArtifact,
    isAnyEditorOpen,
  } = useNavBlocker();

  // Enhanced closeHandlers with editor state mapping
  const closeHandlers = useMemo(
    () => ({
      isEditingCanvas: () => {
        canvasEditorRef.current?.save?.();
      },
      isEditingAgent: () => {
        onCloseAgentEditor();
      },
      isEditingToolkit: () => {
        onCloseToolkitEditor();
      },
      isEditingPipeline: () => {
        onClosePipelineEditor();
      },
      isEditingArtifact: () => {
        onCloseArtifactEditor();
      },
      unknown: null,
    }),
    [canvasEditorRef, onCloseAgentEditor, onCloseToolkitEditor, onClosePipelineEditor, onCloseArtifactEditor],
  );

  // Enhanced open handlers for new editing actions
  const openHandlers = useMemo(
    () => ({
      forAgentCreation: () => {
        onShowAgentEditorCreator();
      },
      forCanvas: information => {
        onShowCanvasEditor(information);
      },
      forAgent: information => {
        onShowAgentEditor(information);
      },
      forToolkit: information => {
        onShowToolkitEditor(information);
      },
      forToolkitCreation: information => {
        onShowToolkitEditorCreator(information?.isMCP);
      },
      forPipeline: information => {
        onShowPipelineEditor(information);
      },
      forPipelineCreation: () => {
        onShowPipelineEditorCreator();
      },
      forArtifact: information => {
        onShowArtifactEditor(information);
      },
    }),
    [
      onShowAgentEditorCreator,
      onShowCanvasEditor,
      onShowAgentEditor,
      onShowToolkitEditor,
      onShowToolkitEditorCreator,
      onShowPipelineEditor,
      onShowPipelineEditorCreator,
      onShowArtifactEditor,
    ],
  );

  // Get current editor state for determining which close handler to use
  const getCurrentEditorState = useCallback(() => {
    if (isEditingCanvas) return 'isEditingCanvas';
    if (isEditingAgent) return 'isEditingAgent';
    if (isEditingToolkit) return 'isEditingToolkit';
    if (isEditingPipeline) return 'isEditingPipeline';
    if (isEditingArtifact) return 'isEditingArtifact';
    return 'unknown';
  }, [isEditingCanvas, isEditingAgent, isEditingToolkit, isEditingPipeline, isEditingArtifact]);

  const onEditCanvas = useCallback(
    message =>
      ({
        rawData,
        codeBlock,
        language,
        isBlock,
        startPos,
        endPos,
        canvasId,
        messageItemId,
        blockId,
        viewOnly,
      }) => {
        if (isAnyEditorOpen) {
          setEditingAlert(true);
          setNewEditingBlockInfo({
            forCanvas: true,
            information: {
              message,
              rawData,
              codeBlock,
              language,
              isBlock,
              startPos,
              endPos,
              canvasId,
              messageItemId,
              blockId,
              viewOnly,
            },
          });
        } else {
          onShowCanvasEditor({
            message,
            rawData,
            codeBlock,
            language,
            isBlock,
            startPos,
            endPos,
            canvasId,
            messageItemId,
            blockId,
            viewOnly,
          });
        }
      },
    [isAnyEditorOpen, onShowCanvasEditor],
  );

  const onCloseEditorAlert = useCallback(() => {
    setEditingAlert(false);
    setNewEditingBlockInfo();
  }, []);

  const onEditToolkit = useCallback(
    theSelectedParticipant => {
      if (isAnyEditorOpen) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forToolkit: true, information: theSelectedParticipant });
      } else {
        onShowToolkitEditor(theSelectedParticipant);
      }
    },
    [isAnyEditorOpen, onShowToolkitEditor],
  );

  const onConfirmCloseEditor = useCallback(() => {
    setEditingAlert(false);

    // Use closeHandlers instead of if/else chain
    closeHandlers[getCurrentEditorState()]?.();

    // Handle opening new editor after closing current one
    setTimeout(() => {
      if (!newEditingBlockInfo) return;

      const { information } = newEditingBlockInfo;

      // Find the appropriate open handler and execute it
      openHandlers[Object.keys(openHandlers).find(key => newEditingBlockInfo[key])]?.(information);

      setNewEditingBlockInfo();
    }, 0);
  }, [getCurrentEditorState, closeHandlers, openHandlers, newEditingBlockInfo]);

  const onEditAgent = useCallback(
    theSelectedParticipant => {
      if (isAnyEditorOpen) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forAgent: true, information: theSelectedParticipant });
      } else {
        onShowAgentEditor(theSelectedParticipant);
      }
    },
    [isAnyEditorOpen, onShowAgentEditor],
  );

  // Direct agent creation that checks for editor conflicts
  const onCreateAgent = useCallback(() => {
    // Check if any editor is currently open
    if (isAnyEditorOpen) {
      // Show warning dialog
      setEditingAlert(true);
      setNewEditingBlockInfo({ forAgentCreation: true });
    } else {
      // No editors open, proceed directly with agent creation
      onShowAgentEditorCreator();
    }
  }, [isAnyEditorOpen, onShowAgentEditorCreator]);

  // Direct toolkit creation that checks for editor conflicts
  const onCreateToolkit = useCallback(
    (isMCP = false) => {
      // Check if any editor is currently open
      if (isAnyEditorOpen) {
        // Show warning dialog
        setEditingAlert(true);
        setNewEditingBlockInfo({ forToolkitCreation: true, information: { isMCP } });
      } else {
        // No editors open, proceed directly with toolkit creation
        onShowToolkitEditorCreator(isMCP);
      }
    },
    [isAnyEditorOpen, onShowToolkitEditorCreator],
  );

  const onEditPipeline = useCallback(
    theSelectedParticipant => {
      if (isAnyEditorOpen) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forPipeline: true, information: theSelectedParticipant });
      } else {
        onShowPipelineEditor(theSelectedParticipant);
      }
    },
    [isAnyEditorOpen, onShowPipelineEditor],
  );

  // Direct pipeline creation that checks for editor conflicts
  const onCreatePipeline = useCallback(() => {
    // Check if any editor is currently open
    if (isAnyEditorOpen) {
      // Show warning dialog
      setEditingAlert(true);
      setNewEditingBlockInfo({ forPipelineCreation: true });
    } else {
      // No editors open, proceed directly with pipeline creation
      onShowPipelineEditorCreator();
    }
  }, [isAnyEditorOpen, onShowPipelineEditorCreator]);

  const onEditArtifact = useCallback(
    artifactData => {
      if (isAnyEditorOpen) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forArtifact: true, information: artifactData });
      } else {
        onShowArtifactEditor(artifactData);
      }
    },
    [isAnyEditorOpen, onShowArtifactEditor],
  );

  return {
    openEditingAlert,
    onCloseEditorAlert,
    onConfirmCloseEditor,
    onEditCanvas,
    onEditAgent,
    onEditToolkit,
    onEditPipeline,
    onEditArtifact,
    // Agent creation functionality
    onCreateAgent,
    // Toolkit creation functionality
    onCreateToolkit,
    // Pipeline creation functionality
    onCreatePipeline,
  };
}
