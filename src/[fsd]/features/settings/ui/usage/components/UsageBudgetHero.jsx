import { memo, useMemo } from 'react';

import { Alert, Box, Chip, Typography } from '@mui/material';

import { PeriodConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

import UsageMeter from './UsageMeter';

const UsageBudgetHero = memo(props => {
  const { data, scope, isCurrentPeriod = true, canSeeAmounts, forecast, exceedDay } = props;

  const styles = usageBudgetHeroStyles();

  const {
    spend,
    effective_limit: limit,
    percent_used: percentUsed,
    currency = 'USD',
    resets_at: resetsAt,
    warning_pct: warningPct,
    period_start: periodStart,
  } = data;

  const severity = UsageHelpers.usageSeverity(percentUsed, warningPct);

  // Build "October 2026" and abbreviated "Oct" + daysInMonth from periodStart
  const { periodMonthYear, mon, daysInMonth } = useMemo(() => {
    if (!periodStart) return { periodMonthYear: '', mon: '', daysInMonth: 31 };

    const d = new Date(periodStart + 'T00:00:00Z');
    const fullName = PeriodConstants.MONTH_NAMES[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const days = new Date(year, d.getUTCMonth() + 1, 0).getUTCDate();

    return {
      periodMonthYear: `${fullName} ${year}`,
      mon: fullName.slice(0, 3),
      daysInMonth: days,
    };
  }, [periodStart]);

  const scopeLabel = scope === 'user' ? 'My usage' : 'Project usage';
  const titleText = periodMonthYear ? `${scopeLabel} · ${periodMonthYear}` : scopeLabel;

  const getResetChipLabel = () => {
    if (!isCurrentPeriod) return 'Closed';
    if (!resetsAt) return '';

    const d = new Date(resetsAt);
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    const resetMon = PeriodConstants.MONTH_NAMES[d.getMonth()].slice(0, 3);
    const day = d.getDate();
    const daysStr = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;

    return `Resets ${resetMon} ${day} (${daysStr})`;
  };

  const hasLimit = limit != null;
  const fcReady = !!forecast;

  // Status dot + text color: gray when no limit or past period, else severity-based
  const getStatusColor = palette => {
    if (!isCurrentPeriod) return palette.text.hint;
    if (!hasLimit) return palette.text.hint;
    if (severity === 'exceeded') return palette.error.main;
    if (severity === 'warning') return palette.warning.main;
    return palette.text.success;
  };

  const getStatusText = () => {
    if (!isCurrentPeriod) {
      return `${periodMonthYear} is closed.${canSeeAmounts && spend ? ` ${UsageHelpers.formatMoney(spend, currency)} spent this period.` : ''}`;
    }

    // No limit
    if (!hasLimit) {
      if (!fcReady) return 'Forecast available from day 3.';
      if (canSeeAmounts)
        return `Forecast ${UsageHelpers.formatMoney(forecast, currency)} by ${mon} ${daysInMonth}.`;
      return `Forecast by ${mon} ${daysInMonth}.`;
    }

    // Limit exceeded
    if (severity === 'exceeded') {
      const resetsStr = resetsAt
        ? `${PeriodConstants.MONTH_NAMES[new Date(resetsAt).getMonth()].slice(0, 3)} ${new Date(resetsAt).getDate()}`
        : 'next period';
      return `Limit reached. Requests to shared models are blocked until ${resetsStr}.`;
    }

    // Forecast exceeds limit
    if (exceedDay) {
      const forecastStr = canSeeAmounts
        ? UsageHelpers.formatMoney(forecast, currency)
        : `${Math.round((forecast / limit) * 100)}% of limit`;
      return `Forecast to exceed the limit on ${mon} ${exceedDay} (forecast ${forecastStr}).`;
    }

    // On track with limit
    if (fcReady && canSeeAmounts) {
      const pct = limit > 0 ? Math.round((forecast / limit) * 100) : 0;
      return `On track: forecast ${UsageHelpers.formatMoney(forecast, currency)} (${pct}% of limit) by ${mon} ${daysInMonth}.`;
    }

    if (fcReady) {
      return `On track: ≈ ${Math.round((forecast / limit) * 100)}% of limit by ${mon} ${daysInMonth}.`;
    }

    return 'On track';
  };

  const getHintText = () => {
    if (!isCurrentPeriod) return "Limits aren't shown for past periods.";
    if (!hasLimit) return 'No limit is currently applied to this scope.';
    return scope === 'user'
      ? 'Your personal limit in this project.'
      : 'A limit was set specifically for this scope.';
  };

  const forecastPct = forecast && limit ? Math.min((forecast / limit) * 100, 100) : null;
  const resetChipLabel = getResetChipLabel();
  const hintText = getHintText();

  return (
    <Box
      sx={styles.card}
      data-testid="usage-meter-primary"
    >
      {/* Title row */}
      <Box sx={styles.titleRow}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          {titleText}
        </Typography>
        {resetChipLabel && (
          <Chip
            size="small"
            label={resetChipLabel}
            sx={styles.resetChip(!isCurrentPeriod)}
          />
        )}
      </Box>

      {/* Spend row */}
      {canSeeAmounts && (
        <Box sx={styles.spendRow}>
          <Box sx={styles.spendLeft}>
            <Typography
              component="span"
              sx={styles.spendAmount}
            >
              {hasLimit
                ? `${UsageHelpers.formatMoney(spend, currency)} of ${UsageHelpers.formatMoney(limit, currency)}`
                : UsageHelpers.formatMoney(spend, currency)}
            </Typography>
            <Typography
              variant="bodyMedium"
              component="span"
              sx={styles.spendLabel}
            >
              {hasLimit ? ' spent' : ' spent, no limit applied'}
            </Typography>
          </Box>
          {hasLimit && percentUsed != null && (
            <Typography
              variant="bodyMedium"
              sx={styles.percentUsed}
            >
              {percentUsed}% used
            </Typography>
          )}
        </Box>
      )}

      {/* Progress bar + forecast tick (only when limit exists) */}
      {hasLimit && (
        <Box sx={styles.barWrapper}>
          <UsageMeter
            percentUsed={percentUsed}
            primaryLabel={
              canSeeAmounts
                ? `${UsageHelpers.formatMoney(spend, currency)} of ${UsageHelpers.formatLimit(limit, currency)}`
                : percentUsed == null
                  ? 'No limit applied'
                  : `${percentUsed}% of your limit used`
            }
            secondaryLabel={percentUsed === null || percentUsed === undefined ? '' : `${percentUsed}%`}
            warningPct={warningPct}
          />
          {forecastPct !== null && isCurrentPeriod && (
            <Box sx={styles.forecastTickWrapper(forecastPct)}>
              <Box sx={styles.forecastTick} />
              <Typography
                variant="bodySmall"
                sx={styles.forecastTickLabel}
              >
                Forecast
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Status line with colored dot */}
      <Box sx={styles.statusRow}>
        <Box
          component="span"
          sx={styles.statusDot(getStatusColor)}
        />
        <Typography
          variant="bodySmall"
          sx={styles.statusText(getStatusColor)}
        >
          {getStatusText()}
        </Typography>
      </Box>

      {/* Hint text (second gray line) */}
      {hintText && (
        <Typography
          variant="bodySmall"
          sx={styles.hintText}
        >
          {hintText}
        </Typography>
      )}

      {/* Alerts */}
      {isCurrentPeriod && severity === 'exceeded' && (
        <Alert
          severity="error"
          sx={styles.alert}
        >
          This budget has been reached. Requests to platform-shared models are unavailable until the limit is
          increased or the current budget period resets.
        </Alert>
      )}
      {isCurrentPeriod && severity === 'warning' && (
        <Alert
          severity="warning"
          sx={styles.alert}
        >
          This budget is nearing its limit. {Math.round(percentUsed)}% has been used.
        </Alert>
      )}
    </Box>
  );
});

UsageBudgetHero.displayName = 'UsageBudgetHero';

/** @type {MuiSx} */
const usageBudgetHeroStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.125rem 1.375rem',
    borderRadius: '0.625rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    flex: '1 1 auto',
  }),
  resetChip:
    isClosed =>
    ({ palette }) => ({
      height: '1.375rem',
      fontSize: '0.75rem',
      padding: '0.25rem 0.25rem',
      color: isClosed ? palette.text.secondary : palette.text.metrics || palette.text.disabled,
      backgroundColor: isClosed
        ? palette.action?.disabledBackground || palette.background.default.secondary
        : 'transparent',
    }),
  spendRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginTop: '0.25rem',
  },
  spendLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '0.125rem',
    flex: '1 1 auto',
  },
  spendAmount: ({ palette }) => ({
    fontSize: '1.375rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  spendLabel: ({ palette }) => ({
    color: palette.text.primary,
  }),
  percentUsed: ({ palette }) => ({
    color: palette.text.metrics,
    flexShrink: 0,
  }),
  barWrapper: {
    position: 'relative',
    paddingBottom: '1.125rem',
  },
  forecastTickWrapper: pct => ({
    position: 'absolute',
    // bar track starts at top of UsageMeter's barWrapper (~1.375rem from top due to header+gap)
    // tick height is 1rem, bar height is 0.5rem → offset so tick is vertically centered on the bar
    bottom: 0,
    left: `${pct}%`,
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.125rem',
    pointerEvents: 'none',
  }),
  forecastTick: ({ palette }) => ({
    width: '0.125rem',
    height: '1rem',
    backgroundColor: palette.text.primary,
  }),
  forecastTickLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.6875rem',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  }),
  statusRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  statusDot:
    getColor =>
    ({ palette }) => ({
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '50%',
      flexShrink: 0,
      backgroundColor: getColor(palette),
    }),
  statusText:
    getColor =>
    ({ palette }) => ({
      color: getColor(palette),
    }),
  hintText: ({ palette }) => ({
    color: palette.text.hint,
    marginTop: '-0.25rem',
  }),
  alert: {
    fontSize: '0.8125rem',
  },
});

export default UsageBudgetHero;
