import { Suspense, memo } from 'react';

import { FilePreviewCanvas } from '@/[fsd]/features/artifacts/ui';
import { ChunkHelpers } from '@/[fsd]/shared/lib/helpers';
import { ChatParticipantType } from '@/common/constants';
import AlertDialog from '@/components/AlertDialog';

import EditorLoading from './EditorLoading';

const AgentEditor = ChunkHelpers.lazyWithRetry(() => import('./AgentEditor'));
const CanvasEditor = ChunkHelpers.lazyWithRetry(() => import('./CanvasEditor'));
const GeneratedEntityEditorPanel = ChunkHelpers.lazyWithRetry(() => import('./GeneratedEntityEditorPanel'));
const PipelineEditor = ChunkHelpers.lazyWithRetry(() => import('./PipelineEditor'));
const ProjectContextEditor = ChunkHelpers.lazyWithRetry(() => import('./ProjectContextEditor'));
const SkillEditor = ChunkHelpers.lazyWithRetry(() => import('./SkillEditor'));
const ToolkitEditor = ChunkHelpers.lazyWithRetry(() => import('./ToolkitEditor'));

const ChatEditorPanel = memo(props => {
  const {
    // Agent
    isEditingAgent,
    editingAgent,
    isCreateMode,
    onCloseAgentEditor,
    onAgentCreated,
    handleAgentSaved,
    handleAttachmentToolChange,
    handleEditorDirtyStateChange,
    handleEditorConversationStartersChange,
    handleConversationLlmOverride,
    activeVersionName,
    activeParticipant,
    // Toolkit
    isEditingToolkit,
    editingToolkit,
    onCloseToolkitEditor,
    onToolkitCreated,
    onChangeParticipantSettings,
    // Pipeline
    isEditingPipeline,
    editingPipeline,
    isPipelineCreateMode,
    pipelineEditorRef,
    handleClosePipelineEditor,
    onPipelineCreated,
    onStopRun,
    // Canvas
    selectedCodeBlockInfo,
    canvasEditorRef,
    onCloseCanvasEditor,
    interaction_uuid,
    conversation_uuid,
    // Artifact
    previewingArtifact,
    projectId,
    onCloseArtifactEditor,
    // Skill
    isEditingSkill,
    editingSkill,
    onCloseSkillEditor,
    // Project context
    isEditingProjectContext,
    onCloseProjectContextEditor,
    // Generated entities
    isEditingGeneratedEntities,
    generatedEditorTabs,
    activeGeneratedTabIndex,
    onTabChange,
    onCloseTab,
    // Alerts — editing conflict
    openEditingAlert,
    onCloseEditorAlert,
    onConfirmCloseEditor,
    // Alert — version change
    showVersionChangeAlert,
    handleVersionChangeConfirm,
    handleVersionChangeCancel,
    // Alert — close editor while streaming/navigating (from useCloseEditorAlert)
    openEditorAlert,
    alertContent,
    onCancelOperation,
    onConfirmOperation,
  } = props;

  return (
    <>
      {isEditingAgent && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <AgentEditor
            agent={editingAgent}
            versionName={activeVersionName}
            onCloseAgentEditor={onCloseAgentEditor}
            onAgentCreated={onAgentCreated}
            onAgentSaved={handleAgentSaved}
            onAttachmentToolChange={handleAttachmentToolChange}
            isVisible={isEditingAgent}
            isCreateMode={isCreateMode}
            onAgentDirtyStateChange={handleEditorDirtyStateChange}
            onConversationStartersChange={handleEditorConversationStartersChange}
            onConversationLlmOverride={handleConversationLlmOverride}
            activeAgentId={
              activeParticipant?.entity_name === ChatParticipantType.Applications
                ? activeParticipant.entity_meta?.id
                : undefined
            }
          />
        </Suspense>
      )}

      {isEditingToolkit && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <ToolkitEditor
            toolkit={editingToolkit}
            onCloseToolkitEditor={onCloseToolkitEditor}
            onToolkitCreated={onToolkitCreated}
            onToolkitUpdated={onChangeParticipantSettings}
            isVisible={isEditingToolkit}
          />
        </Suspense>
      )}

      {isEditingPipeline && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <PipelineEditor
            ref={pipelineEditorRef}
            pipeline={editingPipeline}
            onClosePipelineEditor={handleClosePipelineEditor}
            onPipelineCreated={onPipelineCreated}
            onPipelineSaved={onChangeParticipantSettings}
            isVisible={isEditingPipeline}
            isCreateMode={isPipelineCreateMode}
            onPipelineDirtyStateChange={handleEditorDirtyStateChange}
            onConversationStartersChange={handleEditorConversationStartersChange}
            activePipelineId={
              activeParticipant?.entity_name === ChatParticipantType.Pipelines ||
              activeParticipant?.entity_name === ChatParticipantType.Applications
                ? activeParticipant.entity_meta?.id
                : undefined
            }
            activeParticipantId={activeParticipant?.id}
            stopRunOnNodeStop={onStopRun}
            onAttachmentToolChange={handleAttachmentToolChange}
          />
        </Suspense>
      )}

      {selectedCodeBlockInfo && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <CanvasEditor
            ref={canvasEditorRef}
            selectedCodeBlockInfo={selectedCodeBlockInfo}
            onCloseCanvasEditor={onCloseCanvasEditor}
            interaction_uuid={interaction_uuid}
            conversation_uuid={conversation_uuid}
            key={selectedCodeBlockInfo?.blockId}
          />
        </Suspense>
      )}

      {previewingArtifact && (
        <FilePreviewCanvas
          key={`${previewingArtifact.name}-${previewingArtifact.bucket}`}
          file={previewingArtifact}
          projectId={projectId}
          bucket={previewingArtifact.bucket}
          onClose={onCloseArtifactEditor}
        />
      )}

      {isEditingSkill && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <SkillEditor
            skill={editingSkill}
            onCloseSkillEditor={onCloseSkillEditor}
            isVisible={isEditingSkill}
          />
        </Suspense>
      )}

      {isEditingProjectContext && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <ProjectContextEditor
            onCloseProjectContextEditor={onCloseProjectContextEditor}
            isVisible={isEditingProjectContext}
          />
        </Suspense>
      )}

      {isEditingGeneratedEntities && (
        <Suspense fallback={<EditorLoading fullCover />}>
          <GeneratedEntityEditorPanel
            tabs={generatedEditorTabs}
            activeIndex={activeGeneratedTabIndex}
            onTabChange={onTabChange}
            onCloseTab={onCloseTab}
            onAgentCreated={onAgentCreated}
            onAgentSaved={handleAgentSaved}
            onAttachmentToolChange={handleAttachmentToolChange}
            onAgentDirtyStateChange={handleEditorDirtyStateChange}
            onConversationStartersChange={handleEditorConversationStartersChange}
            onPipelineCreated={onPipelineCreated}
            onPipelineSaved={onChangeParticipantSettings}
            onPipelineDirtyStateChange={handleEditorDirtyStateChange}
          />
        </Suspense>
      )}

      {/* Mutually-exclusive editor conflict alert */}
      <AlertDialog
        title="Warning"
        alertContent="You are editing now. Do you want to discard current changes and continue?"
        open={openEditingAlert}
        alarm
        onClose={onCloseEditorAlert}
        onCancel={onCloseEditorAlert}
        onConfirm={onConfirmCloseEditor}
      />

      {/* Close-editor-while-navigating alert */}
      <AlertDialog
        title="Warning"
        multiline
        alertContent={alertContent}
        open={openEditorAlert}
        alarm
        onClose={onCancelOperation}
        onCancel={onCancelOperation}
        onConfirm={onConfirmOperation}
      />

      {/* Version change unsaved-edits alert */}
      <AlertDialog
        title="Warning"
        alertContent="You are editing now. Do you want to discard current changes and continue?"
        open={showVersionChangeAlert}
        alarm
        onClose={handleVersionChangeCancel}
        onCancel={handleVersionChangeCancel}
        onConfirm={handleVersionChangeConfirm}
        confirmButtonText="Discard Changes"
      />
    </>
  );
});

ChatEditorPanel.displayName = 'ChatEditorPanel';

export default ChatEditorPanel;
