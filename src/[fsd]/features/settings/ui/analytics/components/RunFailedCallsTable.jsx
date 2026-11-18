import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticCommonHelpers, AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';

import {
  analyticsColumnSx,
  analyticsHeaderCellSx,
  analyticsRowMinWidthSx,
  analyticsTableStyles,
} from './analyticsTable.styles';

const NO_NAME_LABEL = '—';
const WIDE_FLEX = 2;
const NARROW_FLEX = 1;
const COLUMN_FLEX = { wideCol: WIDE_FLEX, narrowCol: NARROW_FLEX };

const COLUMNS = [
  { key: 'ts', label: 'Time', colStyle: 'wideCol', format: AnalyticsExportHelpers.fmtRunDateTime },
  { key: 'eventType', label: 'Event Type', colStyle: 'narrowCol', format: eventType => eventType },
  {
    key: 'name',
    label: 'Model / Tool',
    colStyle: 'wideCol',
    cellStyle: 'failedName',
    format: name => name || NO_NAME_LABEL,
  },
  { key: 'durationMs', label: 'Latency', colStyle: 'narrowCol', format: AnalyticCommonHelpers.fmtDuration },
];

const ROW_MIN_WIDTH = analyticsRowMinWidthSx(COLUMNS.map(({ colStyle }) => COLUMN_FLEX[colStyle]));

const RunFailedCallsTable = memo(props => {
  const { calls = [], sx = {} } = props;

  const styles = runFailedCallsTableStyles();

  if (!calls.length) return null;

  return (
    <Box
      sx={[styles.chartCard, sx]}
      data-testid="run-analytics-failed-calls"
    >
      <Typography
        variant="labelMedium"
        sx={styles.chartTitle}
      >
        Failed Calls
      </Typography>
      <Box sx={styles.tableWrapper}>
        <Box sx={[styles.tableHeader, ROW_MIN_WIDTH]}>
          {COLUMNS.map(({ key, label, colStyle }) => (
            <Typography
              key={key}
              sx={[styles.tableCell, analyticsHeaderCellSx, styles[colStyle]]}
            >
              {label}
            </Typography>
          ))}
        </Box>
        {calls.map(call => (
          <Box
            key={call.key}
            sx={[styles.tableRow, ROW_MIN_WIDTH]}
            data-testid="run-analytics-failed-call"
          >
            {COLUMNS.map(({ key, colStyle, cellStyle, format }) => (
              <Typography
                key={key}
                sx={[styles.tableCellValue, styles[colStyle], cellStyle && styles[cellStyle]]}
              >
                {format(call[key])}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
});

RunFailedCallsTable.displayName = 'RunFailedCallsTable';

/** @type {MuiSx} */
const runFailedCallsTableStyles = () => ({
  ...analyticsTableStyles,
  wideCol: analyticsColumnSx(WIDE_FLEX),
  narrowCol: analyticsColumnSx(NARROW_FLEX),
  failedName: ({ palette }) => ({ color: palette.status.rejected }),
});

export default RunFailedCallsTable;
