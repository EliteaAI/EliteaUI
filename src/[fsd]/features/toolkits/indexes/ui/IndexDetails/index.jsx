import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useMcpAuthModal } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import {
  EditViewTabsEnum,
  IndexStatuses,
  IndexViewsEnum,
  IndexesToolsEnum,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  adjustIndexDataSchema,
  getMockToolkitIndexConversation,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexNameValidation } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import {
  IndexActions,
  IndexChatContainer,
  IndexConfig,
  IndexNameWrapper,
  IndexViewToggler,
  IndexViews,
} from '@/[fsd]/features/toolkits/indexes/ui';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const IndexDetails = memo(props => {
  const {
    index,
    view,
    traceNewIndex,
    refetchIndexesList,
    handleDeleteIndex,
    isIndexDeleting,
    selectedIndexTools,
    toolkitId,
    editToolDetail,
  } = props;
  const styles = indexDetailsStyles();

  const configInitialized = useRef(false);
  const { values } = useFormikContext();

  const isCreateView = useMemo(() => view === IndexViewsEnum.create, [view]);

  const [toolInputVariables, setToolInputVariables] = useState([]);
  const { clearIndexNameError, indexNameError, updateIndexNameError, isIndexNameValid } =
    useIndexNameValidation();

  // MCP Auth Modal hook
  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({ values });

  const disableRunTabReason = useMemo(() => {
    if (!index?.metadata?.state) return 'No index selected';

    const notSucceed = !RUNNABLE_INDEX_STATUSES.includes(index.metadata.state);
    const notSelectedTools = !selectedIndexTools.some(st =>
      [
        IndexesToolsEnum.searchIndexData,
        IndexesToolsEnum.stepbackSearchIndex,
        IndexesToolsEnum.stepbackSummaryIndex,
      ].includes(st),
    );

    if (notSucceed) return 'Not valid index state for running tools';
    if (notSelectedTools) return 'No run tools are selected in the toolkit';

    return null;
  }, [index?.metadata?.state, selectedIndexTools]);

  const disableHistoryTabReason = useMemo(() => {
    if (!index?.metadata?.state) return 'No index selected';

    const noHistoryItems = index?.metadata?.history?.length === 0;
    const inProgress = index.metadata.state === IndexStatuses.progress;

    if (inProgress) return 'Indexing in progress. History is unavailable until indexing is complete';
    if (noHistoryItems) return 'No history items available for this index';

    return null;
  }, [index]);

  const defaultActiveEditTab = useMemo(() => {
    if (disableRunTabReason) return EditViewTabsEnum.configuration;

    return EditViewTabsEnum.run;
  }, [disableRunTabReason]);

  const defaultRunTool = useMemo(
    () => (isCreateView ? IndexesToolsEnum.indexData : IndexesToolsEnum.searchIndexData),
    [isCreateView],
  );

  const [activeEditTab, setActiveEditTab] = useState(defaultActiveEditTab);
  const [selectedRunTool, setSelectedRunTool] = useState(defaultRunTool);

  const toolSchema = useMemo(() => {
    const indexConfigView = activeEditTab === EditViewTabsEnum.configuration;

    if (isCreateView || indexConfigView) return IndexesToolsEnum.indexData;

    return selectedRunTool;
  }, [activeEditTab, selectedRunTool, isCreateView]);

  const indexDataSchema = useGetSelectedToolSchema({
    toolkitType: values.type,
    toolOptionType: toolSchema,
  });

  const adjustedIndexDataSchema = useMemo(() => {
    let adjustment = {
      index_name: {
        ...(indexNameError ? { error: indexNameError } : {}),
      },
      query: { clipboard: true },
    };

    if (view === IndexViewsEnum.edit)
      adjustment = {
        index_name: { hidden: true, default: index.metadata.collection },
        query: { clipboard: true },
      };

    return adjustIndexDataSchema(indexDataSchema, adjustment);
  }, [indexNameError, view, index, indexDataSchema]);

  const isValidForm = useMemo(() => {
    if (values.type === ToolTypes.custom.value) return true;
    if (!adjustedIndexDataSchema?.properties) return false;

    return ToolkitChatHelpers.validateToolkitForm(adjustedIndexDataSchema, toolInputVariables);
  }, [toolInputVariables, adjustedIndexDataSchema, values.type]);

  const initializeDefaultConfigValues = useCallback(
    (reset = false) => {
      configInitialized.current = true;

      const defaultValues = {};
      let hasDefaults = false;

      Object.entries(adjustedIndexDataSchema?.properties ?? {}).forEach(([key, property]) => {
        const currentValue = toolInputVariables?.[key];

        // Skip if value already exists (but not empty string) including exception for `filter`
        if (currentValue !== undefined && currentValue !== '' && typeof currentValue !== 'function' && !reset)
          return;

        let defaultValue =
          view === IndexViewsEnum.edit && activeEditTab === EditViewTabsEnum.configuration
            ? index.metadata.index_configuration?.[key]
            : property.default;

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

        if (defaultValue === undefined)
          defaultValue =
            {
              object: {},
              array: [],
              boolean: false,
              string: '',
              number: 0,
              integer: 0,
            }[property.type] ?? '';
        else {
          defaultValues[key] = defaultValue;
          hasDefaults = true;
        }
      });

      if (hasDefaults) {
        const newInputVariables = {
          ...(reset ? {} : toolInputVariables),
          ...defaultValues,
        };

        setToolInputVariables(newInputVariables);
      }
    },
    [adjustedIndexDataSchema?.properties, toolInputVariables, view, activeEditTab, index],
  );

  const {
    chatHistory,
    isIndexing,
    isRunning,
    isStoppingIndexing,
    isFullScreenChat,
    handleClearChat,
    handleIndexData,
    handleRunTool,
    llmSettings,
    modelList,
    onCancelIndexing,
    onSelectModel,
    onSetLLMSettings,
    selectedModel,
    toggleFullScreenChat,
    stopRunOnIndexChange,
    handleClearActiveConversation,
  } = useToolkitChat({
    cancelIndexingCallback: value => {
      setActiveEditTab(value);
      traceNewIndex(index?.id ?? null, {
        state: IndexStatuses.cancelled,
      });
    },
    index,
    isValidForm,
    refetchIndexesList,
    runTool: activeEditTab === EditViewTabsEnum.configuration ? null : selectedRunTool,
    toolkitId,
    toolInputVariables,
    traceNewIndex,
    values,
    modes: isCreateView ? [ToolkitChatModesEnum.createIndex] : [],
    onMcpAuthRequired: handleMcpAuthRequired,
  });

  // Update run tool when view changes
  useEffect(() => {
    clearIndexNameError();
    setSelectedRunTool(defaultRunTool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRunTool]);

  useEffect(() => {
    if (isRunning) stopRunOnIndexChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index?.id]);

  useEffect(() => {
    if (view === IndexViewsEnum.edit) setActiveEditTab(defaultActiveEditTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index?.id, index?.metadata?.state]);

  useEffect(() => {
    handleClearActiveConversation();
    handleClearChat();

    if (disableRunTabReason && view === IndexViewsEnum.edit && activeEditTab === EditViewTabsEnum.run)
      setActiveEditTab(defaultActiveEditTab);

    initializeDefaultConfigValues(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index?.id, selectedRunTool, activeEditTab]);

  const discardConfigChanges = useCallback(
    () => initializeDefaultConfigValues(true),
    [initializeDefaultConfigValues],
  );

  const onChangeInputVariables = useCallback(
    value => {
      if (value.index_name && !isIndexNameValid(value.index_name)) updateIndexNameError(value.index_name);
      else clearIndexNameError();

      setToolInputVariables(value);
    },
    [clearIndexNameError, isIndexNameValid, updateIndexNameError],
  );

  const toolConfigProps = useMemo(
    () => ({
      selectedRunTool,
      onChangeTool: tool => setSelectedRunTool(tool.value || null),
      handleRunTool,
      selectedIndexTools,
    }),
    [selectedRunTool, selectedIndexTools, handleRunTool],
  );

  const indexConfigProps = useMemo(
    () => ({
      schema: adjustedIndexDataSchema,
      configInitialized,
      initializeDefaultConfigValues,
      toolInputVariables,
      onChangeInputVariables,
      isValidForm,
      changesDisabled: isIndexing,
      isRunningTool: isRunning,
    }),
    [
      adjustedIndexDataSchema,
      initializeDefaultConfigValues,
      isValidForm,
      onChangeInputVariables,
      toolInputVariables,
      isIndexing,
      isRunning,
    ],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.detailsHeader}>
        <IndexNameWrapper index={index} />
        <IndexActions
          index={index}
          view={view}
          activeView={activeEditTab}
          toolkitId={toolkitId}
          onDiscard={discardConfigChanges}
          isValidForm={isValidForm}
          indexData={handleIndexData}
          isIndexingData={isIndexing}
          isRunningTool={isRunning}
          isIndexDeleting={isIndexDeleting}
          handleDeleteIndex={handleDeleteIndex}
          selectedIndexTools={selectedIndexTools}
          onCancelIndexing={onCancelIndexing}
          isStoppingIndexing={isStoppingIndexing}
          editToolDetail={editToolDetail}
        />
      </Box>

      <Box sx={styles.mainContent}>
        <Box sx={styles.indexConfigCollapsableWrapper(isFullScreenChat)}>
          {isCreateView ? (
            <IndexConfig {...indexConfigProps} />
          ) : (
            <>
              <IndexViewToggler
                activeTab={activeEditTab}
                onChangeTab={(_, value) => {
                  if (value) setActiveEditTab(value);
                }}
                disableRunTabReason={disableRunTabReason}
                disableHistoryTabReason={disableHistoryTabReason}
              />
              <IndexViews
                {...indexConfigProps}
                activeView={activeEditTab}
                toolsConfig={toolConfigProps}
                index={index}
              />
            </>
          )}
        </Box>
        <IndexChatContainer
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          modelList={modelList}
          llmSettings={llmSettings}
          onSetLLMSettings={onSetLLMSettings}
          isFullScreenChat={isFullScreenChat}
          toggleFullScreenChat={toggleFullScreenChat}
          clearChat={handleClearChat}
          chatHistory={chatHistory}
          conversation={getMockToolkitIndexConversation(chatHistory)}
        />
      </Box>

      {/* MCP Auth Modal */}
      <McpAuthModal {...getModalProps()} />
    </Box>
  );
});

IndexDetails.displayName = 'IndexDetails';

/** @type {MuiSx} */
const indexDetailsStyles = () => ({
  wrapper: {
    flexGrow: 1,
    maxWidth: 'calc(100% - 16.25rem)',
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 0rem 1rem 2rem',
    position: 'relative',
    maxHeight: '3.75rem',

    '&:after': {
      content: '""',
      display: 'block',
      width: 'calc(100% + 1.5rem)',
      height: '0.0625rem',
      position: 'absolute',
      bottom: 0,
      left: 0,
      backgroundColor: 'divider',
    },
  },
  indexConfigCollapsableWrapper: isFullScreenChat => ({
    flex: isFullScreenChat ? '0 0 0px' : '0 0 25.625rem',
    minWidth: isFullScreenChat ? '2rem' : '25.625rem',
    maxWidth: isFullScreenChat ? '2rem' : '25.625rem',
    width: isFullScreenChat ? '2rem' : '25.625rem',
    overflowY: 'auto',
    paddingRight: isFullScreenChat ? 0 : '2rem',
    paddingLeft: '2rem',
    transition: 'all 0.3s ease-in-out',

    '>div': {
      minWidth: '21.625rem',
      transition: 'all 0.5s ease',
      opacity: isFullScreenChat ? '0' : '1',
      overflowY: 'auto',
    },
  }),
  mainContent: {
    display: 'flex',
    flex: '1 1 auto',
    height: 'calc(100% - 3.75rem)',
    padding: '1.5rem 0rem',
    boxSizing: 'border-box',
  },
  editViewHeader: {
    marginBottom: '1.5rem',
  },
  editTabBtn: {
    textTransform: 'capitalize',
  },
});

export default IndexDetails;
