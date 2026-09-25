import { memo } from 'react';

import { List } from '@mui/material';

const DiscoverySearchList = memo(props => {
  const { children, sx, ...restProps } = props;
  const styles = discoverySearchListStyles();

  return (
    <List
      {...restProps}
      sx={[styles.root, sx]}
    >
      {children}
    </List>
  );
});

DiscoverySearchList.displayName = 'DiscoverySearchList';

/** @type {MuiSx} */
const discoverySearchListStyles = () => ({
  root: ({ palette }) => ({
    maxHeight: '33.125rem',
    marginTop: '0.25rem',
    padding: 0,
    overflow: 'auto',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    backgroundColor: palette.background.default.secondary,
    boxSizing: 'border-box',
    '& > * + .discovery-search-list-subheader': {
      borderTop: `0.0625rem solid ${palette.border.lines}`,
    },
  }),
});

export default DiscoverySearchList;
