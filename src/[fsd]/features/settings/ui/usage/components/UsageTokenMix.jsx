import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

// Fixed series colors per SOLUTION.md §4.10 — exception to no-hardcoded-hex rule for chart series
const TOKEN_SERIES = [
  { key: 'input_tokens', label: 'Input', color: '#4f8cff' },
  { key: 'output_tokens', label: 'Output', color: '#b98cff' },
  { key: 'cached_tokens', label: 'Cached', color: '#4fd1a5' },
  { key: 'image_tokens', label: 'Image', color: '#f5c26b' },
];

const UsageTokenMix = memo(props => {
  const { data = {}, canSeeAmounts, currency, cacheHitRate, sx = {} } = props;

  const { palette } = useTheme();
  const styles = usageTokenMixStyles();

  const series = useMemo(() => {
    const total = TOKEN_SERIES.reduce((sum, s) => sum + (data[s.key] || 0), 0) || 1;

    return TOKEN_SERIES.map(s => ({
      ...s,
      value: data[s.key] || 0,
      pct: ((data[s.key] || 0) / total) * 100,
    })).filter(s => s.value > 0);
  }, [data]);

  // Build segments for the segmented bar
  const segments = useMemo(() => {
    let acc = 0;

    return series.map(s => {
      const start = acc;

      acc += s.pct;

      return { ...s, start, end: acc };
    });
  }, [series]);

  if (!series.length) return null;

  return (
    <Box
      sx={[styles.card, sx]}
      data-testid="usage-token-mix"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Token mix
      </Typography>

      {/* Segmented bar */}
      <Box sx={styles.barTrack}>
        {segments.map((seg, i) => (
          <Box
            key={seg.key}
            sx={styles.barSegment(seg.pct, seg.color, i === 0, i === segments.length - 1)}
          />
        ))}
      </Box>

      {/* 2-column legend */}
      <Box sx={styles.legend}>
        {series.map(s => (
          <Box
            key={s.key}
            sx={styles.legendItem}
          >
            <Box sx={styles.dot(s.color)} />
            <Box sx={styles.legendText}>
              <Typography
                variant="bodySmall"
                sx={styles.legendLabel}
              >
                {s.label}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.legendValue}
              >
                {canSeeAmounts
                  ? UsageHelpers.formatMoney(data[`${s.key}_cost`] || 0, currency)
                  : UsageHelpers.formatTokens(s.value)}
              </Typography>
              <Typography sx={styles.legendPct}>{s.pct.toFixed(1)}%</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Cache hit rate footer */}
      {cacheHitRate !== null && cacheHitRate !== undefined && (
        <Box sx={styles.footer}>
          <Typography
            variant="bodySmall"
            sx={styles.footerLabel}
          >
            Cache hit rate
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.footerValue(cacheHitRate, palette)}
          >
            {cacheHitRate.toFixed(1)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
});

UsageTokenMix.displayName = 'UsageTokenMix';

/** @type {MuiSx} */
const usageTokenMixStyles = () => ({
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
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  barTrack: {
    display: 'flex',
    flexDirection: 'row',
    height: '0.625rem',
    borderRadius: '0.3125rem',
    overflow: 'hidden',
    gap: '0.0625rem',
  },
  barSegment: (pct, color, isFirst, isLast) => ({
    flex: `0 0 ${pct}%`,
    backgroundColor: color,
    borderRadius:
      isFirst && isLast
        ? '0.3125rem'
        : isFirst
          ? '0.3125rem 0 0 0.3125rem'
          : isLast
            ? '0 0.3125rem 0.3125rem 0'
            : '0',
  }),
  legend: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.375rem 1rem',
  },
  legendItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '0.375rem',
  },
  dot: color => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
    marginTop: '0.1875rem',
  }),
  legendText: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  legendLabel: ({ palette }) => ({
    color: palette.text.secondary,
    flex: 1,
  }),
  legendValue: ({ palette }) => ({
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  legendPct: ({ palette }) => ({
    fontSize: '0.6875rem',
    color: palette.text.metrics || palette.text.disabled,
    flexShrink: 0,
    minWidth: '2.5rem',
    textAlign: 'right',
  }),
  footer: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.375rem 0.625rem',
    borderRadius: '0.25rem',
    backgroundColor: palette.background.tabButton?.default || palette.action?.hover || 'transparent',
  }),
  footerLabel: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  footerValue: (rate, palette) => ({
    color: rate >= 30 ? palette.success.main : rate >= 10 ? palette.warning.main : palette.text.secondary,
    fontWeight: 600,
  }),
});

export default UsageTokenMix;
