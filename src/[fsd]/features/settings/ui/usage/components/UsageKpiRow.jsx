import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { useUsageKpiMetrics } from '@/[fsd]/features/settings/lib/hooks';

import UsageDeltaChip from './UsageDeltaChip';
import UsageSparkline from './UsageSparkline';

const UsageKpiRow = memo(props => {
  const { data, canSeeAmounts, isCurrentPeriod = true, comparisonData, comparisonLabel } = props;

  const styles = usageKpiRowStyles();

  const { kpis } = useUsageKpiMetrics({
    data,
    canSeeAmounts,
    isCurrentPeriod,
    comparisonData,
    comparisonLabel,
  });

  return (
    <Box sx={styles.row}>
      {kpis.map(kpi => (
        <Box
          key={kpi.id}
          sx={styles.card}
          data-testid={kpi.testId}
        >
          {/* Label row: label left, sparkline right */}
          <Box sx={styles.labelRow}>
            <Typography
              variant="subtitle"
              sx={styles.label}
            >
              {kpi.label}
            </Typography>
            {kpi.sparkline && <UsageSparkline values={kpi.sparkline} />}
          </Box>

          {/* Value row */}
          <Typography sx={styles.value}>{kpi.value}</Typography>

          {/* Footer row: delta chip + subtitle inline */}
          <Box sx={styles.footerRow}>
            {kpi.delta && (
              <UsageDeltaChip
                delta={kpi.delta}
                testId={`usage-kpi-delta-${kpi.id}`}
              />
            )}
            <Typography
              variant="bodySmall"
              sx={styles.subtitle}
            >
              {kpi.subtitlePrefix && (
                <Box
                  component="span"
                  sx={styles.subtitleDash}
                >
                  {kpi.subtitlePrefix}
                </Box>
              )}
              {kpi.subtitle}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
});

UsageKpiRow.displayName = 'UsageKpiRow';

/** @type {MuiSx} */
const usageKpiRowStyles = () => ({
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.75rem',
  },
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  labelRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: ({ palette }) => ({
    flex: 1,
    fontWeight: 600,
    color: palette.text.hint || palette.text.disabled,
  }),
  value: ({ palette }) => ({
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
    color: palette.text.secondary,
  }),
  footerRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
  },
  subtitle: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.hint || palette.text.disabled,
  }),
  subtitleDash: ({ palette }) => ({
    color: palette.text.hint || palette.text.disabled,
  }),
});

export default UsageKpiRow;
