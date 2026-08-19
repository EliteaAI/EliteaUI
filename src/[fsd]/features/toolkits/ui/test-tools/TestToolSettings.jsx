import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Tooltip, Typography } from '@mui/material';

import { PAT_REQUIRED_ACTION_HINT, useInternalMcpPatStatus } from '@/[fsd]/features/mcp';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { useToolkitToolOptions } from '@/[fsd]/features/toolkits/lib/hooks';
import { TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { Button, ScrollableContainer, Select } from '@/[fsd]/shared/ui/';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import SendIcon from '@/components/Icons/SendIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ToolFormContainer from '../form/ToolFormContainer';

const { PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

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
    isValidForm,
    selectedToolSchema,
    hideHeader = false,
  } = props;

  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { patInvalid } = useInternalMcpPatStatus({ projectId, toolkitType: values?.type });
  const { allToolsOptions } = useToolkitToolOptions({ toolkitId });
  const disabledRunTool = !isValidForm || isRunning || patInvalid;

  const styles = testToolSettingsStyles();

  return (
    <Box
      width="100%"
      height="100%"
      data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.testSettings}
      sx={styles.root}
    >
      {!hideHeader && (
        <Box sx={styles.header}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Test Settings
          </Typography>
        </Box>
      )}
      <ScrollableContainer>
        <Box sx={styles.content}>
          <Box sx={styles.toolSelectContainer}>
            <Select.SingleSelect
              data-testid="toolkit-test-tool-select"
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
            <ToolFormContainer
              key={key}
              fieldKey={key}
              property={selectedToolSchema.properties[key]}
              toolInputVariables={toolInputVariables}
              schema={selectedToolSchema}
              onChangeInputVariables={onChangeInputVariables}
              inputTestId={`toolkit-test-param-${key}-input`}
            />
          ))}
        </Box>
      </ScrollableContainer>
      <Box sx={styles.footer}>
        <Tooltip title={patInvalid ? PAT_REQUIRED_ACTION_HINT : ''}>
          <Box component="span">
            <Button.BaseBtn
              data-testid="toolkit-test-run-tool-button"
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

// 511px of fields plus the 32px Figma gutters — caps the column so it cannot straddle the divider.
const CONTENT_MAX_WIDTH = '35.9375rem';

/** @type {MuiSx} */
const testToolSettingsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.background.section,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    height: PANEL_HEADER_HEIGHT,
    width: '100%',
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    margin: '0 auto',
    padding: '1rem 2rem',
    gap: '0.5rem',
    '& .index-config-field': {
      marginTop: '0 !important',

      '& .MuiFormControl-root': {
        paddingTop: '0 !important',
      },
    },
  },
  toolSelectContainer: {
    height: '3.75rem',
  },
  footer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    background: palette.background.section,
    borderTop: `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    width: '100%',
    height: '3.25rem',
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
