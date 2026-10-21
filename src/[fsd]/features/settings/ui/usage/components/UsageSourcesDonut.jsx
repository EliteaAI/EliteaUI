import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { PeriodConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const SOURCE_DISPLAY = {
  chat: 'Chat',
  agents: 'Agents',
  pipelines: 'Pipelines',
  automations: 'Automations',
  indexing: 'Indexing',
  skills: 'Skills',
  external: 'External API',
};

const getSourceLabel = key => SOURCE_DISPLAY[key] || (key ? String(key).slice(0, 20) : 'Other');

const UsageSourcesDonut = memo(props => {
  const {
    bySource = [],
    canSeeAmounts,
    currency,
    onSourceClick,
    selectedSource,
    totalSpend,
    periodLabel,
    sx = {},
  } = props;

  const styles = usageSourcesDonutStyles();

  const centerLabel = useMemo(() => {
    if (!periodLabel) return 'this period';
    if (/^\d{6}$/.test(periodLabel)) {
      const month = parseInt(periodLabel.slice(4, 6), 10) - 1;
      return PeriodConstants.MONTH_NAMES[month] || periodLabel;
    }
    return periodLabel;
  }, [periodLabel]);

  const items = useMemo(() => {
    const total = bySource.reduce((sum, s) => sum + (s.spend || 0), 0) || 1;

    return bySource
      .filter(s => (s.spend || 0) > 0)
      .sort((a, b) => (b.spend || 0) - (a.spend || 0))
      .map((s, i) => ({
        key: s.source || s.key || `source-${i}`,
        label: getSourceLabel(s.source || s.key),
        spend: s.spend || 0,
        pct: ((s.spend || 0) / total) * 100,
        color: UsageHelpers.stableSeriesColor(s.source || s.key || String(i), CHART_COLORS),
      }));
  }, [bySource]);

  // Build conic-gradient stops — dim non-selected segments when a source is selected
  const gradient = useMemo(() => {
    let acc = 0;
    const stops = items.map(item => {
      const start = acc;

      acc += item.pct;

      const color =
        selectedSource && selectedSource !== item.key
          ? `color-mix(in srgb, ${item.color} 25%, transparent)`
          : item.color;

      return `${color} ${start.toFixed(1)}% ${acc.toFixed(1)}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }, [items, selectedSource]);

  if (!items.length) return null;

  return (
    <Box
      sx={[styles.card, sx]}
      data-testid="usage-sources-chart"
    >
      <Box sx={styles.titleBlock}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Spend by source
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.subtitle}
        >
          Select a source to break down the chart above.
        </Typography>
      </Box>

      <Box sx={styles.body}>
        {/* Donut */}
        <Box sx={styles.donutWrapper}>
          <Box sx={styles.donut(gradient)} />
          <Box sx={styles.donutCenter}>
            <Typography
              variant="labelSmall"
              sx={styles.donutValue}
            >
              {canSeeAmounts
                ? UsageHelpers.formatMoney(totalSpend, currency)
                : `${items[0]?.pct.toFixed(0)}%`}
            </Typography>
            <Typography sx={styles.donutSub}>{centerLabel}</Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={styles.legend}>
          {items.map(item => (
            <Button.BaseBtn
              key={item.key}
              variant={BUTTON_VARIANTS.tertiary}
              onClick={() => onSourceClick?.(item.key)}
              sx={styles.legendRow(
                selectedSource === item.key,
                selectedSource && selectedSource !== item.key,
                item.color,
              )}
            >
              <Box sx={styles.dot(item.color)} />
              <Typography
                variant="bodySmall"
                sx={styles.legendName}
              >
                {item.label}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.legendValue}
              >
                {canSeeAmounts ? UsageHelpers.formatMoney(item.spend, currency) : ''}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.legendPct}
              >
                {item.pct.toFixed(1)}%
              </Typography>
            </Button.BaseBtn>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

UsageSourcesDonut.displayName = 'UsageSourcesDonut';

/** @type {MuiSx} */
const usageSourcesDonutStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    flex: 1,
    minWidth: 0,
  }),
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  body: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    alignItems: 'center',
  },
  donutWrapper: {
    position: 'relative',
    flexShrink: 0,
    width: '7.5rem',
    height: '7.5rem',
  },
  donut: gradient => ({
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: gradient,
    maskImage: 'radial-gradient(circle, transparent 38%, black 38%)',
    WebkitMaskImage: 'radial-gradient(circle, transparent 38%, black 38%)',
  }),
  donutCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
    fontWeight: 700,
  }),
  donutSub: ({ palette }) => ({
    fontSize: '0.5625rem',
    color: palette.text.metrics || palette.text.disabled,
    textAlign: 'center',
  }),
  legend: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  legendRow:
    (isActive, isDimmed, color) =>
    ({ palette }) => ({
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '0.375rem',
      padding: '0.25rem 0.375rem',
      borderRadius: '0.25rem',
      minWidth: 0,
      textTransform: 'none',
      opacity: isDimmed ? 0.4 : 1,
      backgroundColor: isActive ? `${color}22` : 'transparent',
      '&:hover': {
        backgroundColor: palette.background.tabButton?.default || palette.action?.hover,
        opacity: 1,
      },
    }),
  dot: color => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '0.125rem',
    backgroundColor: color,
    flexShrink: 0,
  }),
  legendName: ({ palette }) => ({
    flex: 1,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  }),
  legendValue: ({ palette }) => ({
    color: palette.text.secondary,
    flexShrink: 0,
    minWidth: '3rem',
    textAlign: 'right',
  }),
  legendPct: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    flexShrink: 0,
    minWidth: '2.5rem',
    textAlign: 'right',
  }),
});

export default UsageSourcesDonut;
