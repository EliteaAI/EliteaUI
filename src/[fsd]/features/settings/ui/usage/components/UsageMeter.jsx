import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const UsageMeter = memo(props => {
  const { percentUsed, primaryLabel, secondaryLabel } = props;

  const theme = useTheme();
  const severity = UsageHelpers.usageSeverity(percentUsed);
  const styles = usageMeterStyles(theme, severity);

  // No limit set means nothing to fill; show the bar empty rather than full
  const progress = percentUsed === null || percentUsed === undefined ? 0 : Math.min(percentUsed, 100);

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <Typography
          variant="bodySmall2"
          sx={styles.primary}
          data-testid="usage-meter-primary"
        >
          {primaryLabel}
        </Typography>
        {secondaryLabel && (
          <Typography
            variant="bodySmall2"
            sx={styles.secondary}
          >
            {secondaryLabel}
          </Typography>
        )}
      </Box>
      <Box sx={styles.barWrapper}>
        <Box sx={styles.barBackground}>
          <Box sx={styles.barFill(progress)} />
        </Box>
      </Box>
    </Box>
  );
});

UsageMeter.displayName = 'UsageMeter';

/** @type {MuiSx} */
const usageMeterStyles = (theme, severity) => {
  const isDarkMode = theme.palette.mode === 'dark';

  const gradients = {
    exceeded: 'linear-gradient(90deg, rgba(244, 67, 54, 0) 0%, #F44336 100%)',
    warning: 'linear-gradient(90deg, rgba(255, 193, 7, 0) 0%, #FFC107 100%)',
    ok: 'linear-gradient(90deg, rgba(19, 225, 60, 0) 0%, #0FA52D 100%)',
    none: 'linear-gradient(90deg, rgba(19, 225, 60, 0) 0%, #0FA52D 100%)',
  };

  return {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.375rem',
      alignSelf: 'stretch',
      width: '100%',
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    primary: ({ palette }) => ({
      color: palette.text.secondary,
      fontWeight: 600,
    }),
    secondary: ({ palette }) => ({
      color: palette.text.metrics || palette.text.disabled,
    }),
    barWrapper: {
      height: '0.5rem',
      alignSelf: 'stretch',
      position: 'relative',
    },
    barBackground: {
      position: 'absolute',
      inset: 0,
      backgroundColor: isDarkMode ? theme.palette.border.lines : '#3D44561A',
      borderRadius: '0.3125rem',
    },
    barFill: percentage => ({
      position: 'absolute',
      width: `${percentage}%`,
      left: 0,
      top: 0,
      bottom: 0,
      background: gradients[severity],
      borderRadius: '0.3125rem',
      transition: 'width 0.3s ease',
    }),
  };
};

export default UsageMeter;
