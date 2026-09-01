import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { BreadcrumbsOrTitle } from '@/[fsd]/shared/ui';

const AgentEvaluateDatasetsPage = memo(() => {
  const styles = agentEvaluateDatasetsPageStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <BreadcrumbsOrTitle title="Manage Datasets" />
      </Box>
      <Box sx={styles.body}>
        <Box sx={styles.placeholder}>
          <Typography
            variant="headingSmall"
            sx={styles.placeholderTitle}
          >
            Manage Datasets
          </Typography>
          <Typography
            variant="bodyMedium"
            sx={styles.placeholderText}
          >
            This page will be implemented in a separate story.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

AgentEvaluateDatasetsPage.displayName = 'AgentEvaluateDatasetsPage';

/** @type {MuiSx} */
const agentEvaluateDatasetsPageStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    width: '100%',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
  }),
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '0.5rem',
  },
  placeholderTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  placeholderText: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default AgentEvaluateDatasetsPage;
