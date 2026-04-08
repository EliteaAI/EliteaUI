import React, { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Typography } from '@mui/material';

import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Select } from '@/[fsd]/shared/ui/';
import LLMModelSelector from '@/[fsd]/widgets/LLMModelSelector/ui/LLMModelSelector';
import { useToolkitAvailableToolsQuery } from '@/api/toolkits.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ContentContainer } from '@/pages/Common/Components';

const TestToolSettings = memo(props => {
  const {
    toolkitId,
    selectedTool,
    onChangeTool,
    toolInputVariables,
    onChangeInputVariables,
    onRunTool,
    modelList,
    selectedModel,
    onSelectModel,
    llmSettings,
    onSetLLMSettings,
    isRunning,
    clearIndexNameError,
    updateIndexNameError,
    isIndexNameValid,
    indexNameError,
    isValidForm,
    selectedToolSchema,
  } = props;

  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const selectedToolsSchema = toolkitSchemas?.[values?.type]?.properties?.selected_tools;

  const schemaToolNames = useMemo(() => {
    const argsSchemasKeys = Object.keys(selectedToolsSchema?.args_schemas || {});
    if (argsSchemasKeys.length) return argsSchemasKeys;
    return [...(selectedToolsSchema?.items?.enum || [])];
  }, [selectedToolsSchema?.args_schemas, selectedToolsSchema?.items?.enum]);

  const shouldFetchDynamicTools = useMemo(() => {
    if (!projectId || !toolkitId) return false;
    if (schemaToolNames.length) return false;
    return true;
  }, [projectId, schemaToolNames.length, toolkitId]);

  const { data: toolkitAvailableToolsData } = useToolkitAvailableToolsQuery(
    { projectId, toolkitId },
    { skip: !shouldFetchDynamicTools },
  );

  const dynamicToolNames = useMemo(() => {
    const tools = toolkitAvailableToolsData?.tools || [];
    return tools.map(t => t?.name).filter(name => typeof name === 'string' && name.trim());
  }, [toolkitAvailableToolsData?.tools]);

  const styles = testToolSettingsStyles();

  const allToolsOptions = useMemo(() => {
    const explicitSelectedTools = values?.settings?.selected_tools || [];
    const hasExplicitSelection = Array.isArray(explicitSelectedTools) && explicitSelectedTools.length > 0;
    const availableTools = hasExplicitSelection
      ? explicitSelectedTools
      : dynamicToolNames.length
        ? dynamicToolNames
        : schemaToolNames;

    // Map to label/value pairs and always sort by label (asc) for stable UI order
    return (availableTools || [])
      .map(tool => ({
        label:
          typeof tool === 'string'
            ? (tool.charAt(0).toUpperCase() + tool.slice(1)).replaceAll('_', ' ')
            : tool?.name,
        value: tool,
      }))
      .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
  }, [dynamicToolNames, schemaToolNames, values?.settings?.selected_tools]);

  const onChangeInputVariablesWrapper = useCallback(
    value => {
      const isInvalid =
        selectedTool === IndexesToolsEnum.indexData &&
        value.index_name &&
        !isIndexNameValid(value.index_name);

      if (isInvalid) updateIndexNameError(value.index_name);
      else clearIndexNameError();

      onChangeInputVariables(value);
    },
    [clearIndexNameError, isIndexNameValid, onChangeInputVariables, selectedTool, updateIndexNameError],
  );

  return (
    <Box
      width="100%"
      height="100%"
    >
      <ContentContainer sx={styles.contentContainer}>
        <Box>
          <Typography variant="subtitle">Test Settings</Typography>
        </Box>
        <Box sx={styles.llmModelContainer}>
          <LLMModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            models={modelList}
            llmSettings={llmSettings}
            onSetLLMSettings={onSetLLMSettings}
          />
        </Box>
        <Box sx={styles.toolSelectContainer}>
          <Select.SingleSelect
            value={selectedTool}
            label="Tool"
            onValueChange={onChangeTool}
            onClear={() => onChangeTool(null)}
            options={allToolsOptions}
            withSearch
            emptyPlaceholder="No tools found"
            showEmptyPlaceholder={false}
            displayEmpty
            showBorder
          />
        </Box>

        {selectedTool && (
          <Box sx={styles.configContainer}>
            <Box sx={styles.scrollableSection}>
              {Object.keys(selectedToolSchema?.properties || {}).map(key => (
                <ToolkitForm.ToolFormContainer
                  key={key}
                  fieldKey={key}
                  property={selectedToolSchema.properties[key]}
                  toolInputVariables={toolInputVariables}
                  schema={selectedToolSchema}
                  onChangeInputVariables={onChangeInputVariablesWrapper}
                />
              ))}
            </Box>

            <Box sx={styles.runToolBtn}>
              <Button
                variant="special"
                fullWidth
                disabled={!isValidForm || isRunning || indexNameError}
                onClick={onRunTool}
                startIcon={<PlayArrowIcon />}
              >
                RUN TOOL
              </Button>
            </Box>
          </Box>
        )}
      </ContentContainer>
    </Box>
  );
});

TestToolSettings.displayName = 'TestToolSettings';

/** @type {MuiSx} */
const testToolSettingsStyles = () => ({
  contentContainer: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  llmModelContainer: {
    flexShrink: 0,
    width: '100%',
    overflow: 'hidden',
    marginTop: '.875rem',
  },
  toolSelectContainer: {
    marginTop: '0.5rem',
    paddingRight: '0.5rem',
  },
  configContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: '25rem',
  },
  scrollableSection: ({ palette }) => ({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '.5rem',
    marginRight: '-.5rem',

    '&::-webkit-scrollbar': {
      width: '.375rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: palette.divider,
      borderRadius: '.1875rem',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.action.hover,
    },
  }),
  runToolBtn: ({ palette }) => ({
    marginTop: '1rem',
    paddingRight: '0.5rem',
    paddingTop: '1rem',
    borderTop: `.0625rem solid ${palette.divider}`,
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
  }),
});

export default TestToolSettings;
