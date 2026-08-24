import { memo } from 'react';

import { Box } from '@mui/material';

import RunIndexResultsPanel from '../RunIndexResultsPanel';
import IndexActivityEmptyState from './IndexActivityEmptyState';

const IndexActivityPanel = memo(props => {
  const {
    hasActivity,
    statusShownAbove,
    chatHistory,
    chatConversation,
    questionItemRef,
    onOpenConfiguration,
  } = props;
  const styles = indexActivityPanelStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="index-activity-panel"
    >
      {hasActivity ? (
        <RunIndexResultsPanel
          chatHistory={chatHistory}
          chatConversation={chatConversation}
          questionItemRef={questionItemRef}
        />
      ) : (
        <IndexActivityEmptyState
          statusShownAbove={statusShownAbove}
          onOpenConfiguration={onOpenConfiguration}
        />
      )}
    </Box>
  );
});

IndexActivityPanel.displayName = 'IndexActivityPanel';

/** @type {MuiSx} */
const indexActivityPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
});

export default IndexActivityPanel;
