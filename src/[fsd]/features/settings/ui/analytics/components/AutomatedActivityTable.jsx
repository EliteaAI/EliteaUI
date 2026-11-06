import { memo, useCallback, useMemo } from 'react';

import { Box, TableSortLabel, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';
import { useClientSort, useSortedRows } from '@/[fsd]/shared/lib/hooks';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import {
  analyticsColumnSx,
  analyticsHeaderCellSx,
  analyticsRowMinWidthSx,
  analyticsTableSortLabelEndSx,
  analyticsTableSortLabelSx,
  analyticsTableStyles,
} from './analyticsTable.styles';

const COLUMNS = [
  { key: 'runs', label: 'Runs', format: AnalyticCommonHelpers.fmtNum },
  { key: 'llm_calls', label: 'LLM Calls', format: AnalyticCommonHelpers.fmtNum },
  { key: 'tool_runs', label: 'Tool Runs', format: AnalyticCommonHelpers.fmtNum },
  { key: 'llm_cost', label: 'Cost', format: AnalyticCommonHelpers.fmtCost },
];

const SOURCE_FLEX = 3;
const ENTITY_FLEX = 1.5;
const VALUE_FLEX = 1;
const ROW_MIN_WIDTH = analyticsRowMinWidthSx([SOURCE_FLEX, ENTITY_FLEX, ...COLUMNS.map(() => VALUE_FLEX)]);

const { TRIGGER_SOURCE_LABELS } = AnalyticsCommonConstants;

const subtitleSources = [
  TRIGGER_SOURCE_LABELS.webhook,
  TRIGGER_SOURCE_LABELS.scheduled,
  TRIGGER_SOURCE_LABELS.schedule_manual,
  TRIGGER_SOURCE_LABELS.index,
].join(', ');

const AutomatedActivityTable = memo(props => {
  const { items = [] } = props;

  const styles = automatedActivityTableStyles();

  const { sort: activitySort, handleSort: handleActivitySort } = useClientSort('runs');
  const getActivityValue = useCallback((row, key) => {
    if (key === 'trigger_source') return AnalyticCommonHelpers.formatTriggerLabel(row.trigger_source);
    if (key === 'entity_kind') return AnalyticCommonHelpers.entityKindLabel(row.entity_kind);
    return row[key];
  }, []);
  const sortedItems = useSortedRows(items, activitySort, getActivityValue);

  const totals = useMemo(
    () =>
      COLUMNS.reduce((acc, { key }) => {
        acc[key] = items.reduce((sum, item) => sum + (item[key] || 0), 0);
        return acc;
      }, {}),
    [items],
  );

  if (!items.length) return null;

  const { TOOLTIP_TEXTS } = AnalyticsCommonConstants;

  return (
    <Box
      sx={[styles.chartCard, styles.dashedCard]}
      data-testid="analytics-overview-automated-activity"
    >
      <Typography
        variant="labelMedium"
        sx={styles.chartTitle}
      >
        Automated Activity
      </Typography>
      <Box sx={styles.subtitleRow}>
        <Typography
          variant="bodySmall"
          sx={styles.chartSubtitle}
        >
          {subtitleSources} — included in project totals, not counted as user activity
        </Typography>
        <InfoTooltip
          infoTooltip={{
            title: TOOLTIP_TEXTS.overview.AUTOMATED_ACTIVITY,
            icon: { width: 12, height: 12 },
          }}
        />
      </Box>
      <Box sx={styles.tableWrapper}>
        <Box sx={[styles.tableHeader, ROW_MIN_WIDTH]}>
          <Box sx={[styles.tableCell, analyticsHeaderCellSx, styles.sourceCol]}>
            <TableSortLabel
              active={activitySort.sortBy === 'trigger_source'}
              direction={activitySort.sortBy === 'trigger_source' ? activitySort.sortOrder : 'desc'}
              onClick={() => handleActivitySort('trigger_source')}
              sx={analyticsTableSortLabelSx}
            >
              Trigger Source
            </TableSortLabel>
          </Box>
          <Box sx={[styles.tableCell, analyticsHeaderCellSx, styles.entityCol]}>
            <TableSortLabel
              active={activitySort.sortBy === 'entity_kind'}
              direction={activitySort.sortBy === 'entity_kind' ? activitySort.sortOrder : 'desc'}
              onClick={() => handleActivitySort('entity_kind')}
              sx={analyticsTableSortLabelSx}
            >
              Entity type
            </TableSortLabel>
          </Box>
          {COLUMNS.map(({ key, label }) => (
            <Box
              key={key}
              sx={[styles.tableCell, analyticsHeaderCellSx, styles.valueCol, styles.valueHeaderCol]}
            >
              <TableSortLabel
                active={activitySort.sortBy === key}
                direction={activitySort.sortBy === key ? activitySort.sortOrder : 'desc'}
                onClick={() => handleActivitySort(key)}
                sx={analyticsTableSortLabelEndSx}
              >
                {label}
              </TableSortLabel>
            </Box>
          ))}
        </Box>
        {sortedItems.map((item, index) => (
          <Box
            key={`${item.trigger_source}-${item.entity_kind ?? 'none'}`}
            sx={[styles.tableRow, ROW_MIN_WIDTH]}
            data-testid={`analytics-automated-row-${item.trigger_source}`}
          >
            <Box sx={[styles.tableCellValue, styles.sourceCol, styles.sourceCell]}>
              <Box sx={styles.colorDot(CHART_COLORS[index % CHART_COLORS.length])} />
              <Typography
                variant="bodySmall"
                noWrap
              >
                {AnalyticCommonHelpers.formatTriggerLabel(item.trigger_source)}
              </Typography>
            </Box>
            <Typography sx={[styles.tableCellValue, styles.entityCol]}>
              {AnalyticCommonHelpers.entityKindLabel(item.entity_kind)}
            </Typography>
            {COLUMNS.map(({ key, format }) => (
              <Typography
                key={key}
                sx={[styles.tableCellValue, styles.valueCol]}
              >
                {format(item[key])}
              </Typography>
            ))}
          </Box>
        ))}
        {items.length > 1 && (
          <Box sx={[styles.tableRow, styles.totalRow, ROW_MIN_WIDTH]}>
            <Typography sx={[styles.tableCellValue, styles.sourceCol, styles.totalText]}>Total</Typography>
            <Box sx={styles.entityCol} />
            {COLUMNS.map(({ key, format }) => (
              <Typography
                key={key}
                sx={[styles.tableCellValue, styles.valueCol, styles.totalText]}
              >
                {format(totals[key])}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
});

AutomatedActivityTable.displayName = 'AutomatedActivityTable';

/** @type {MuiSx} */
const automatedActivityTableStyles = () => ({
  ...analyticsTableStyles,
  // Dashed so the automated bucket reads as separate from the user-driven cards
  dashedCard: { borderStyle: 'dashed' },
  totalRow: { borderBottom: 'none' },
  totalText: { fontWeight: 600 },
  sourceCol: analyticsColumnSx(SOURCE_FLEX),
  entityCol: analyticsColumnSx(ENTITY_FLEX),
  sourceCell: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  valueCol: { ...analyticsColumnSx(VALUE_FLEX), textAlign: 'right' },
  valueHeaderCol: { display: 'flex', justifyContent: 'flex-end' },
});

export default AutomatedActivityTable;
