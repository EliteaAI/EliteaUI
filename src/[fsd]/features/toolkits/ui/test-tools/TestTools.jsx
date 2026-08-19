import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Grid, Typography } from '@mui/material';

import { ChatMessageList } from '@/[fsd]/features/chat';
import { McpAuthModal } from '@/[fsd]/features/mcp';
import { getMockToolkitIndexConversation } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { useToolkitTestRunner } from '@/[fsd]/features/toolkits/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';

import TestToolSettings from './TestToolSettings';
import TestToolsEmptyState from './TestToolsEmptyState';

const { PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const TestTools = memo(props => {
  const { toolkitId } = props;
  const { values: formValues } = useFormikContext();

  const styles = testToolsStyles();

  const {
    selectedTool,
    onChangeTool,
    toolInputVariables,
    onChangeInputVariables,
    selectedToolSchema,
    isValidForm,
    chatHistory,
    hasResults,
    isRunning,
    handleRunTool,
    handleClearChat,
    modelList,
    selectedModel,
    onSelectModel,
    llmSettings,
    onSetLLMSettings,
    mcpAuthModalProps,
  } = useToolkitTestRunner({ toolkitId, values: formValues });

  const onCopyToClipboard = useChatCopyToClipboard(chatHistory);

  if (!selectedTool) {
    return (
      <>
        <Grid
          size={12}
          sx={styles.emptyStateGrid}
        >
          <TestToolsEmptyState
            toolkitId={toolkitId}
            onChangeTool={onChangeTool}
          />
        </Grid>
        <McpAuthModal {...mcpAuthModalProps} />
      </>
    );
  }

  if (hasResults || isRunning) {
    return (
      <>
        <Grid
          size={12}
          sx={styles.resultGrid}
        >
          <Box sx={styles.resultPanel}>
            <Box sx={styles.resultHeader}>
              <Button.BaseBtn
                size="small"
                onClick={handleClearChat}
                sx={styles.backButton}
                startIcon={<ArrowBackIcon sx={styles.icon} />}
              />
              <Typography
                variant="headingSmall"
                color="text.secondary"
              >
                Run Results
              </Typography>
            </Box>
            <Box sx={styles.resultContent}>
              <ChatBodyContainer sx={styles.chatBodyContainer}>
                <ChatMessageList
                  chat_history={chatHistory}
                  activeConversation={getMockToolkitIndexConversation(chatHistory)}
                  isLoading={false}
                  isStreaming={false}
                  isLoadingMore={false}
                  askingQuestionId=""
                  questionItemRef={null}
                  onCopyToClipboard={onCopyToClipboard}
                />
              </ChatBodyContainer>
            </Box>
          </Box>
        </Grid>
        <McpAuthModal {...mcpAuthModalProps} />
      </>
    );
  }

  return (
    <>
      <Grid
        size={12}
        sx={styles.settingsGrid}
      >
        <TestToolSettings
          toolkitId={toolkitId}
          selectedTool={selectedTool}
          onChangeTool={onChangeTool}
          toolInputVariables={toolInputVariables}
          onChangeInputVariables={onChangeInputVariables}
          onRunTool={handleRunTool}
          modelList={modelList}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          llmSettings={llmSettings}
          onSetLLMSettings={onSetLLMSettings}
          isRunning={isRunning}
          isValidForm={isValidForm}
          selectedToolSchema={selectedToolSchema}
        />
      </Grid>
      <McpAuthModal {...mcpAuthModalProps} />
    </>
  );
});

TestTools.displayName = 'TestTools';

export default TestTools;

/** @type {MuiSx} */
const testToolsStyles = () => ({
  emptyStateGrid: {
    height: '100%',
  },
  settingsGrid: {
    height: '100%',
  },
  resultGrid: {
    height: '100%',
  },
  resultPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
  },
  resultHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1.5rem 0.5rem 0.75rem',
    background: palette.background.section,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    height: PANEL_HEADER_HEIGHT,
    gap: '1rem',
  }),
  backButton: ({ palette }) => ({
    padding: '0.375rem',
    borderRadius: '1rem',
    color: palette.text.secondary,
  }),
  resultContent: {
    flex: 1,
    overflow: 'auto',
  },
  chatBodyContainer: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: '0 !important',
    border: 'none !important',
  },
  icon: { fontSize: '1rem' },
});
