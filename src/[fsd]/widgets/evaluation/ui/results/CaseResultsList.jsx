import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import CaseResultItem from './CaseResultItem';

const CaseResultsList = memo(props => {
  const { cases = [], onViewDetails, onEvaluate } = props;

  const styles = caseResultsListStyles();

  if (cases.length === 0) {
    return null;
  }

  return (
    <Box
      sx={styles.root}
      data-testid="case-results-list"
    >
      <Typography
        variant="bodyMedium"
        sx={styles.title}
      >
        Cases
      </Typography>
      <Box sx={styles.list}>
        {cases.map(card => (
          <CaseResultItem
            key={card.id}
            card={card}
            onViewDetails={onViewDetails}
            onEvaluate={onEvaluate}
          />
        ))}
      </Box>
    </Box>
  );
});

CaseResultsList.displayName = 'CaseResultsList';

/** @type {MuiSx} */
const caseResultsListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0 1.5rem 1.5rem 1.5rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
});

export default CaseResultsList;
