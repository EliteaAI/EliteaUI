import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const KpiCard = memo(props => {
  const { label, value, valueSuffix, subtitle, color, badge } = props;

  const styles = kpiCardStyles();

  return (
    <Box sx={styles.kpiCard}>
      <Typography
        variant="labelSmall"
        sx={styles.kpiLabel}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <Typography
          variant="headingMedium"
          sx={[styles.kpiValue, color ? { color } : {}]}
        >
          {value}
        </Typography>
        {valueSuffix && (
          <Typography
            variant="bodySmall"
            sx={styles.kpiValueSuffix}
          >
            {valueSuffix}
          </Typography>
        )}
        {badge && (
          <Typography
            variant="bodySmall"
            sx={({ palette }) => ({ color: palette.status.published, fontWeight: 600, fontSize: '0.75rem' })}
          >
            {badge}
          </Typography>
        )}
      </Box>
      {subtitle && (
        <Typography
          variant="bodySmall"
          sx={styles.kpiSubtitle}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
});

KpiCard.displayName = 'KpiCard';

/** @type {MuiSx} */
const kpiCardStyles = () => ({
  kpiCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }),
  kpiLabel: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
  }),
  kpiValue: ({ palette }) => ({ color: palette.text.secondary }),
  kpiValueSuffix: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.875rem',
  }),
  kpiSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    marginTop: '-0.125rem',
  }),
});

export default KpiCard;
