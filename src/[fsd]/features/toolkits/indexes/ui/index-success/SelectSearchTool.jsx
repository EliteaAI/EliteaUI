import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import RocketIcon from '@/components/Icons/RocketIcon';

const SelectSearchTool = memo(props => {
  const { searchToolOptions, selectedSearchTool, onSelectSearchTool, disabled } = props;
  const styles = getStyles();

  if (searchToolOptions.length === 0) {
    return (
      <Box sx={styles.noTools}>
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          No run tools are enabled for this toolkit.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.iconWrap}>
        <RocketIcon />
      </Box>
      <Box sx={styles.infoContainer}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Search Index
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          Choose a tool from the list to configure parameters and test it.
        </Typography>
      </Box>
      <Select.PopoverSelect
        options={searchToolOptions}
        onValueChange={onSelectSearchTool}
        value={selectedSearchTool}
        label="Select Tool"
        placeholder="Search tools..."
        emptyPlaceholder="No tools found"
        disabled={disabled}
      />
    </Box>
  );
});

SelectSearchTool.displayName = 'SelectSearchTool';

/** @type {MuiSx} */
const getStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '20.5rem',
    padding: '3.75rem 0 0 0',
  },
  iconWrap: ({ palette }) => ({
    marginBottom: '0.25rem',
    color: palette.icon.fill.disabled,
    '& svg': {
      width: '2rem',
      height: '2rem',
      opacity: 0.5,
    },
  }),
  infoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    textAlign: 'center',
  },
  noTools: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    width: '100%',
  },
});

export default SelectSearchTool;
