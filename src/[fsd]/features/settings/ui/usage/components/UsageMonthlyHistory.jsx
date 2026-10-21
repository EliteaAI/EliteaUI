import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageConstants } from '@/[fsd]/features/settings/lib/constants';
import { PeriodHelpers, UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const { USAGE_MAX_HISTORY_BARS } = UsageConstants;

const UsageMonthlyHistory = memo(props => {
  const { history = [], limit, canSeeAmounts, currency, activePeriod, onSelect, sx = {} } = props;

  const styles = usageMonthlyHistoryStyles();

  const displayHistory = useMemo(() => {
    const sorted = [...history].sort((a, b) => (a.period > b.period ? 1 : -1));
    return sorted.slice(-USAGE_MAX_HISTORY_BARS);
  }, [history]);

  const currentPeriod = useMemo(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }, []);

  if (displayHistory.length <= 1) return null;

  const maxSpend = (Math.max(...displayHistory.map(h => h.spend || 0), limit || 0) || 1) * 1.15;

  const limitPct = limit > 0 ? (limit / maxSpend) * 100 : null;

  return (
    <Box
      sx={[styles.card, sx]}
      data-testid="usage-monthly-history"
    >
      {/* Header */}
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          Monthly history
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.subtitle}
        >
          Select a month to open it.
        </Typography>
      </Box>

      {/* Bars area — each bar column contains its own amount label + fill */}
      <Box sx={styles.barsArea}>
        {/* Limit dotted line with label at the right end */}
        {limitPct !== null && (
          <Box sx={styles.limitLine(limitPct)}>
            {canSeeAmounts && (
              <Typography
                variant="labelTiny"
                sx={styles.limitLabel}
              >
                {`Current limit ${UsageHelpers.formatMoney(limit, currency)}`}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={styles.barsRow}>
          {displayHistory.map(item => {
            const isActive = item.period === activePeriod;
            const heightPct = maxSpend > 0 ? ((item.spend || 0) / maxSpend) * 100 : 0;

            return (
              <Box
                key={item.period}
                component="button"
                onClick={() => onSelect?.(item.period)}
                sx={styles.barColumn}
                data-testid={`usage-history-bar-${item.period}`}
              >
                {canSeeAmounts && (
                  <Typography
                    variant="labelTiny"
                    sx={styles.barValue(heightPct, isActive)}
                  >
                    {UsageHelpers.formatMoney(item.spend, currency)}
                  </Typography>
                )}
                <Box sx={styles.barFill(heightPct, isActive)} />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Month labels row */}
      <Box sx={styles.labelsRow}>
        {displayHistory.map(item => {
          const isActive = item.period === activePeriod;

          return (
            <Typography
              key={item.period}
              variant="labelTiny"
              sx={styles.barLabel(isActive)}
            >
              {PeriodHelpers.formatPeriodShort(item.period, item.period === currentPeriod)}
            </Typography>
          );
        })}
      </Box>
    </Box>
  );
});

UsageMonthlyHistory.displayName = 'UsageMonthlyHistory';

/** @type {MuiSx} */
const usageMonthlyHistoryStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    flex: 1,
    minWidth: 0,
  }),
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    display: 'block',
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    display: 'block',
  }),
  barsArea: {
    position: 'relative',
    flex: 1,
    minHeight: '8rem',
  },
  limitLine:
    pct =>
    ({ palette }) => ({
      position: 'absolute',
      bottom: `${pct}%`,
      left: 0,
      right: 0,
      borderTop: `0.0625rem dotted ${palette.warning.main}`,
      zIndex: 1,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'flex-end',
    }),
  limitLabel: ({ palette }) => ({
    color: palette.warning.main,
    whiteSpace: 'nowrap',
    transform: 'translateY(-100%)',
    paddingBottom: '0.125rem',
  }),
  barsRow: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
  },
  barColumn: {
    flex: 1,
    position: 'relative',
    border: 'none',
    outline: 'none',
    padding: 0,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  barValue:
    (pct, isActive) =>
    ({ palette }) => ({
      position: 'absolute',
      bottom: `calc(${pct}% + 0.25rem)`,
      left: 0,
      right: 0,
      color: isActive ? palette.text.secondary : palette.text.metrics || palette.text.disabled,
      fontWeight: isActive ? 600 : 400,
      textAlign: 'center',
      pointerEvents: 'none',
    }),
  barFill:
    (pct, isActive) =>
    ({ palette }) => ({
      position: 'absolute',
      bottom: 0,
      left: '25%',
      right: '25%',
      height: `${pct}%`,
      backgroundColor: isActive
        ? palette.primary.main
        : palette.primary.dark || palette.info?.dark || '#2E7D9A',
      borderRadius: '0.25rem 0.25rem 0 0',
      transition: 'height 0.3s ease',
    }),
  labelsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
  },
  barLabel:
    isActive =>
    ({ palette }) => ({
      color: isActive ? palette.text.secondary : palette.text.metrics || palette.text.disabled,
      fontWeight: isActive ? 700 : 400,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      flex: 1,
    }),
});

export default UsageMonthlyHistory;
