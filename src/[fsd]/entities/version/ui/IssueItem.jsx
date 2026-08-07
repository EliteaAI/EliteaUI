import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const IssueItem = memo(props => {
  const { item, type } = props;
  return (
    <Box sx={styles.issueItem}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {'• '}
        {item.field}
        {item.context && (
          <Typography
            component="span"
            variant="bodySmall"
            color="text.secondary"
            sx={styles.issueContext}
          >
            {` [${item.context}]`}
          </Typography>
        )}
        :
      </Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={{ paddingLeft: '0.75rem' }}
      >
        {type === 'suggestion' ? item.suggestion : item.issue}
      </Typography>
      {item.fix && (
        <Typography
          variant="bodySmall"
          color="text.tips"
          sx={{ paddingLeft: '0.75rem' }}
        >
          Fix: {item.fix}
        </Typography>
      )}
    </Box>
  );
});

IssueItem.displayName = 'IssueItem';

/** @type {MuiSx} */
const styles = {
  issueItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  issueContext: {
    fontWeight: 400,
    opacity: 0.7,
  },
};

export default IssueItem;
