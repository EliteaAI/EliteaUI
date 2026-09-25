import { memo } from 'react';

import { ListItem } from '@mui/material';

const DiscoverySearchListItem = memo(props => {
  const { children, disabled = false, sx, ...restProps } = props;
  const styles = discoverySearchListItemStyles(disabled);

  return (
    <ListItem
      {...restProps}
      aria-disabled={disabled || undefined}
      sx={[styles.root, sx]}
    >
      {children}
    </ListItem>
  );
});

DiscoverySearchListItem.displayName = 'DiscoverySearchListItem';

/** @type {MuiSx} */
const discoverySearchListItemStyles = isDisabled => ({
  root: ({ palette, typography }) => ({
    ...typography.bodyMedium,
    fontWeight: palette.mode === 'light' ? 500 : 400,
    width: '100%',
    minHeight: '2.5rem',
    boxSizing: 'border-box',
    gap: '1rem',
    padding: '0.5rem 1rem',
    color: palette.text.secondary,
    cursor: isDisabled ? 'default' : 'pointer',
    ...(isDisabled
      ? {
          color: palette.text.muted,
          opacity: 1,
        }
      : {
          '&:hover': {
            backgroundColor: palette.background.interactiveItem.hover,
          },
        }),
  }),
});

export default DiscoverySearchListItem;
