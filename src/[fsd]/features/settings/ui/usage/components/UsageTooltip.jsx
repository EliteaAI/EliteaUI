import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const UsageTooltip = memo(props => {
  const { active, payload, label, canSeeAmounts, currency } = props;

  const styles = usageTooltipStyles();

  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload || {};

  const isGrouped = payload.length > 1 || (payload[0]?.dataKey && payload[0].dataKey !== 'spend');

  const totalSpend = isGrouped
    ? payload.reduce((sum, entry) => sum + (typeof entry.value === 'number' ? entry.value : 0), 0)
    : point.spend;

  const totalRequests = isGrouped ? null : point.api_requests;
  const totalTokens = isGrouped ? null : point.total_tokens;

  return (
    <Box sx={styles.tooltip}>
      <Typography
        variant="labelSmall"
        sx={styles.label}
      >
        {label}
      </Typography>
      {canSeeAmounts && (
        <Typography variant="bodySmall">Cost: {UsageHelpers.formatMoney(totalSpend, currency)}</Typography>
      )}
      {!isGrouped && (
        <>
          <Typography variant="bodySmall">Calls: {totalRequests || 0}</Typography>
          <Typography variant="bodySmall">Tokens: {UsageHelpers.formatTokens(totalTokens)}</Typography>
        </>
      )}
      {isGrouped &&
        payload.map((entry, i) => (
          <Typography
            key={i}
            variant="bodySmall"
          >
            {entry.name}: {UsageHelpers.formatMoney(entry.value, currency)}
          </Typography>
        ))}
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
});

export default UsageTooltip;
