import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const resolveEmptyMessage = (isFiltered, isCatalogSkill, isModelFilterUnavailable) => {
  if (isModelFilterUnavailable)
    return 'Usage data is unavailable right now, so runs cannot be filtered by model. Clear the model filter to see them.';
  if (isFiltered) return 'No runs match these filters.';
  if (isCatalogSkill)
    return 'No runs of this Catalog skill in this project yet. Run it from the Catalog, and its runs appear here.';
  return 'No runs yet. Run this skill from its Run panel, or add it to a chat, and its runs appear here.';
};

const SkillRunHistoryEmptyState = memo(props => {
  const { isFiltered, isCatalogSkill, isModelFilterUnavailable } = props;
  const styles = skillRunHistoryEmptyStateStyles();

  return (
    <Box
      sx={styles.emptyState}
      data-testid="skill-run-history-empty"
    >
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {resolveEmptyMessage(isFiltered, isCatalogSkill, isModelFilterUnavailable)}
      </Typography>
    </Box>
  );
});

SkillRunHistoryEmptyState.displayName = 'SkillRunHistoryEmptyState';

/** @type {MuiSx} */
const skillRunHistoryEmptyStateStyles = () => ({
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
});

export default SkillRunHistoryEmptyState;
