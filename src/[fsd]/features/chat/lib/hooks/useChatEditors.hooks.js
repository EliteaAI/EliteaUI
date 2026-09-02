import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';

import useAgentCreation from '@/hooks/chat/useAgentCreation';
import { useAgentEditorUrlSync } from '@/hooks/chat/useAgentEditorUrlSync';
import useEditAgent from '@/hooks/chat/useEditAgent';
import useEditPipeline from '@/hooks/chat/useEditPipeline';
import useEditToolkit from '@/hooks/chat/useEditToolkit';
import usePipelineCreation from '@/hooks/chat/usePipelineCreation';
import useToolkitCreation from '@/hooks/chat/useToolkitCreation';
import { actions as settingsActions } from '@/slices/settings';

import { buildEntityParticipant } from '../helpers';
import { useAttachmentToolChange } from './useAttachmentToolChange.hooks';
import { useConversationStarters } from './useConversationStarters.hooks';
import { useEditProjectContext } from './useEditProjectContext.hooks';
import { useEditSkill } from './useEditSkill.hooks';
import { useMutuallyExclusiveEditors } from './useMutuallyExclusiveEditors.hooks';

export const useChatEditors = ({
  projectId,
  activeParticipant,
  setActiveParticipant,
  activeParticipantDetails,
  activeConversation,
  onChangeParticipantSettings,
  addNewParticipants,
  onShowCanvasEditor,
  canvasEditorRef,
  onShowArtifactEditor,
  onCloseArtifactEditor,
  refetchParticipantDetails,
  activeVersionName,
  getChatParticipantUniqueId,
  setLocalActiveParticipant,
}) => {
  // Editor-state hooks
  const {
    isEditingAgent,
    editingAgent,
    isCreateMode,
    onShowAgentEditor,
    onShowAgentEditorCreator,
    onAgentEditorCreated,
    onCloseAgentEditor,
    handleAgentSaved,
  } = useEditAgent({ activeParticipant, setActiveParticipant, onChangeParticipantSettings });

  const {
    isEditingToolkit,
    editingToolkit,
    isToolkitCreateMode,
    onShowToolkitEditor,
    onCloseToolkitEditor,
    onToolkitEditorCreated,
    onShowToolkitEditorCreator,
  } = useEditToolkit();

  const {
    isEditingPipeline,
    editingPipeline,
    isPipelineCreateMode,
    onShowPipelineEditor,
    onClosePipelineEditor,
    onPipelineEditorCreated,
    onShowPipelineEditorCreator,
    sizes: pipelineSizes,
    onDragEnd: pipelineOnDragEnd,
    gutterStyle: pipelineGutterStyle,
  } = useEditPipeline();

  const { isEditingSkill, editingSkill, onShowSkillEditor, onCloseSkillEditor } = useEditSkill();

  const { isEditingProjectContext, onShowProjectContextEditor, onCloseProjectContextEditor } =
    useEditProjectContext();

  // Dirty-state and version-change alert state
  const dispatch = useDispatch();
  const [editorIsDirty, setEditorIsDirty] = useState(false);
  const [showVersionChangeAlert, setShowVersionChangeAlert] = useState(false);
  const [pendingVersionChangeCallback, setPendingVersionChangeCallback] = useState(null);

  const handleEditorDirtyStateChange = useCallback(isDirty => {
    setEditorIsDirty(isDirty);
  }, []);

  useEffect(() => {
    dispatch(settingsActions.setBlockNav(editorIsDirty));
  }, [editorIsDirty, dispatch]);

  const handleShowVersionChangeAlert = useCallback(onConfirmCallback => {
    setPendingVersionChangeCallback(() => onConfirmCallback);
    setShowVersionChangeAlert(true);
  }, []);

  // Generated-entity tab state
  const [generatedEditorTabs, setGeneratedEditorTabs] = useState([]);
  const [activeGeneratedTabIndex, setActiveGeneratedTabIndex] = useState(0);
  const [isEditingGeneratedEntities, setIsEditingGeneratedEntities] = useState(false);

  const handleCloseGeneratedEntitiesPanel = useCallback(() => {
    setIsEditingGeneratedEntities(false);
    setGeneratedEditorTabs([]);
    setActiveGeneratedTabIndex(0);
  }, []);

  const handleCloseGeneratedTab = useCallback(entityId => {
    setGeneratedEditorTabs(prev => {
      const next = prev.filter(t => t.entity_id !== entityId);
      if (next.length === 0) {
        setIsEditingGeneratedEntities(false);
        setActiveGeneratedTabIndex(0);
      } else {
        setActiveGeneratedTabIndex(i => Math.min(i, next.length - 1));
      }
      return next;
    });
  }, []);

  const onGeneratedEntityCreated = useCallback(
    ({ entity_type, entity_id, version_id, entity_name, is_mcp }, setAsActive) => {
      const participant = buildEntityParticipant({ entity_id, entity_name, version_id, is_mcp, projectId });
      setGeneratedEditorTabs(prev => {
        if (prev.some(t => t.entity_id === entity_id)) return prev;
        if (prev.length === 0) setActiveGeneratedTabIndex(0);
        if (setAsActive) {
          setActiveGeneratedTabIndex(prev.length);
        }
        return [...prev, { entity_type, entity_id, entity_name, version_id, is_mcp: !!is_mcp, participant }];
      });
      setIsEditingGeneratedEntities(true);
    },
    [projectId],
  );

  // Ancillary hooks
  const { handleAttachmentToolChange } = useAttachmentToolChange({
    activeParticipant,
    refetchParticipantDetails,
  });

  const {
    displayedConversationStarters,
    handleEditorConversationStartersChange,
    resetEditorConversationStarters,
  } = useConversationStarters({
    activeParticipant,
    activeParticipantDetails,
    editingAgent,
    editingPipeline,
  });

  // URL sync for agent/pipeline editors
  const { markAgentEditorClosed, markPipelineEditorClosed } = useAgentEditorUrlSync({
    editingAgent,
    editingPipeline,
    onShowAgentEditor,
    onShowPipelineEditor,
    activeConversation,
  });

  // Wrap close handlers to mark explicit close for URL sync
  const handleCloseAgentEditorWithUrlSync = useCallback(() => {
    markAgentEditorClosed();
    resetEditorConversationStarters();
    onCloseAgentEditor();
  }, [markAgentEditorClosed, onCloseAgentEditor, resetEditorConversationStarters]);

  const handleClosePipelineEditorWithUrlSync = useCallback(() => {
    markPipelineEditorClosed();
    resetEditorConversationStarters();
    onClosePipelineEditor();
  }, [markPipelineEditorClosed, onClosePipelineEditor, resetEditorConversationStarters]);

  // Per-conversation LLM override from AgentEditor
  const handleConversationLlmOverride = useCallback(
    llmSettings => {
      if (!editingAgent) return;
      const updatedParticipant = {
        ...editingAgent,
        entity_settings: {
          ...(editingAgent.entity_settings || {}),
          llm_settings: llmSettings ?? undefined,
        },
      };
      onChangeParticipantSettings(updatedParticipant, true);
    },
    [editingAgent, onChangeParticipantSettings],
  );

  // Version-change confirm / cancel
  const handleVersionChangeConfirm = useCallback(() => {
    if (isEditingAgent) handleCloseAgentEditorWithUrlSync();
    if (isEditingPipeline) handleClosePipelineEditorWithUrlSync();
    if (pendingVersionChangeCallback) pendingVersionChangeCallback();
    setShowVersionChangeAlert(false);
    setPendingVersionChangeCallback(null);
    setEditorIsDirty(false);
  }, [
    isEditingAgent,
    isEditingPipeline,
    handleCloseAgentEditorWithUrlSync,
    handleClosePipelineEditorWithUrlSync,
    pendingVersionChangeCallback,
  ]);

  const handleVersionChangeCancel = useCallback(() => {
    setShowVersionChangeAlert(false);
    setPendingVersionChangeCallback(null);
  }, []);

  // Mutually exclusive editors orchestration
  const {
    openEditingAlert,
    onCloseEditorAlert,
    onConfirmCloseEditor,
    onEditCanvas,
    onEditAgent,
    onEditToolkit,
    onEditPipeline,
    onEditArtifact,
    onCreateAgent,
    onCreatePipeline,
    onCreateToolkit,
    onEditSkill,
    onEditProjectContext,
  } = useMutuallyExclusiveEditors({
    onCloseAgentEditor: handleCloseAgentEditorWithUrlSync,
    onShowAgentEditor,
    onShowToolkitEditor,
    onCloseToolkitEditor,
    onShowPipelineEditor,
    onClosePipelineEditor: handleClosePipelineEditorWithUrlSync,
    onShowCanvasEditor,
    canvasEditorRef,
    onShowArtifactEditor,
    onCloseArtifactEditor,
    onShowAgentEditorCreator,
    onShowToolkitEditorCreator,
    onShowPipelineEditorCreator,
    onShowSkillEditor,
    onCloseSkillEditor,
    onShowProjectContextEditor,
    onCloseProjectContextEditor,
    isEditingGeneratedEntities,
    onCloseGeneratedEntitiesPanel: handleCloseGeneratedEntitiesPanel,
  });

  const handleSetActiveParticipant = useCallback(
    participant => {
      setActiveParticipant(participant);
      if (activeConversation?.id && getChatParticipantUniqueId && setLocalActiveParticipant) {
        setLocalActiveParticipant(activeConversation.id, getChatParticipantUniqueId(participant));
      }
    },
    [setActiveParticipant, activeConversation?.id, getChatParticipantUniqueId, setLocalActiveParticipant],
  );

  // Creation hooks
  const { onAgentCreated } = useAgentCreation({
    onAgentEditorCreated,
    addNewParticipants,
    onSetActiveParticipant: handleSetActiveParticipant,
  });

  const { onToolkitCreated } = useToolkitCreation({
    onToolkitEditorCreated,
    addNewParticipants,
  });

  const { onPipelineCreated } = usePipelineCreation({
    onPipelineEditorCreated,
    addNewParticipants,
    onSetActiveParticipant: handleSetActiveParticipant,
  });

  // isEditorOpen: used by useCloseEditorAlert in NewChat
  const isEditorOpen = useMemo(
    () =>
      !!(
        isEditingAgent ||
        isEditingPipeline ||
        (isEditingToolkit && !isToolkitCreateMode) ||
        isEditingSkill ||
        isEditingProjectContext
      ),
    [
      isEditingAgent,
      isEditingPipeline,
      isEditingToolkit,
      isToolkitCreateMode,
      isEditingSkill,
      isEditingProjectContext,
    ],
  );

  // Composite "any panel open" flag (includes generated entities)
  const isAnyEditorPanelOpen = useMemo(
    () =>
      isEditingAgent ||
      isEditingToolkit ||
      isEditingPipeline ||
      isEditingSkill ||
      isEditingProjectContext ||
      isEditingGeneratedEntities,
    [
      isEditingAgent,
      isEditingToolkit,
      isEditingPipeline,
      isEditingSkill,
      isEditingProjectContext,
      isEditingGeneratedEntities,
    ],
  );

  return {
    // Editor open/close (guarded via useMutuallyExclusiveEditors)
    onEditAgent,
    onEditToolkit,
    onEditPipeline,
    onEditSkill,
    onEditProjectContext,
    onEditCanvas,
    onEditArtifact,
    onCreateAgent,
    onCreatePipeline,
    onCreateToolkit,

    // Direct close handlers
    handleCloseAgentEditor: handleCloseAgentEditorWithUrlSync,
    handleClosePipelineEditor: handleClosePipelineEditorWithUrlSync,
    onCloseToolkitEditor,
    onCloseSkillEditor,
    onCloseProjectContextEditor,

    // Editor state
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingSkill,
    isEditingProjectContext,
    isToolkitCreateMode,
    isCreateMode,
    isPipelineCreateMode,
    editingAgent,
    editingToolkit,
    editingPipeline,
    editingSkill,

    // Pipeline split props
    pipelineSizes,
    pipelineOnDragEnd,
    pipelineGutterStyle,

    // Creation callbacks
    onAgentCreated,
    onPipelineCreated,
    onToolkitCreated,
    handleAgentSaved,

    // Editor callbacks
    handleEditorDirtyStateChange,
    handleShowVersionChangeAlert,
    handleAttachmentToolChange,
    handleEditorConversationStartersChange,
    handleConversationLlmOverride,

    // Alert state
    openEditingAlert,
    onCloseEditorAlert,
    onConfirmCloseEditor,
    showVersionChangeAlert,
    handleVersionChangeConfirm,
    handleVersionChangeCancel,
    editorIsDirty,

    // Conversation starters
    displayedConversationStarters,
    resetEditorConversationStarters,

    // Version name
    activeVersionName,

    // Generated entities
    generatedEditorTabs,
    activeGeneratedTabIndex,
    setActiveGeneratedTabIndex,
    isEditingGeneratedEntities,
    onGeneratedEntityCreated,
    handleCloseGeneratedTab,
    handleCloseGeneratedEntitiesPanel,

    // Derived flags
    isEditorOpen,
    isAnyEditorPanelOpen,
  };
};
