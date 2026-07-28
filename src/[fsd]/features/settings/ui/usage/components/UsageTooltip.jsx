import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const UsageTooltip = memo(props => {
  const { active, payload, label, canSeeAmounts, currency } = props;

  const styles = usageTooltipStyles();

  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload || {};

  return (
    <Box sx={styles.tooltip}>
      <Typography
        variant="labelSmall"
        sx={styles.label}
      >
        {label}
      </Typography>
      {canSeeAmounts && (
        <Typography variant="bodySmall">Cost: {UsageHelpers.formatMoney(point.spend, currency)}</Typography>
      )}
      <Typography variant="bodySmall">Calls: {point.api_requests || 0}</Typography>
      <Typography variant="bodySmall">Tokens: {UsageHelpers.formatTokens(point.total_tokens)}</Typography>
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
    backgroundColor: palette.background.secondary,
    border: `1px solid ${palette.border.table}`,
  }),
  label: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.25rem',
  }),
});

export default UsageTooltip;
