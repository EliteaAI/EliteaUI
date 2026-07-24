import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box, Tooltip, Typography } from '@mui/material';

import { SHARED_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { PAT_REQUIRED_ACTION_HINT } from '@/[fsd]/features/mcp/lib/constants';
import { useInternalMcpPatStatus } from '@/[fsd]/features/mcp/lib/hooks';
import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { useToolkitToolOptions } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Button, Select } from '@/[fsd]/shared/ui/';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import SendIcon from '@/components/Icons/SendIcon';
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
  const { patInvalid } = useInternalMcpPatStatus({ projectId, toolkitType: values?.type });
  const { allToolsOptions } = useToolkitToolOptions({ toolkitId });
  const disabledRunTool = !isValidForm || isRunning || indexNameError || patInvalid;

  const styles = testToolSettingsStyles();

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
      data-tour={SHARED_TOUR_TARGET_IDS.testSettings}
      sx={styles.root}
    >
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Test Settings
        </Typography>
      </Box>
      <ContentContainer sx={styles.contentContainer}>
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
        <Box sx={styles.toolSelectContainer}>
          <LLMModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            models={modelList}
            llmSettings={llmSettings}
            onSetLLMSettings={onSetLLMSettings}
            variant="field"
          />
        </Box>

        {Object.keys(selectedTool ? selectedToolSchema?.properties || {} : {}).map(key => (
          <ToolkitForm.ToolFormContainer
            key={key}
            fieldKey={key}
            property={selectedToolSchema.properties[key]}
            toolInputVariables={toolInputVariables}
            schema={selectedToolSchema}
            onChangeInputVariables={onChangeInputVariablesWrapper}
          />
        ))}
      </ContentContainer>
      <Box sx={styles.footer}>
        <Tooltip title={patInvalid ? PAT_REQUIRED_ACTION_HINT : ''}>
          <Box component="span">
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.special}
              disabled={disabledRunTool}
              onClick={onRunTool}
              startIcon={<SendIcon sx={styles.icon} />}
            >
              Run Test
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
});

TestToolSettings.displayName = 'TestToolSettings';

/** @type {MuiSx} */
const testToolSettingsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.background.aiProviderAccordion.default,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    height: '3rem',
    width: '100%',
  }),
  contentContainer: {
    flex: 1,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingBottom: '1rem',
    paddingTop: '1.5rem',
    overflow: 'auto',
    width: '28.125rem',
    gap: '0.5rem',
    '& .index-config-field': {
      marginTop: '0 !important',

      '& .MuiFormControl-root': {
        paddingTop: '0 !important',
      },
    },
  },
  toolSelectContainer: {
    paddingRight: '0.5rem',
    height: '3.75rem',
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
  footer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.secondary,
    borderTop: `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    width: '100%',
    height: '3rem',
  }),
  icon: {
    fontSize: '1rem',
    '& path': { fill: ({ palette }) => palette.primary.main },
    '.Mui-disabled & path': {
      fill: ({ palette }) => palette.icon.fill.disabled,
    },
  },
});

export default TestToolSettings;
