import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import RocketIcon from '@/assets/rocket-icon.svg?react';

const IndexSearchEmptyState = memo(props => {
  const { searchToolOptions, onChangeTool, blockedReason } = props;
  const styles = indexSearchEmptyStateStyles();

  if (!searchToolOptions.length) {
    return (
      <Box
        sx={styles.root}
        data-testid="index-search-empty-state"
      >
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          No search tools are enabled for this toolkit.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="index-search-empty-state"
    >
      <Box sx={styles.icon}>
        <RocketIcon />
      </Box>
      <Typography
        variant="bodyMedium"
        color="text.primary"
      >
        Choose a tool from the list to configure parameters and run the test.
      </Typography>
      <Tooltip title={blockedReason ?? ''}>
        <Box component="span">
          <Select.PopoverSelect
            data-testid="index-search-tool-select"
            options={searchToolOptions}
            onValueChange={onChangeTool}
            label="Select Tool"
            placeholder="Search tools..."
            emptyPlaceholder="No tools found"
            disabled={Boolean(blockedReason)}
          />
        </Box>
      </Tooltip>
    </Box>
  );
});

IndexSearchEmptyState.displayName = 'IndexSearchEmptyState';

/** @type {MuiSx} */
const indexSearchEmptyStateStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '20.5rem',
    margin: '0 auto',
    padding: '2.5rem 0 0 0',
    textAlign: 'center',
  },
  icon: ({ palette }) => ({
    display: 'flex',
    color: palette.icon.fill.disabled,
    opacity: 0.5,
    '> svg': {
      width: '2rem',
      height: '2rem',
    },
  }),
});

export default IndexSearchEmptyState;
