import { memo, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const UsageModelTable = memo(props => {
  const { models = [], canSeeAmounts, currency } = props;

  const styles = usageModelTableStyles();

  // Different raw models can share a display name once provider/project prefixes are
  // stripped (e.g. two distinct "gpt-5" registrations) - fall back to the raw name for those
  const displayNames = useMemo(() => {
    const stripped = models.map(model => UsageHelpers.formatModelName(model.model));
    const counts = stripped.reduce((acc, name) => acc.set(name, (acc.get(name) || 0) + 1), new Map());

    return stripped.map((name, index) => (counts.get(name) > 1 ? models[index].model || name : name));
  }, [models]);

  if (!models.length) {
    return (
      <Box sx={styles.card}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Usage by Model
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.empty}
        >
          No model usage recorded for this period yet.
        </Typography>
      </Box>
    );
  }

  // Share is by cost when visible, otherwise by requests, so the bar always means something
  const totalWeight = models.reduce(
    (sum, model) => sum + (canSeeAmounts ? model.spend || 0 : model.api_requests || 0),
    0,
  );

  return (
    <Box sx={styles.card}>
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Usage by Model
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.subtitle}
      >
        {canSeeAmounts ? 'Cost and calls per model this period' : 'Calls and tokens per model this period'}
      </Typography>

      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Typography sx={[styles.cell, { flex: '0 0 1.75rem' }]}>#</Typography>
          <Typography sx={[styles.cell, { flex: 3 }]}>Model</Typography>
          {canSeeAmounts && <Typography sx={[styles.cell, styles.right, { flex: 1.2 }]}>Cost</Typography>}
          <Typography sx={[styles.cell, styles.right, { flex: 1 }]}>Calls</Typography>
          <Typography sx={[styles.cell, styles.right, { flex: 1 }]}>Tokens</Typography>
          <Typography sx={[styles.cell, { flex: 1.5 }]}>Share</Typography>
        </Box>

        {models.map((model, index) => {
          const weight = canSeeAmounts ? model.spend || 0 : model.api_requests || 0;
          const share = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
          const color =
            AnalyticsCommonConstants.CHART_COLORS[index % AnalyticsCommonConstants.CHART_COLORS.length];

          return (
            <Box
              key={model.model || index}
              sx={styles.row}
            >
              <Typography sx={[styles.value, styles.muted, { flex: '0 0 1.75rem' }]}>{index + 1}</Typography>
              <Tooltip
                title={model.model}
                placement="top"
              >
                <Typography sx={[styles.value, styles.modelName, { flex: 3 }]}>
                  {displayNames[index]}
                </Typography>
              </Tooltip>
              {canSeeAmounts && (
                <Typography sx={[styles.value, styles.right, { flex: 1.2 }]}>
                  {UsageHelpers.formatMoney(model.spend, currency)}
                </Typography>
              )}
              <Typography sx={[styles.value, styles.right, { flex: 1 }]}>
                {model.api_requests || 0}
              </Typography>
              <Typography sx={[styles.value, styles.right, { flex: 1 }]}>
                {UsageHelpers.formatTokens(model.total_tokens)}
              </Typography>
              <Box sx={[styles.shareWrapper, { flex: 1.5 }]}>
                <Box sx={styles.shareTrack}>
                  <Box sx={styles.shareFill(share, color)} />
                </Box>
                <Typography sx={[styles.value, styles.muted, styles.sharePercent]}>
                  {share.toFixed(0)}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

UsageModelTable.displayName = 'UsageModelTable';

/** @type {MuiSx} */
const usageModelTableStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: palette.background.userInputBackground,
    // Height follows content; stretching leaves a large dead area when empty
    flex: '0 0 auto',
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginBottom: '0.75rem',
  }),
  empty: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginTop: '0.5rem',
  }),
  tableWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${palette.border.lines}`,
  }),
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${palette.border.lines}`,
    '&:last-of-type': { borderBottom: 'none' },
  }),
  cell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: palette.text.metrics || palette.text.disabled,
  }),
  value: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  modelName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  right: {
    textAlign: 'right',
  },
  shareWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  shareTrack: ({ palette }) => ({
    flex: 1,
    height: '0.375rem',
    borderRadius: '0.25rem',
    backgroundColor: palette.border.lines,
    position: 'relative',
  }),
  shareFill: (share, color) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${share}%`,
    borderRadius: '0.25rem',
    backgroundColor: color,
  }),
  sharePercent: {
    minWidth: '2rem',
    textAlign: 'right',
  },
});

export default UsageModelTable;
