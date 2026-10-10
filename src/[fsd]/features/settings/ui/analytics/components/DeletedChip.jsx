import { memo } from 'react';

import { Chip } from '@mui/material';

const DeletedChip = memo(props => {
  const { testId } = props;

  const styles = deletedChipStyles();

  return (
    <Chip
      size="small"
      label="Deleted"
      sx={styles.chip}
      data-testid={testId}
    />
  );
});

DeletedChip.displayName = 'DeletedChip';

/** @type {MuiSx} */
const deletedChipStyles = () => ({
  chip: ({ palette }) => ({
    height: '1.25rem',
    fontSize: '0.6875rem',
    flexShrink: 0,
    color: palette.text.secondary,
    backgroundColor: palette.background.default.secondary || 'transparent',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
});

export default DeletedChip;
