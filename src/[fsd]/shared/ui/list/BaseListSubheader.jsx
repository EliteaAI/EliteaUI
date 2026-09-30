import { memo } from 'react';

import { ListSubheader } from '@mui/material';

const BaseListSubheader = memo(props => {
  const { children, sx, disabled, ...restProps } = props;
  const styles = baseListSubheaderStyles();

  return (
    <ListSubheader
      {...restProps}
      aria-disabled={disabled || undefined}
      sx={[styles.root, sx]}
    >
      {children}
    </ListSubheader>
  );
});

BaseListSubheader.displayName = 'BaseListSubheader';

/** @type {MuiSx} */
const baseListSubheaderStyles = () => ({
  root: ({ palette, typography }) => ({
    ...typography.bodyMedium,
    display: 'flex',
    alignItems: 'center',
    padding: '0.875rem 0 0.375rem',
    backgroundColor: palette.background.default.secondary,
  }),
});

export default BaseListSubheader;
