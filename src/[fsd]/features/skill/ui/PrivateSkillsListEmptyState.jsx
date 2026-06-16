import { memo } from 'react';

import { Box } from '@mui/material';

const PrivateSkillsListEmptyState = memo(({ query }) => {
  if (!query) {
    return <Box>{`You have no skills.`}</Box>;
  }
  return (
    <Box>
      Nothing found. <br />
      Create yours now!
    </Box>
  );
});

PrivateSkillsListEmptyState.displayName = 'PrivateSkillsListEmptyState';

export default PrivateSkillsListEmptyState;
