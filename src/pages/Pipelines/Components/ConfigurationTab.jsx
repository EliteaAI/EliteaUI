import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import Split from 'react-split';

import { Box, CircularProgress, Typography } from '@mui/material';

import RunHistoryContainer from '@/[fsd]/entities/run-history/ui/RunHistoryContainer';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { usePipelineChat } from '@/[fsd]/features/pipelines/lib/hooks';
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { useShowRunHistoryFromUrl } from '@/[fsd]/shared/lib/hooks';
import DirtyDetector from '@/components/Formik/DirtyDetector';
import useAgentMCPToolsStatusMonitor from '@/hooks/application/useAgentMCPToolsStatusMonitor';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ChatPanel from './ChatPanel';
import EditorPanel from './EditorPanel';
import GeneralFormPanel from './GeneralFormPanel';

const ConfigurationTab = memo(props => {
  const {
    isFetching,
    isError,
    applicationId,
    setDirty,
    setYamlDirty,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
  } = props;
  const [restoredConversationID, setRestoredConversationID] = useState(null);
  const [isGeneralPaneCollapsed, setIsGeneralPaneCollapsed] = useState(false);
  const [isChatPaneCollapsed, setIsChatPaneCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sizes, setSizes] = useState([98, 2]);
  useShowRunHistoryFromUrl({ setShowHistory });

  const chatPanelRef = useRef();
  const editorPanelRef = useRef();

  const { values: formValues } = useFormikContext();
  const projectId = useSelectedProjectId();

  useAgentMCPToolsStatusMonitor();

  const { isSmallWindow } = useIsSmallWindow(() => {
    setTimeout(() => {
      editorPanelRef.current?.fitView?.();
    }, 0);
  });

  const onRestoreConversationComplete = useCallback(() => {
    setRestoredConversationID(null);
    setShowHistory(false);
  }, []);

  const handleRcvAgentEvent = useCallback(event => {
    editorPanelRef.current?.onRcvAgentEvent(event);
  }, []);

  const handleDeleteAllRunNodes = useCallback(() => {
    editorPanelRef.current?.deleteAllRunNodes();
  }, []);

  const handleStopRun = useCallback(() => {
    editorPanelRef.current?.onStopRun();
  }, []);

  const { setFieldValue } = useFormikContext();

  const { llm_settings = {}, tools, id: currentVersionId, type = 'chat' } = formValues?.version_details || {};

  const {
    model_name,
    model_project_id,
    max_tokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    reasoning_effort = DEFAULT_REASONING_EFFORT,
  } = llm_settings;

  const interaction_uuid = useMemo(() => `pipeline_${applicationId}_${Date.now()}`, [applicationId]);

  const memoizedLlmSettings = useMemo(
    () => ({
      model_name: llm_settings?.model_name,
      model_project_id: llm_settings?.model_project_id,
      temperature: llm_settings?.temperature,
      max_tokens: llm_settings?.max_tokens,
      reasoning_effort: llm_settings?.reasoning_effort,
    }),
    [llm_settings],
  );

  const { uploadAttachments, isUploading: isUploadingAttachments, uploadProgress } = useUploadAttachments();

  const {
    activeConversation,
    activeParticipant,
    isLoadingConversation,
    isStreaming,
    setChatHistory,
    setActiveConversation,
    onDeleteMessage,
    onDeleteAllMessages,
    onChangeParticipantSettings,
    onSetLLMSettings,
    onSend,
    onSelectThisParticipant,
    onClearActiveParticipant,
    onStopStreaming,
    activeParticipantDetails,
    attachments,
    disableAttachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  } = usePipelineChat({
    pipelineId: applicationId,
    pipelineName: formValues?.name,
    pipelineVersionDetails: formValues?.version_details,
    projectId,
    setFieldValue,
    currentLLMSettings: {
      model_name,
      model_project_id,
      temperature,
      max_tokens,
      reasoning_effort,
    },
    deleteAllRunNodes: handleDeleteAllRunNodes,
    restoredConversationID,
    onRestoreConversationComplete,
  });

  const { conversation_starters: conversationStarters = [] } = useMemo(
    () => formValues?.version_details || {},
    [formValues?.version_details],
  );

  const settings = useMemo(
    () => ({
      activeConversation,
      activeParticipant,
      setChatHistory,
      isLoadingConversation,
      onDeleteMessage,
      onDeleteAllMessages,
      onSend,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onChangeParticipantSettings,
      isStreaming,
      onStopStreaming,
      llmSettings: memoizedLlmSettings,
      onSetLLMSettings,
      type,
      conversationStarters,
      isFullScreenChat: false,
      isAgentsPage: true,
      tools,
      currentVersionId,
      application_id: applicationId,
      disableChat: !applicationId,
      onStopRun: handleStopRun,
      onRcvAgentEvent: handleRcvAgentEvent,
      deleteAllRunNodes: handleDeleteAllRunNodes,
      interaction_uuid,
      activeParticipantDetails,
      disableAttachments,
      attachments,
      onAttachFiles,
      onDeleteAttachment,
      existingToolkitIds:
        formValues?.version_details?.tools?.filter(t => t.type === 'toolkit').map(t => t.id) || [],
      onClearAttachments,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    }),
    [
      activeConversation,
      activeParticipant,
      setChatHistory,
      isLoadingConversation,
      onDeleteMessage,
      onDeleteAllMessages,
      onSend,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onChangeParticipantSettings,
      isStreaming,
      onStopStreaming,
      onSetLLMSettings,
      type,
      conversationStarters,
      tools,
      currentVersionId,
      applicationId,
      handleStopRun,
      handleRcvAgentEvent,
      handleDeleteAllRunNodes,
      interaction_uuid,
      activeParticipantDetails,
      attachments,
      disableAttachments,
      onAttachFiles,
      onDeleteAttachment,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      formValues?.version_details?.tools,
      onClearAttachments,
      memoizedLlmSettings,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    ],
  );

  const maxWidthOfEditorPane = useMemo(
    () => (isGeneralPaneCollapsed ? 'calc(100% - 3.75rem)' : 'calc(100% - 21.875rem)'),
    [isGeneralPaneCollapsed],
  );

  const styles = useMemo(
    () => configurationTabStyles(isSmallWindow, isChatPaneCollapsed, maxWidthOfEditorPane),
    [isSmallWindow, isChatPaneCollapsed, maxWidthOfEditorPane],
  );

  const handleCollapsedGeneralPane = useCallback(collapsed => {
    setIsGeneralPaneCollapsed(collapsed);
    setTimeout(() => {
      editorPanelRef.current?.fitView?.();
    }, 0);
  }, []);

  const handleCollapsedChatPane = useCallback(collapsed => {
    setIsChatPaneCollapsed(collapsed);
    setTimeout(() => {
      editorPanelRef.current?.fitView?.();
    }, 0);
  }, []);

  const handleStopRunClick = useCallback(() => {
    chatPanelRef.current?.stopRun();
  }, []);

  const handleDragEnd = useCallback(newSizes => setSizes(newSizes), []);

  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const handleRestoreConversation = useCallback(id => {
    setRestoredConversationID(id);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const gutterStyle = useCallback(() => styles.gutterStyle, [styles.gutterStyle]);

  useEffect(() => {
    setSizes(isSmallWindow ? [50, 50] : [98, 2]);
  }, [isSmallWindow]);

  useEffect(() => {
    if (isChatPaneCollapsed) {
      setSizes([98, 2]);
    }
  }, [isChatPaneCollapsed]);

  if (isError) {
    return (
      <Box sx={styles.errorContainer}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Failed to load data! Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  return isFetching ? (
    <Box
      sx={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <CircularProgress />
    </Box>
  ) : (
    <>
      <DirtyDetector setDirty={setDirty} />
      {showHistory && (
        <RunHistoryContainer
          entityId={applicationId}
          versions={formValues?.versions ?? []}
          source={ParticipantEntityTypes.Pipeline}
          handleRestoreConversation={handleRestoreConversation}
          onClose={handleCloseHistory}
        />
      )}
      {!showHistory && (
        <Box sx={styles.mainContainer}>
          <GeneralFormPanel
            applicationId={applicationId}
            onCollapsed={handleCollapsedGeneralPane}
          />
          <Split
            direction={isSmallWindow ? 'vertical' : 'horizontal'}
            style={styles.splitContainer}
            sizes={sizes}
            minSize={28}
            expandToMin={false}
            gutterSize={isChatPaneCollapsed ? 0 : 10}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            onDragEnd={handleDragEnd}
            gutterStyle={gutterStyle}
          >
            <EditorPanel
              setYamlDirty={setYamlDirty}
              ref={editorPanelRef}
              stopRun={handleStopRunClick}
              sx={styles.editorPanel}
            />
            <ChatPanel
              ref={chatPanelRef}
              settings={settings}
              onCollapsed={handleCollapsedChatPane}
              setActiveConversation={setActiveConversation}
              editorPanelRef={editorPanelRef}
              onShowHistory={applicationId ? handleShowHistory : undefined}
            />
          </Split>
        </Box>
      )}
    </>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';

export default ConfigurationTab;

/** @type {MuiSx} */
const configurationTabStyles = (isSmallWindow, isChatPaneCollapsed, maxWidthOfEditorPane) => ({
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  mainContainer: {
    height: 'calc(100vh - 3.8125rem)',
    overflow: 'scroll',
    paddingBottom: '0.75rem',
    paddingTop: '0.75rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    gap: '2rem',
    display: 'flex',
    boxSizing: 'border-box',
    width: '100%',
    flexDirection: isSmallWindow ? 'column' : 'row',
    '& split': {
      display: 'flex',
      flexDirection: 'row',
    },
    '& .gutter': {
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '50%',
      height: isSmallWindow ? undefined : '100%',
      width: isSmallWindow ? '100% !important' : undefined,
      '&.gutter-horizontal': {
        backgroundImage: `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==')`,
        cursor: 'col-resize',
        minWidth: '1.5rem',
      },
      '&.gutter-vertical': {
        minHeight: '1.5rem',
      },
    },
  },
  splitContainer: {
    flex: 1,
    height: isSmallWindow ? 'max-content' : '100%',
    display: 'flex',
    flexDirection: isSmallWindow ? 'column' : 'row',
    maxWidth: isSmallWindow ? '100%' : maxWidthOfEditorPane,
    gap: isSmallWindow ? '0.75rem' : undefined,
  },
  editorPanel: {
    minWidth: isSmallWindow ? '100%' : undefined,
    minHeight: isSmallWindow ? undefined : '100%',
    maxWidth: `calc(100% - ${isChatPaneCollapsed ? '1.75rem' : '21.5625rem'})`,
    marginRight: !isSmallWindow && isChatPaneCollapsed ? '1.5rem' : '0rem',
  },
  gutterStyle: {
    cursor: !isChatPaneCollapsed ? 'col-resize' : 'not-allowed',
    pointerEvents: !isChatPaneCollapsed ? 'auto' : 'none',
    width: !isChatPaneCollapsed ? '1.5rem' : '0rem !important',
    display: isChatPaneCollapsed ? 'none' : 'block',
  },
});
