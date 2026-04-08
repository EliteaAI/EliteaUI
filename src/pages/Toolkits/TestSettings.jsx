import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Typography } from '@mui/material';

import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { adjustIndexDataSchema } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexNameValidation } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Select } from '@/[fsd]/shared/ui/';
import { LLMModelSelector } from '@/[fsd]/widgets/LLMModelSelector';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema.js';
import { ContentContainer } from '@/pages/Common/Components';
import styled from '@emotion/styled';

import { ToolTypes } from '../Applications/Components/Tools/consts';

const AdvanceSettingSelectorContainer = styled(Box)(() => ({ marginTop: '0.2rem', paddingRight: '0.5rem' }));

const TestSettings = ({
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
}) => {
  const { values } = useFormikContext();
  const styles = testSettingsStyles();

  const initializedToolRef = useRef(null); // Track which tool we've initialized

  const { clearIndexNameError, indexNameError, updateIndexNameError, isIndexNameValid } =
    useIndexNameValidation();

  // Get selected tool schema
  const toolSchema = useGetSelectedToolSchema({
    toolkitType: values.type,
    toolOptionType: selectedTool,
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

  // Clear index name error when tool changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => clearIndexNameError(), [selectedTool]);

  // Initialize default values from tool schema when tool changes
  useEffect(() => {
    if (selectedToolSchema?.properties && selectedTool && initializedToolRef.current !== selectedTool) {
      // Mark this tool as initialized
      initializedToolRef.current = selectedTool;

      const defaultValues = {};
      let hasDefaults = false;

      Object.entries(selectedToolSchema.properties).forEach(([key, property]) => {
        // Check current value
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
  }, [selectedToolSchema, selectedTool, toolInputVariables, onChangeInputVariables]);

  const allToolsOptions = useMemo(() => {
    const selectedTools = values?.settings?.selected_tools || []; // Ensure it's an array
    // Map to label/value pairs and always sort by label (asc) for stable UI order
    return selectedTools
      .map(tool => ({
        label:
          typeof tool === 'string'
            ? (tool.charAt(0).toUpperCase() + tool.slice(1)).replaceAll('_', ' ')
            : tool?.name,
        value: tool,
      }))
      .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
  }, [values]);

  // Validation logic for required fields
  const isValidForm = useMemo(() => {
    if (values.type === ToolTypes.custom.value) {
      return true;
    }
    if (!selectedTool || !selectedToolSchema?.properties) {
      return false;
    }

    const requiredFields = selectedToolSchema.required || [];
    const inputVariables = toolInputVariables || {};

    return requiredFields.every(field => {
      const value = inputVariables[field];
      // Check if the value exists and is not empty
      if (value === undefined || value === null || value === '' || value === 0) {
        return false;
      }
      // For arrays, check if they have at least one item
      return !(Array.isArray(value) && value.length === 0);
    });
  }, [selectedTool, toolInputVariables, selectedToolSchema, values.type]);

  const handleRunTool = useCallback(() => {
    if (isValidForm && onRunTool) {
      onRunTool({
        tool: selectedTool,
        input_variables: toolInputVariables || {},
        schema: selectedToolSchema,
      });
    }
  }, [isValidForm, onRunTool, selectedTool, toolInputVariables, selectedToolSchema]);

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
      width={'100%'}
      height={'100%'}
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
        <AdvanceSettingSelectorContainer>
          <Select.SingleSelect
            value={selectedTool} //@todo: can be placed in other place, not in formik or with other path
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
        </AdvanceSettingSelectorContainer>

        {/* Scrollable Tool Parameters Container */}
        {selectedTool && (
          <Box sx={styles.configContainer}>
            {/* Scrollable Parameters Section */}
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

            {/* Sticky Run Tool Button */}
            <Box sx={styles.runToolBtn}>
              <Button
                variant="special"
                fullWidth
                disabled={!isValidForm || isRunning || indexNameError}
                onClick={handleRunTool}
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
};

/** @type {MuiSx} */
const testSettingsStyles = () => ({
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
    marginTop: '14px',
  },
  configContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: '400px',
  },
  scrollableSection: ({ palette }) => ({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '8px',
    marginRight: '-8px', // Compensate for scrollbar
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: palette.divider,
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.action.hover,
    },
  }),
  runToolBtn: ({ palette }) => ({
    marginTop: '16px',
    paddingRight: '0.5rem',
    paddingTop: '16px',
    borderTop: `1px solid ${palette.divider}`,
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
  }),
});

export default TestSettings;
