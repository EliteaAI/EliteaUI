import * as React from 'react';

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

export default function LinearProgressWithLabel({ value, showLabel = true, sx = {}, color = undefined }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          color={color}
        />
      </Box>
      {showLabel && (
        <Box width={'40px'}>
          <Typography
            variant="bodySmall"
            sx={{ color: 'text.secondary' }}
          >
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};
