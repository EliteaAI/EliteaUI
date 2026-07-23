import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Grid, Typography } from '@mui/material';

import { ChatMessageList } from '@/[fsd]/features/chat/ui/chat-box';
import { useMcpAuthModal } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import {
  adjustIndexDataSchema,
  getMockToolkitIndexConversation,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexNameValidation } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { TestToolSettings } from '@/[fsd]/features/toolkits/ui';
import TestToolsEmptyState from '@/[fsd]/features/toolkits/ui/test-tools/TestToolsEmptyState';
import { Button } from '@/[fsd]/shared/ui';
import { WELCOME_MESSAGE_ID } from '@/common/constants';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const TestTools = memo(props => {
  const { toolkitId } = props;
  const initializedToolRef = useRef(null);
  const { values: formValues } = useFormikContext();

  const styles = testToolsStyles();

  const { clearIndexNameError, updateIndexNameError, isIndexNameValid, indexNameError } =
    useIndexNameValidation();

  const [selectedTool, setSelectedTool] = useState(null);
  const [toolInputVariables, setToolInputVariables] = useState([]);

  // MCP Auth Modal hook
  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({ values: formValues });

  const toolSchema = useGetSelectedToolSchema({
    toolkitType: formValues.type,
    toolOptionType: selectedTool,
    toolkitId,
    availableMcpTools: formValues?.settings?.available_mcp_tools,
  });

  const selectedToolSchema = useMemo(() => {
    if (selectedTool === IndexesToolsEnum.indexData)
      return adjustIndexDataSchema(toolSchema, {
        index_name: {
          ...(indexNameError ? { error: indexNameError } : {}),
        },
      });

    return toolSchema;
  }, [selectedTool, indexNameError, toolSchema]);

  const isValidForm = useMemo(() => {
    if (formValues.type === ToolTypes.custom.value) return true;
    if (!selectedTool || !selectedToolSchema?.properties) return false;

    return ToolkitChatHelpers.validateToolkitForm(selectedToolSchema, toolInputVariables);
  }, [selectedTool, toolInputVariables, selectedToolSchema, formValues.type]);

  const {
    chatHistory,
    handleRunTool,
    handleClearChat,
    isRunning,
    modelList,
    onSelectModel,
    onSetLLMSettings,
    selectedModel,
    llmSettings,
  } = useToolkitChat({
    runTool: selectedTool,
    toolInputVariables,
    toolkitId,
    isValidForm,
    values: formValues,
    modes: [ToolkitChatModesEnum.testTools],
    onMcpAuthRequired: handleMcpAuthRequired,
  });

  const onCopyToClipboard = useChatCopyToClipboard(chatHistory);

  const onChangeInputVariables = useCallback(inputVariables => {
    setToolInputVariables(inputVariables);
  }, []);

  const onChangeTool = useCallback(value => {
    setSelectedTool(value || null);
    setToolInputVariables([]);
  }, []);

  const initializeDefaultConfigValues = useCallback(() => {
    if (selectedToolSchema?.properties && selectedTool && initializedToolRef.current !== selectedTool) {
      // Mark this tool as initialized
      initializedToolRef.current = selectedTool;

      const defaultValues = {};
      let hasDefaults = false;

      Object.entries(selectedToolSchema.properties).forEach(([key, property]) => {
        const currentValue = toolInputVariables?.[key];

        // Skip if value already exists (but not empty string) including exception for `filter`
        if (currentValue !== undefined && currentValue !== '' && typeof currentValue !== 'function') {
          return;
        }

        let defaultValue = property.default;

        // Handle anyOf patterns (like whitelist/blacklist fields)
        if (property.anyOf && Array.isArray(property.anyOf) && defaultValue === undefined) {
          const arraySchema = property.anyOf.find(schema => schema.type === 'array');

          if (arraySchema && arraySchema.default !== undefined) {
            defaultValue = arraySchema.default;
          } else if (property.anyOf.find(schema => schema.type === 'null')) {
            // If it's anyOf with null and no explicit default, use null as default
            defaultValue = null;
          }
        }

        // Set default values based on type if no explicit default
        if (defaultValue === undefined) {
          switch (property.type) {
            case 'object':
              defaultValue = {};
              break;
            case 'array':
              defaultValue = [];
              break;
            case 'boolean':
              defaultValue = false;
              break;
            case 'string':
              defaultValue = '';
              break;
            case 'number':
            case 'integer':
              defaultValue = null;
              break;
            default:
              defaultValue = '';
          }
        }

        if (defaultValue !== undefined) {
          defaultValues[key] = defaultValue;
          hasDefaults = true;
        }
      });

      if (hasDefaults) {
        const newInputVariables = {
          ...toolInputVariables,
          ...defaultValues,
        };
        onChangeInputVariables(newInputVariables);
      }
    }
  }, [onChangeInputVariables, selectedTool, selectedToolSchema?.properties, toolInputVariables]);

  // Clear index name error when tool changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => clearIndexNameError(), [selectedTool]);

  useEffect(() => {
    initializeDefaultConfigValues();
  }, [initializeDefaultConfigValues]);

  const hasRealMessages = chatHistory.some(msg => msg.id !== WELCOME_MESSAGE_ID);
  const showRunResult = hasRealMessages || isRunning;

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
        <McpAuthModal {...getModalProps()} />
      </>
    );
  }

  if (showRunResult) {
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
                  interaction_uuid="toolkit-test"
                  askingQuestionId=""
                  lastResponseMinHeight={0}
                  questionItemRef={null}
                  onCopyToClipboard={onCopyToClipboard}
                />
              </ChatBodyContainer>
            </Box>
          </Box>
        </Grid>
        <McpAuthModal {...getModalProps()} />
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
          clearIndexNameError={clearIndexNameError}
          updateIndexNameError={updateIndexNameError}
          isIndexNameValid={isIndexNameValid}
          indexNameError={indexNameError}
          isValidForm={isValidForm}
          selectedToolSchema={selectedToolSchema}
        />
      </Grid>
      <McpAuthModal {...getModalProps()} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
    height: '3rem',
    gap: '1rem',
  }),
  resultHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  backButton: ({ palette }) => ({
    padding: '0.375rem',
    borderRadius: '1rem',
    color: palette.text.secondary,
  }),
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
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
