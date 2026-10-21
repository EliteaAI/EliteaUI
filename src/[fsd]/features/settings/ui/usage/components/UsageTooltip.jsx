import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const PREV_PERIOD_KEY = '__prev';

const UsageTooltip = memo(props => {
  const { active, payload, label, canSeeAmounts, currency, formatLabel } = props;

  const styles = usageTooltipStyles();

  if (!active || !payload?.length) return null;

  const formatValue = value =>
    canSeeAmounts ? UsageHelpers.formatMoney(value || 0, currency) : UsageHelpers.formatTokens(value);

  const series = payload.filter(entry => entry.dataKey !== PREV_PERIOD_KEY);
  const prevEntry = payload.find(entry => entry.dataKey === PREV_PERIOD_KEY);
  const total = series.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

  return (
    <Box sx={styles.tooltip}>
      <Typography
        variant="labelSmall"
        sx={styles.label}
      >
        {`${formatLabel ? formatLabel(label) : label} (UTC)`}
      </Typography>
      {series.map(entry => (
        <Box
          key={entry.dataKey}
          sx={styles.row}
        >
          <Box sx={styles.dot(entry.color)} />
          <Typography
            variant="bodySmall"
            sx={styles.name}
          >
            {entry.name}
          </Typography>
          <Typography variant="bodySmall">{formatValue(entry.value)}</Typography>
        </Box>
      ))}
      {series.length > 1 && (
        <Box sx={styles.row}>
          <Typography
            variant="labelSmall"
            sx={styles.name}
          >
            Total
          </Typography>
          <Typography variant="labelSmall">{formatValue(total)}</Typography>
        </Box>
      )}
      {prevEntry && (
        <Box sx={styles.row}>
          <Typography
            variant="bodySmall"
            sx={styles.name}
          >
            Prev. period
          </Typography>
          <Typography variant="bodySmall">{formatValue(prevEntry.value)}</Typography>
        </Box>
      )}
    </Box>
  );
});

UsageTooltip.displayName = 'UsageTooltip';

/** @type {MuiSx} */
const usageTooltipStyles = () => ({
  tooltip: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.default}`,
  }),
  label: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.25rem',
  }),
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.375rem',
  },
  dot: color => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  name: ({ palette }) => ({
    flex: 1,
    color: palette.text.secondary,
  }),
});

export default UsageTooltip;
