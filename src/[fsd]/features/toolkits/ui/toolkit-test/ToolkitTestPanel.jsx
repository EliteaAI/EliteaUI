import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { McpAuthModal } from '@/[fsd]/features/mcp';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { useToolkitTestRunner } from '@/[fsd]/features/toolkits/lib/hooks';

import ToolkitTestEmptyState from './ToolkitTestEmptyState';
import ToolkitTestResults from './ToolkitTestResults';
import ToolkitTestSettings from './ToolkitTestSettings';

const { PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const ToolkitTestPanel = memo(props => {
  const { toolkitId } = props;
  const { values } = useFormikContext();
  const styles = toolkitTestPanelStyles();

  const {
    selectedTool,
    onChangeTool,
    toolInputVariables,
    onChangeInputVariables,
    selectedToolSchema,
    isValidForm,
    chatHistory,
    isRunning,
    handleRunTool,
    modelList,
    selectedModel,
    onSelectModel,
    llmSettings,
    onSetLLMSettings,
    mcpAuthModalProps,
  } = useToolkitTestRunner({ toolkitId, values });

  return (
    <Box sx={styles.root}>
      <Box sx={[styles.column, styles.leftColumn]}>
        <Box sx={styles.columnHeader}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Test Settings
          </Typography>
        </Box>
        <Box sx={styles.columnBody}>
          {selectedTool ? (
            <ToolkitTestSettings
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
          ) : (
            <ToolkitTestEmptyState
              toolkitId={toolkitId}
              onChangeTool={onChangeTool}
              sx={styles.emptyState}
            />
          )}
        </Box>
      </Box>
      <Box sx={styles.column}>
        <Box sx={styles.columnHeader}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Results
          </Typography>
        </Box>
        <Box sx={styles.columnBody}>
          <ToolkitTestResults chatHistory={chatHistory} />
        </Box>
      </Box>
      <McpAuthModal {...mcpAuthModalProps} />
    </Box>
  );
});

ToolkitTestPanel.displayName = 'ToolkitTestPanel';

/** @type {MuiSx} */
const toolkitTestPanelStyles = () => ({
  root: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 50%',
    minWidth: 0,
    minHeight: 0,
  },
  leftColumn: {
    borderRight: ({ palette }) => `0.0625rem solid ${palette.border.table}`,
  },
  columnHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: PANEL_HEADER_HEIGHT,
    background: palette.background.section,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  columnBody: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  emptyState: {
    height: '100%',
    justifyContent: 'center',
    padding: 0,
  },
});

export default ToolkitTestPanel;
