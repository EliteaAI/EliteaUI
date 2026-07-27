import { memo } from 'react';

import { Alert, Box, Chip, Typography } from '@mui/material';

import { KPICard } from '@/[fsd]/features/analytics/ui';
import {
  formatLimit,
  formatMoney,
  formatResetLabel,
  formatTokens,
  usageSeverity,
} from '@/[fsd]/features/usage/lib/usage.helpers';
import UsageMeter from '@/[fsd]/features/usage/ui/components/UsageMeter';

const LIMIT_SOURCE_HINT = {
  explicit: 'A limit was set specifically for this scope.',
  default: 'No specific limit is set, so the platform default applies.',
  unlimited: 'No limit is currently applied.',
};

const UsageSummary = memo(props => {
  const { data, scope, isPersonalProject } = props;

  const styles = usageSummaryStyles();

  const {
    spend,
    effective_limit: limit,
    percent_used: percentUsed,
    limit_source: limitSource,
    currency = 'USD',
    total_tokens: totalTokens,
    api_requests: apiRequests,
    resets_at: resetsAt,
    can_see_amounts: canSeeAmounts,
  } = data;

  const severity = usageSeverity(percentUsed);

  const primaryLabel = canSeeAmounts
    ? `${formatMoney(spend, currency)} of ${formatLimit(limit, currency)}`
    : percentUsed === null || percentUsed === undefined
      ? 'No limit applied'
      : `${percentUsed}% of your limit used`;

  // The reset chip already states this, so only show a percentage here when there is one
  const secondaryLabel = percentUsed === null || percentUsed === undefined ? '' : `${percentUsed}%`;

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.meterCard}>
        <Box sx={styles.meterHeader}>
          <Typography
            variant="labelMedium"
            sx={styles.title}
          >
            {scope === 'user' ? 'My usage this month' : 'Project usage this month'}
          </Typography>
          <Chip
            size="small"
            label={formatResetLabel(resetsAt)}
            sx={styles.resetChip}
          />
        </Box>

        <UsageMeter
          percentUsed={percentUsed}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
        />

        <Typography
          variant="bodySmall"
          sx={styles.hint}
        >
          {LIMIT_SOURCE_HINT[limitSource] || ''}
        </Typography>

        {severity === 'exceeded' && (
          <Alert
            severity="error"
            sx={styles.alert}
          >
            This budget is exhausted. Calls to shared models are being rejected until the limit is raised or
            the period resets.
          </Alert>
        )}
        {severity === 'warning' && (
          <Alert
            severity="warning"
            sx={styles.alert}
          >
            You have used over 80% of this budget.
          </Alert>
        )}
      </Box>

      <Box sx={styles.kpiRow}>
        {canSeeAmounts && (
          <KPICard
            label="SPEND"
            value={formatMoney(spend, currency)}
            subtitle="this billing period"
          />
        )}
        <KPICard
          label="TOKENS"
          value={formatTokens(totalTokens)}
          subtitle="prompt and completion"
        />
        <KPICard
          label="CALLS"
          value={String(apiRequests || 0)}
          subtitle="requests to shared models"
        />
        <KPICard
          label="LIMIT"
          value={canSeeAmounts ? formatLimit(limit, currency) : limit ? 'Set' : 'Unlimited'}
          subtitle={limitSource === 'default' ? 'platform default' : 'monthly'}
        />
      </Box>

      {isPersonalProject && (
        <Alert
          severity="info"
          sx={styles.alert}
        >
          This is your private project. Requests that do not specify a project are billed here — including
          personal access tokens used by external tools such as Claude Code, IDE extensions and your own
          scripts.
        </Alert>
      )}
    </Box>
  );
});

UsageSummary.displayName = 'UsageSummary';

/** @type {MuiSx} */
const usageSummaryStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  meterCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${palette.border.lines}`,
    backgroundColor: palette.background.secondary,
  }),
  meterHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  resetChip: ({ palette }) => ({
    height: '1.25rem',
    fontSize: '0.6875rem',
    color: palette.text.metrics || palette.text.disabled,
    backgroundColor: palette.background.userInputBackground || 'transparent',
  }),
  hint: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  kpiRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  alert: {
    fontSize: '0.8125rem',
  },
});

export default UsageSummary;
