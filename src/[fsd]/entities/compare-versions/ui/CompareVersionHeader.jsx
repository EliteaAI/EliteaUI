import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { formatVersionMeta } from '../lib/helpers/compareVersions.helpers';

const CompareVersionHeader = memo(props => {
  const { version } = props;
  const meta = useMemo(() => formatVersionMeta(version), [version]);

  return (
    <Box sx={compareVersionHeaderStyles.root}>
      <Typography
        variant="labelMedium"
        color="text.secondary"
      >
        {version?.name}
      </Typography>
      {meta && (
        <Typography
          variant="labelSmall"
          color="text.primary"
        >
          {meta}
        </Typography>
      )}
    </Box>
  );
});

CompareVersionHeader.displayName = 'CompareVersionHeader';

/** @type {MuiSx} */
const compareVersionHeaderStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    lineHeight: '1',
  },
};

export default CompareVersionHeader;
