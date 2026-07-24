import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';

import RunIndexResultsPanel from '../RunIndexResultsPanel';

const SearchResult = memo(props => {
  const { chatHistory, chatConversation, questionItemRef, onBack } = props;
  const styles = getStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Button.BaseBtn
          size="small"
          onClick={onBack}
          sx={styles.backButton}
          startIcon={<ArrowBackIcon sx={styles.icon} />}
        />
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Search Results
        </Typography>
      </Box>
      <RunIndexResultsPanel
        chatHistory={chatHistory}
        chatConversation={chatConversation}
        questionItemRef={questionItemRef}
      />
    </Box>
  );
});

SearchResult.displayName = 'SearchResult';

/** @type {MuiSx} */
const getStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 0',
    width: '100%',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    background: ({ palette }) => palette.background.aiProviderAccordion.default,
    borderBottom: ({ palette }) => `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    height: '3rem',
    width: '100%',
    padding: '0.5rem 1.5rem',
    gap: '1rem',
  },
  backButton: ({ palette }) => ({
    padding: '0.375rem',
    borderRadius: '1rem',
    color: palette.text.secondary,
  }),
  icon: {
    fontSize: '1rem',
  },
});

export default SearchResult;
