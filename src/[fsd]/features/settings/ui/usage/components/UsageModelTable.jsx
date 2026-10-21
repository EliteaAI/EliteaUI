import { memo, useCallback, useState } from 'react';

import { Box, Chip, Typography, useTheme } from '@mui/material';

import { UsageConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useUsageModelData } from '@/[fsd]/features/settings/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const { USAGE_DEFAULT_VISIBLE_MODELS, USAGE_DIRECTION_GLYPH } = UsageConstants;

const UsageModelTable = memo(props => {
  const { models = [], canSeeAmounts, currency, comparisonModels = [], comparisonLabel } = props;

  const { palette } = useTheme();
  const styles = usageModelTableStyles();

  const [showAll, setShowAll] = useState(false);
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const { visibleModels, mainModels, hasMore } = useUsageModelData({
    models,
    comparisonModels,
    canSeeAmounts,
    showAll,
    sortKey,
    sortDir,
  });

  const handleSort = useCallback(
    key => {
      if (sortKey === key) {
        setSortDir(prev => (prev === 'desc' ? 'asc' : 'desc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  const SortHeader = useCallback(
    ({ label, sortable, flex, keyName, right }) => {
      const isActive = sortKey === keyName;

      return (
        <Box
          sx={[styles.cell, right ? styles.right : {}, { flex }, sortable ? styles.sortableCell : {}]}
          onClick={sortable ? () => handleSort(keyName) : undefined}
          role={sortable ? 'button' : undefined}
          tabIndex={sortable ? 0 : undefined}
          onKeyDown={sortable ? e => e.key === 'Enter' && handleSort(keyName) : undefined}
        >
          <Typography sx={[styles.cellText, isActive ? { color: palette.primary.main } : {}]}>
            {label}
            {isActive && <Box component="span">{sortDir === 'desc' ? ' ▼' : ' ▲'}</Box>}
          </Typography>
        </Box>
      );
    },
    [sortKey, sortDir, handleSort, palette, styles],
  );

  if (!models.length) {
    return (
      <Box sx={styles.card}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Models
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

  return (
    <Box
      sx={styles.card}
      data-testid="usage-models-table"
    >
      <Box sx={styles.titleRow}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Models
        </Typography>
        {comparisonLabel && (
          <Typography
            variant="bodySmall"
            sx={styles.comparisonSub}
          >
            Compared with {comparisonLabel.replace(/^vs /, '')}
          </Typography>
        )}
      </Box>

      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Box
            sx={[styles.cell, styles.sortableCell, { flex: 3 }]}
            onClick={() => handleSort('name')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleSort('name')}
          >
            <Typography sx={[styles.cellText, sortKey === 'name' ? { color: palette.primary.main } : {}]}>
              Model
              {sortKey === 'name' && <Box component="span">{sortDir === 'desc' ? ' ▼' : ' ▲'}</Box>}
            </Typography>
          </Box>
          {canSeeAmounts && (
            <SortHeader
              label="Cost"
              sortable
              flex={1.2}
              keyName="spend"
              right
            />
          )}
          <SortHeader
            label="Tokens"
            sortable
            flex={1}
            keyName="tokens"
            right
          />
          <Box sx={[styles.cell, { flex: 1.5 }]}>
            <Typography sx={styles.cellText}>% of total</Typography>
          </Box>
          {comparisonModels.length > 0 && (
            <SortHeader
              label="vs prior"
              sortable
              flex={0.9}
              keyName="delta"
              right
            />
          )}
          <Box sx={[styles.cell, { flex: 0.75 }]}>
            <Typography sx={styles.cellText}>Trend</Typography>
          </Box>
        </Box>

        {visibleModels.map(model => {
          const deltaColor =
            model.delta?.direction === 'up'
              ? palette.warning.main
              : model.delta?.direction === 'down'
                ? palette.success.main
                : model.delta?.direction === 'new'
                  ? palette.info?.main || palette.primary.main
                  : palette.text.disabled;

          const sparkPath = model.sparkline ? UsageHelpers.buildSparklinePath(model.sparkline) : '';

          return (
            <Box
              key={model.model || model.displayName}
              sx={[styles.row, model.isOther ? styles.otherRow : {}]}
            >
              <Box sx={[{ flex: 3, minWidth: 0 }, styles.modelCell]}>
                {/* Colored circle dot — omitted for Other row */}
                {!model.isOther && <Box sx={styles.modelDot(model.color)} />}
                <Typography sx={[styles.modelName, model.isOther ? styles.otherName : {}]}>
                  {model.displayName}
                </Typography>
                {/* Type chip for Image / Embedding */}
                {model.modelType && (
                  <Chip
                    label={model.modelType}
                    size="small"
                    sx={styles.typeChip}
                  />
                )}
              </Box>

              {canSeeAmounts && (
                <Typography sx={[styles.value, styles.right, { flex: 1.2 }]}>
                  {UsageHelpers.formatMoney(model.spend, currency)}
                </Typography>
              )}

              <Typography sx={[styles.value, styles.right, { flex: 1 }]}>
                {UsageHelpers.formatTokens(model.total_tokens)}
              </Typography>

              <Box sx={[styles.shareWrapper, { flex: 1.5 }]}>
                <Box sx={styles.shareTrack}>
                  <Box sx={styles.shareFill(model.share, model.color)} />
                </Box>
                <Typography sx={[styles.value, styles.muted, styles.sharePercent]}>
                  {model.share.toFixed(0)}%
                </Typography>
              </Box>

              {comparisonModels.length > 0 && (
                <Typography
                  sx={[styles.value, styles.right, { flex: 0.9, color: deltaColor, fontWeight: 600 }]}
                >
                  {USAGE_DIRECTION_GLYPH[model.delta?.direction]
                    ? `${USAGE_DIRECTION_GLYPH[model.delta.direction]} `
                    : ''}
                  {model.delta?.label ?? '—'}
                </Typography>
              )}

              <Box sx={{ flex: 0.75, display: 'flex', justifyContent: 'flex-end' }}>
                {sparkPath ? (
                  <svg
                    viewBox="0 0 100 28"
                    preserveAspectRatio="none"
                    width="48"
                    height="16"
                    aria-hidden="true"
                  >
                    <path
                      d={sparkPath}
                      fill="none"
                      stroke={model.color}
                      strokeWidth="2.5"
                    />
                  </svg>
                ) : (
                  <Typography sx={[styles.value, styles.muted]}>—</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {hasMore && (
        <Box sx={styles.showAllRow}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={() => setShowAll(prev => !prev)}
            data-testid="usage-models-show-all"
          >
            {showAll
              ? `Show top ${USAGE_DEFAULT_VISIBLE_MODELS} models`
              : `Show all ${mainModels.length} models`}
          </Button.BaseBtn>
        </Box>
      )}
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
    backgroundColor: palette.background.surface.interactive.default,
    flex: '0 0 auto',
  }),
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  comparisonSub: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    textAlign: 'right',
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
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '&:last-of-type': { borderBottom: 'none' },
  }),
  cell: {
    display: 'flex',
    alignItems: 'center',
  },
  sortableCell: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  cellText: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: palette.text.metrics || palette.text.disabled,
  }),
  modelCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    minWidth: 0,
  },
  modelDot: color => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  typeChip: ({ palette }) => ({
    height: '1.125rem',
    fontSize: '0.625rem',
    color: palette.text.metrics || palette.text.disabled,
    borderColor: palette.border.lines,
    backgroundColor: 'transparent',
    flexShrink: 0,
  }),
  value: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  modelName: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  muted: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  right: {
    textAlign: 'right',
    justifyContent: 'flex-end',
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
  showAllRow: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.75rem',
  },
  otherRow: ({ palette }) => ({
    borderTop: `0.0625rem dashed ${palette.border.lines}`,
    borderBottom: 'none',
  }),
  otherName: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontStyle: 'italic',
  }),
});

export default UsageModelTable;
