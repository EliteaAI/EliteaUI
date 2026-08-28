import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

const KpiCard = memo(props => {
  const {
    label,
    value,
    valueSuffix,
    subtitle,
    color,
    badge,
    tooltip,
    testId,
    valueTestId,
    labelTestId,
    subtitleTestId,
    valueSuffixTestId,
    badgeTestId,
  } = props;

  const styles = kpiCardStyles();

  return (
    <Box
      sx={styles.kpiCard}
      data-testid={testId}
    >
      <Box sx={styles.kpiLabelRow}>
        <Typography
          variant="labelSmall"
          sx={styles.kpiLabel}
          data-testid={labelTestId}
        >
          {label}
        </Typography>
        {tooltip && (
          <InfoTooltip
            infoTooltip={{
              title: tooltip,
              icon: { width: 12, height: 12 },
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <Typography
          variant="headingMedium"
          sx={[styles.kpiValue, color ? { color } : {}]}
          data-testid={valueTestId}
        >
          {value}
        </Typography>
        {valueSuffix && (
          <Typography
            variant="bodySmall"
            sx={styles.kpiValueSuffix}
            data-testid={valueSuffixTestId}
          >
            {valueSuffix}
          </Typography>
        )}
        {badge && (
          <Typography
            variant="bodySmall"
            sx={({ palette }) => ({ color: palette.status.published, fontWeight: 600, fontSize: '0.75rem' })}
            data-testid={badgeTestId}
          >
            {badge}
          </Typography>
        )}
      </Box>
      {subtitle && (
        <Typography
          variant="bodySmall"
          sx={styles.kpiSubtitle}
          data-testid={subtitleTestId}
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
  kpiLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
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
