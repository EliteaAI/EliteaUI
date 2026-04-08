import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, CircularProgress, Typography } from '@mui/material';

import RunHistoryContainer from '@/[fsd]/entities/run-history/ui/RunHistoryContainer';
import { useApplicationChat } from '@/[fsd]/features/agent/lib/hooks';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { ChatButton } from '@/[fsd]/features/chat/ui';
import { useShowRunHistoryFromUrl } from '@/[fsd]/shared/lib/hooks';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { ContextBudgetUI } from '@/[fsd]/widgets/ContextBudget';
import { WELCOME_MESSAGE_ID } from '@/common/constants';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';
import DirtyDetector from '@/components/Formik/DirtyDetector';
import useAgentMCPToolsStatusMonitor from '@/hooks/application/useAgentMCPToolsStatusMonitor';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useViewMode from '@/hooks/useViewMode';
import {
  ContentContainer,
  LeftGridItem,
  RightGridItem,
  StyledGridContainer,
} from '@/pages/Common/Components/StyledComponents';
import ChatBox from '@/pages/NewChat/ChatBox';

import ApplicationConfigurationForm from './ApplicationConfigurationForm';

const ConfigurationRightContent = memo(props => {
  const {
    settings,
    applicationId,
    applicationName,
    applicationVersionDetails,
    projectId,
    isFullScreenChat,
    setIsFullScreenChat,
    onSetLLMSettings,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
    restoredConversationID,
    onRestoreConversationComplete,
    onShowHistory,
  } = props;

  const boxRef = useRef();

  const {
    activeConversation,
    activeParticipant,
    isStreaming,
    isLoadingConversation,
    setChatHistory,
    setActiveConversation,
    onDeleteAllMessages,
    onDeleteMessage,
    onChangeParticipantSettings,
    onSetLLMSettings: hookOnSetLLMSettings,
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
  } = useApplicationChat({
    applicationId,
    applicationName,
    applicationVersionDetails,
    projectId,
    restoredConversationID,
    onRestoreConversationComplete,
    setFieldValue: (path, value) => {
      if (path.includes('llm_settings') && onSetLLMSettings) {
        const key = path.split('.').pop();
        onSetLLMSettings({ [key]: value });
      }
    },
  });

  const finalOnSetLLMSettings = onSetLLMSettings || hookOnSetLLMSettings;
  const { uploadAttachments, isUploading: isUploadingAttachments, uploadProgress } = useUploadAttachments();

  const enhancedSettings = useMemo(
    () => ({
      ...settings,
      activeParticipant,
      activeConversation,
      setActiveConversation,
      activeParticipantDetails,
      isStreaming,
      setChatHistory,
      onDeleteMessage,
      onDeleteAllMessages,
      onChangeParticipantSettings,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onStopStreaming,
      enableMentions: false,
      isLoadingConversation,
      isAgentsPage: true,
      onSetLLMSettings: finalOnSetLLMSettings,
      showWebhookSecret: false,
      onSend,
      attachments,
      disableAttachments,
      onAttachFiles,
      onDeleteAttachment,
      onClearAttachments,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    }),
    [
      settings,
      activeParticipant,
      activeConversation,
      setActiveConversation,
      activeParticipantDetails,
      isStreaming,
      setChatHistory,
      onDeleteMessage,
      onDeleteAllMessages,
      onChangeParticipantSettings,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onStopStreaming,
      isLoadingConversation,
      finalOnSetLLMSettings,
      onSend,
      attachments,
      disableAttachments,
      onAttachFiles,
      onDeleteAttachment,
      onClearAttachments,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    ],
  );

  const shouldDisableClear =
    !activeConversation?.chat_history?.length ||
    isStreaming ||
    (activeConversation?.chat_history?.length === 1 &&
      activeConversation.chat_history[0].id === WELCOME_MESSAGE_ID);

  const styles = useMemo(() => configurationRightContentStyles(isFullScreenChat), [isFullScreenChat]);

  return (
    <ContentContainer sx={styles.container}>
      <Box sx={styles.mainContainer}>
        <Box sx={styles.topBarContainer}>
          {activeConversation?.id && (
            <ContextBudgetUI.ContextBudgetInfo
              conversationId={activeConversation?.id}
              compact
              contextStrategy={activeConversation?.meta?.context_strategy || {}}
              setActiveConversation={setActiveConversation}
              conversationInstructions={activeConversation?.instructions}
            />
          )}
          <Box sx={styles.controlsContainer}>
            <FullScreenToggle
              isFullScreenChat={isFullScreenChat}
              setIsFullScreenChat={setIsFullScreenChat}
            />
            <ChatButton.ClearChatButton
              disabled={shouldDisableClear}
              onClear={() => boxRef.current?.onClear()}
            />
            {onShowHistory && <ViewRunHistoryButton onShowHistory={onShowHistory} />}
          </Box>
        </Box>

        {activeConversation && activeParticipant && (
          <ChatBox
            {...enhancedSettings}
            ref={boxRef}
            inputPlaceholder="Type your message."
          />
        )}

        {(!activeConversation || !activeParticipant) && (
          <Box sx={styles.initializingContainer}>
            <Typography
              variant="body1"
              color="text.secondary"
            >
              Initializing chat...
            </Typography>
          </Box>
        )}
      </Box>
    </ContentContainer>
  );
});

ConfigurationRightContent.displayName = 'ConfigurationRightContent';

const ConfigurationTab = memo(props => {
  const { isFetching, applicationId, setDirty, unsavedLLMSettings, setUnsavedLLMSettings, isError } = props;

  const [restoredConversationID, setRestoredConversationID] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullScreenChat, setIsFullScreenChat] = useState(false);
  useShowRunHistoryFromUrl({ setShowHistory });

  const viewMode = useViewMode();
  const projectId = useSelectedProjectId();
  const { values: { version_details = {}, id, name, versions } = {}, setFieldValue } = useFormikContext();

  useAgentMCPToolsStatusMonitor();
  const lgGridColumns = useMemo(() => (isFullScreenChat ? 12 : 6), [isFullScreenChat]);

  const memoizedLlmSettings = useMemo(
    () => ({
      model_name: version_details?.llm_settings?.model_name,
      model_project_id: version_details?.llm_settings?.model_project_id,
      temperature: version_details?.llm_settings?.temperature,
      max_tokens: version_details?.llm_settings?.max_tokens,
      reasoning_effort: version_details?.llm_settings?.reasoning_effort,
    }),
    [version_details?.llm_settings],
  );

  // Chat settings like RunTab
  const settings = useMemo(
    () => ({
      conversationStarters: version_details?.conversation_starters || [],
      existingToolkitIds: version_details?.tools?.filter(t => t.type === 'artifact').map(t => t.id) || [],
      llmSettings: memoizedLlmSettings,
    }),
    [version_details, memoizedLlmSettings],
  );

  const handleUpdateAgentSettings = useCallback(
    newLlmSettings => {
      setFieldValue('version_details.llm_settings', {
        ...version_details?.llm_settings,
        ...newLlmSettings,
      });
    },
    [setFieldValue, version_details?.llm_settings],
  );

  const handleSetLLMSettings = useCallback(
    newSettings => {
      Object.entries(newSettings).forEach(([key, value]) => {
        setFieldValue(`version_details.llm_settings.${key}`, value);
      });
    },
    [setFieldValue],
  );

  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const handleRestoreConversation = useCallback(selectedId => {
    setRestoredConversationID(selectedId);
    setShowHistory(false);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const handleRestoreConversationComplete = useCallback(() => {
    setRestoredConversationID(null);
  }, []);

  const styles = useMemo(() => configurationTabStyles(isFullScreenChat), [isFullScreenChat]);

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
          versions={versions ?? []}
          source={ParticipantEntityTypes.Agent}
          handleRestoreConversation={handleRestoreConversation}
          onClose={handleCloseHistory}
        />
      )}
      {!showHistory && (
        <StyledGridContainer
          sx={styles.gridContainer}
          columnSpacing="32px"
          container
        >
          <LeftGridItem
            size={{ xs: 12, lg: lgGridColumns }}
            sx={styles.leftGridItem}
            hidden={isFullScreenChat}
          >
            <ContentContainer height="100%">
              <ApplicationConfigurationForm
                applicationId={applicationId}
                viewMode={viewMode}
              />
            </ContentContainer>
          </LeftGridItem>
          <RightGridItem
            size={{ xs: 12, lg: lgGridColumns }}
            sx={styles.rightGridItem}
          >
            <ConfigurationRightContent
              settings={settings}
              applicationId={id || applicationId}
              applicationName={name}
              applicationVersionDetails={version_details}
              projectId={projectId}
              isFullScreenChat={isFullScreenChat}
              setIsFullScreenChat={setIsFullScreenChat}
              onUpdateAgentSettings={handleUpdateAgentSettings}
              onSetLLMSettings={handleSetLLMSettings}
              unsavedLLMSettings={unsavedLLMSettings}
              setUnsavedLLMSettings={setUnsavedLLMSettings}
              restoredConversationID={restoredConversationID}
              onRestoreConversationComplete={handleRestoreConversationComplete}
              onShowHistory={applicationId ? handleShowHistory : undefined}
            />
          </RightGridItem>
        </StyledGridContainer>
      )}
    </>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';

/** @type {MuiSx} */
const configurationRightContentStyles = isFullScreenChat => ({
  container: {
    height: isFullScreenChat ? 'calc(100vh - 6.5625rem)' : '100% !important',
  },
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.75rem',
  },
  topBarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    width: '100%',
  },
  controlsContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  icon: {
    width: '.875rem',
    height: '.875rem',
  },
  initializingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '12.5rem',
  },
});

/** @type {MuiSx} */
const configurationTabStyles = () => ({
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  gridContainer: {
    paddingBottom: '0.75rem',
    paddingTop: '0.75rem',
    paddingRight: '1.5rem',
    paddingLeft: '1.5rem',
    height: '100%',
  },
  leftGridItem: {
    height: '100%',
    overflowY: 'scroll',
  },
  rightGridItem: {
    height: '100%',
  },
});

export default ConfigurationTab;
