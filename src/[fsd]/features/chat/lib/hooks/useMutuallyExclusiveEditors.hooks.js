import { useCallback, useMemo, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useMutuallyExclusiveEditors = ({
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
  //SkillEditor
  onShowSkillEditor,
  onCloseSkillEditor,
  //ProjectContextEditor
  onShowProjectContextEditor,
  onCloseProjectContextEditor,
  // Generated entities tab panel (local state, not Redux)
  isEditingGeneratedEntities = false,
  onCloseGeneratedEntitiesPanel,
}) => {
  const [openEditingAlert, setEditingAlert] = useState(false);
  const [newEditingBlockInfo, setNewEditingBlockInfo] = useState();
  const {
    isEditingCanvas,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingArtifact,
    isEditingSkill,
    isEditingProjectContext,
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
      isEditingSkill: () => {
        onCloseSkillEditor();
      },
      isEditingProjectContext: () => {
        onCloseProjectContextEditor();
      },
      isEditingGeneratedEntities: () => {
        onCloseGeneratedEntitiesPanel?.();
      },
      unknown: null,
    }),
    [
      canvasEditorRef,
      onCloseAgentEditor,
      onCloseToolkitEditor,
      onClosePipelineEditor,
      onCloseArtifactEditor,
      onCloseSkillEditor,
      onCloseProjectContextEditor,
      onCloseGeneratedEntitiesPanel,
    ],
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
      forSkill: information => {
        onShowSkillEditor(information);
      },
      forProjectContext: information => {
        onShowProjectContextEditor(information);
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
      onShowSkillEditor,
      onShowProjectContextEditor,
    ],
  );

  // Get current editor state for determining which close handler to use
  const getCurrentEditorState = useCallback(() => {
    if (isEditingCanvas) return 'isEditingCanvas';
    if (isEditingAgent) return 'isEditingAgent';
    if (isEditingToolkit) return 'isEditingToolkit';
    if (isEditingPipeline) return 'isEditingPipeline';
    if (isEditingArtifact) return 'isEditingArtifact';
    if (isEditingSkill) return 'isEditingSkill';
    if (isEditingProjectContext) return 'isEditingProjectContext';
    if (isEditingGeneratedEntities) return 'isEditingGeneratedEntities';
    return 'unknown';
  }, [
    isEditingCanvas,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingArtifact,
    isEditingSkill,
    isEditingProjectContext,
    isEditingGeneratedEntities,
  ]);

  const onEditCanvas = useCallback(
    (
      message,
      { rawData, codeBlock, language, isBlock, startPos, endPos, canvasId, messageItemId, blockId, viewOnly },
    ) => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
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
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowCanvasEditor],
  );

  const onCloseEditorAlert = useCallback(() => {
    setEditingAlert(false);
    setNewEditingBlockInfo();
  }, []);

  const onEditToolkit = useCallback(
    theSelectedParticipant => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forToolkit: true, information: theSelectedParticipant });
      } else {
        onShowToolkitEditor(theSelectedParticipant);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowToolkitEditor],
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
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forAgent: true, information: theSelectedParticipant });
      } else {
        onShowAgentEditor(theSelectedParticipant);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowAgentEditor],
  );

  // Direct agent creation that checks for editor conflicts
  const onCreateAgent = useCallback(() => {
    if (isAnyEditorOpen || isEditingGeneratedEntities) {
      setEditingAlert(true);
      setNewEditingBlockInfo({ forAgentCreation: true });
    } else {
      onShowAgentEditorCreator();
    }
  }, [isAnyEditorOpen, isEditingGeneratedEntities, onShowAgentEditorCreator]);

  // Direct toolkit creation that checks for editor conflicts
  const onCreateToolkit = useCallback(
    (isMCP = false) => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forToolkitCreation: true, information: { isMCP } });
      } else {
        onShowToolkitEditorCreator(isMCP);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowToolkitEditorCreator],
  );

  const onEditPipeline = useCallback(
    theSelectedParticipant => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forPipeline: true, information: theSelectedParticipant });
      } else {
        onShowPipelineEditor(theSelectedParticipant);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowPipelineEditor],
  );

  // Direct pipeline creation that checks for editor conflicts
  const onCreatePipeline = useCallback(() => {
    if (isAnyEditorOpen || isEditingGeneratedEntities) {
      setEditingAlert(true);
      setNewEditingBlockInfo({ forPipelineCreation: true });
    } else {
      onShowPipelineEditorCreator();
    }
  }, [isAnyEditorOpen, isEditingGeneratedEntities, onShowPipelineEditorCreator]);

  const onEditArtifact = useCallback(
    artifactData => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forArtifact: true, information: artifactData });
      } else {
        onShowArtifactEditor(artifactData);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowArtifactEditor],
  );

  const onEditSkill = useCallback(
    theSelectedSkill => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forSkill: true, information: theSelectedSkill });
      } else {
        onShowSkillEditor(theSelectedSkill);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowSkillEditor],
  );

  const onEditProjectContext = useCallback(
    theSelectedProjectContext => {
      if (isAnyEditorOpen || isEditingGeneratedEntities) {
        setEditingAlert(true);
        setNewEditingBlockInfo({ forProjectContext: true, information: theSelectedProjectContext });
      } else {
        onShowProjectContextEditor(theSelectedProjectContext);
      }
    },
    [isAnyEditorOpen, isEditingGeneratedEntities, onShowProjectContextEditor],
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
    onCreateAgent,
    onCreateToolkit,
    onCreatePipeline,
    onEditSkill,
    onEditProjectContext,
  };
};
