import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Grid } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
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
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import ChatMessageList from '@/components/Chat/ChatMessageList';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import { ContentContainer } from '@/pages/Common/Components';

const TestTools = memo(props => {
  const { showAdvancedSettings, isFullScreenChat, setIsFullScreenChat, toolkitId, onShowHistory } = props;
  const initializedToolRef = useRef(null);
  const { values: formValues } = useFormikContext();

  const styles = testToolsStyles({
    showAdvancedSettings,
  });

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

  const onChangeTool = useCallback(option => {
    const value = option?.value || null;

    setSelectedTool(value);
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

  return (
    <>
      <Grid
        size={{ md: 12, lg: 8 }}
        sx={styles.chatGrid}
      >
        <ContentContainer sx={styles.chatContainer}>
          <Box sx={styles.chatContent}>
            <Box sx={styles.chatControls}>
              <Box sx={styles.controlButtons}>
                <FullScreenToggle
                  isFullScreenChat={isFullScreenChat}
                  setIsFullScreenChat={setIsFullScreenChat}
                />
                <ChatButton.ClearChatButton onClear={handleClearChat} />
                {onShowHistory && <ViewRunHistoryButton onShowHistory={onShowHistory} />}
              </Box>
            </Box>

            <ChatBodyContainer
              sx={({ breakpoints }) => ({
                [breakpoints.up('lg')]: styles.chatBodyContainer,
                [breakpoints.down('lg')]: styles.chatBodyContainerResponsive,
              })}
            >
              <ChatMessageList
                chat_history={chatHistory}
                activeConversation={getMockToolkitIndexConversation(chatHistory)}
                isLoading={false}
                isStreaming={false}
                isLoadingMore={false}
                interaction_uuid="toolkit-test"
                askingQuestionId=""
                lastResponseMinHeight={0}
                questionItemRef={useRef()}
                onCopyToClipboard={onCopyToClipboard}
              />
            </ChatBodyContainer>
          </Box>
        </ContentContainer>
      </Grid>
      <Grid
        size={{ md: 12, lg: 4 }}
        container
        sx={({ breakpoints }) => ({
          ...styles.settingsGrid,
          [breakpoints.down('lg')]: styles.settingsGridResponsive,
        })}
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

      {/* MCP Auth Modal */}
      <McpAuthModal {...getModalProps()} />
    </>
  );
});

TestTools.displayName = 'TestTools';

export default TestTools;

/** @type {MuiSx} */
const testToolsStyles = ({ showAdvancedSettings }) => ({
  chatGrid: ({ breakpoints }) => ({
    height: '100%',

    [breakpoints.down('lg')]: {
      height: '100vh !important',
      minHeight: '120vh !important',
      marginBottom: '1.5rem',
    },
  }),
  chatContainer: {
    height: '100%',
  },
  chatContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    gap: '.875rem',
    overflow: 'auto',
  },
  chatControls: ({ breakpoints }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',

    [breakpoints.down('lg')]: {
      marginBottom: showAdvancedSettings ? '0rem' : '1.5rem',
    },
  }),
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem',
  },
  chatBodyContainer: {
    height: 'calc(100vh - 10rem)',
  },
  chatBodyContainerResponsive: {
    height: '100vh !important',
    minHeight: '100vh !important',
    marginBottom: '1.5rem',
  },
  settingsGrid: {
    maxHeight: '100%',
  },
  settingsGridResponsive: {
    height: '100vh !important',
    minHeight: '100vh !important',
    paddingBottom: '1.5rem',
  },
});
