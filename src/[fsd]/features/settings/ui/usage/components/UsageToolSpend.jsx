import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

import UsageMeter from './UsageMeter';

const callsLabel = calls => `${calls || 0} ${calls === 1 ? 'call' : 'calls'}`;

// Paid tools (e.g. web search) have their own limits and never count toward the LLM budget above
const UsageToolSpend = memo(props => {
  const { features = [], canSeeAmounts } = props;

  const styles = usageToolSpendStyles();

  if (!features.length) return null;

  return (
    <Box
      sx={styles.card}
      data-testid="usage-tool-spend"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Paid Tools
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.subtitle}
      >
        Tracked separately from model usage, each against its own monthly limit. Calls made with your own
        provider key are not counted.
      </Typography>

      {features.map(item => {
        const limited = item.percent_used !== null && item.percent_used !== undefined;
        const primary = canSeeAmounts
          ? `${item.label}: ${UsageHelpers.formatMoney(item.spend, item.currency)} of ${UsageHelpers.formatLimit(item.effective_limit, item.currency)}`
          : `${item.label}: ${limited ? `${item.percent_used}% of limit` : 'no limit'}`;

        return (
          <Box
            key={item.feature}
            sx={styles.feature}
          >
            <UsageMeter
              percentUsed={item.percent_used}
              primaryLabel={item.enabled === false ? `${item.label}: turned off for this project` : primary}
              secondaryLabel={callsLabel(item.calls)}
            />
          </Box>
        );
      })}
    </Box>
  );
});

UsageToolSpend.displayName = 'UsageToolSpend';

/** @type {MuiSx} */
const usageToolSpendStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    flex: '0 0 auto',
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  feature: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export default UsageToolSpend;
