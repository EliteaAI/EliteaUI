import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import AddIndexButton from '@/[fsd]/features/toolkits/indexes/ui/AddIndexButton';
import FileCodeIcon from '@/assets/file-code.svg?react';

const IndexesEmptyState = memo(props => {
  const { canIndex = true, onAddIndex } = props;

  const styles = indexesEmptyStateStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="toolkit-indexes-empty-state"
    >
      <FileCodeIcon
        width="2rem"
        height="2rem"
      />
      <Box sx={styles.textContainer}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          No indexes created yet.
        </Typography>
        {canIndex && (
          <Typography
            variant="bodyMedium"
            color="text.primary"
          >
            Create an index to add knowledge sources to this toolkit.
          </Typography>
        )}
      </Box>
      {canIndex && <AddIndexButton onClick={onAddIndex} />}
    </Box>
  );
});

IndexesEmptyState.displayName = 'IndexesEmptyState';

/** @type {MuiSx} */
const indexesEmptyStateStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    gap: '1.5rem',
    paddingTop: '1rem',
    textAlign: 'center',
    color: ({ palette }) => palette.icon.fill.disabled,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    maxWidth: '20.5rem',
  },
});

export default IndexesEmptyState;
