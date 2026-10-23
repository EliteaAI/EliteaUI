import { memo } from 'react';

import { Box, useTheme } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const UsageSparkline = memo(props => {
  const { values = [] } = props;
  const { palette } = useTheme();
  const path = UsageHelpers.buildSparklinePath(values);

  if (!path) return null;

  return (
    <Box sx={{ width: '4rem', height: '1.25rem', flexShrink: 0 }}>
      <svg
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <path
          d={path}
          fill="none"
          stroke={palette.primary.main}
          strokeWidth="2.5"
        />
      </svg>
    </Box>
  );
});

UsageSparkline.displayName = 'UsageSparkline';

export default UsageSparkline;
