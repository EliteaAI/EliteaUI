import { memo } from 'react';

import { IconButton, Tooltip } from '@mui/material';

import PlusIcon from '@/assets/plus-icon.svg?react';

const AddButton = memo(({ onAdd, tooltip = 'Add', sx }) => {
  const styles = getStyles();

  return (
    <Tooltip
      title={tooltip}
      placement="top"
    >
      <IconButton
        disableRipple
        variant="elitea"
        color="primary"
        onClick={onAdd}
        sx={[styles.button, sx]}
      >
        <PlusIcon style={styles.icon} />
      </IconButton>
    </Tooltip>
  );
});

AddButton.displayName = 'AddButton';

/** @type {MuiSx} */
const getStyles = () => ({
  button: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: '.5rem',
    '& svg': {
      fill: palette.icon.fill.send,
    },
  }),
  icon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
});

export default AddButton;
