import { memo } from 'react';

import { Box } from '@mui/material';

import { RunIndexBanner } from '@/[fsd]/features/toolkits/indexes/ui';

import RunIndexResultsPanel from '../RunIndexResultsPanel';

const IndexError = memo(props => {
  const {
    banner,
    chatHistory,
    chatConversation,
    questionItemRef,
    isIndexing,
    isStoppingIndexing,
    onStop,
    showResults,
  } = props;
  const styles = getStyles();

  return (
    <>
      <RunIndexBanner
        banner={banner}
        isIndexing={isIndexing}
        isStoppingIndexing={isStoppingIndexing}
        onStop={onStop}
      />
      <Box sx={styles.body}>
        {showResults && (
          <RunIndexResultsPanel
            chatHistory={chatHistory}
            chatConversation={chatConversation}
            questionItemRef={questionItemRef}
          />
        )}
      </Box>
    </>
  );
});

IndexError.displayName = 'IndexError';

/** @type {MuiSx} */
const getStyles = () => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    flex: 1,
    minHeight: 0,
  },
});

export default IndexError;
