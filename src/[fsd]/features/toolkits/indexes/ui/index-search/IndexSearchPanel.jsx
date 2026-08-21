import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { McpAuthModal } from '@/[fsd]/features/mcp';
import { useIndexSearchRunner } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitTestResults } from '@/[fsd]/features/toolkits/ui';

import IndexSearchEmptyState from './IndexSearchEmptyState';
import IndexSearchSettings from './IndexSearchSettings';

const { PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const IndexSearchPanel = memo(props => {
  const { toolkitId, indexName, selectedIndexTools, blockedReason } = props;
  const { values } = useFormikContext();
  const styles = indexSearchPanelStyles();

  const {
    chatHistory,
    isRunning,
    isValidForm,
    handleRunTool,
    mcpAuthModalProps,
    onChangeInputVariables,
    onChangeTool,
    searchToolOptions,
    selectedTool,
    selectedToolSchema,
    toolInputVariables,
  } = useIndexSearchRunner({ toolkitId, indexName, selectedIndexTools, values });

  return (
    <Box
      sx={styles.root}
      data-testid="index-search-panel"
    >
      <Box sx={[styles.column, styles.leftColumn]}>
        <Box sx={styles.columnHeader}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Search Settings
          </Typography>
        </Box>
        <Box sx={styles.columnBody}>
          {selectedTool ? (
            <IndexSearchSettings
              searchToolOptions={searchToolOptions}
              selectedTool={selectedTool}
              onChangeTool={onChangeTool}
              selectedToolSchema={selectedToolSchema}
              toolInputVariables={toolInputVariables}
              onChangeInputVariables={onChangeInputVariables}
              onRunSearch={handleRunTool}
              isRunning={isRunning}
              isValidForm={isValidForm}
              blockedReason={blockedReason}
            />
          ) : (
            <IndexSearchEmptyState
              searchToolOptions={searchToolOptions}
              onChangeTool={onChangeTool}
              blockedReason={blockedReason}
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
        <Box
          sx={styles.columnBody}
          data-testid="index-search-results"
        >
          <ToolkitTestResults chatHistory={chatHistory} />
        </Box>
      </Box>
      <McpAuthModal {...mcpAuthModalProps} />
    </Box>
  );
});

IndexSearchPanel.displayName = 'IndexSearchPanel';

/** @type {MuiSx} */
const indexSearchPanelStyles = () => ({
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
});

export default IndexSearchPanel;
