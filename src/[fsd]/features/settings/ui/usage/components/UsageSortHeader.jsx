import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const UsageSortHeader = memo(props => {
  const { label, keyName, flex, sortKey, sortDir, onSort, sortable = true, right = true } = props;

  const isActive = sortKey === keyName;

  return (
    <Box
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          flex,
          ...(right && { justifyContent: 'flex-end', textAlign: 'right' }),
          ...(sortable && { cursor: 'pointer', userSelect: 'none' }),
        },
      ]}
      onClick={sortable ? () => onSort(keyName) : undefined}
      role={sortable ? 'button' : undefined}
      tabIndex={sortable ? 0 : undefined}
      onKeyDown={sortable ? e => e.key === 'Enter' && onSort(keyName) : undefined}
    >
      <Typography
        sx={({ palette }) => ({
          fontSize: '0.6875rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: isActive ? palette.primary.main : palette.text.metrics || palette.text.disabled,
        })}
      >
        {label}
        {isActive && <Box component="span">{sortDir === 'desc' ? ' ▼' : ' ▲'}</Box>}
      </Typography>
    </Box>
  );
});

UsageSortHeader.displayName = 'UsageSortHeader';

export default UsageSortHeader;
