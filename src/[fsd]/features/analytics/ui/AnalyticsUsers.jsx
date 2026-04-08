import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress, TablePagination, Typography, useTheme } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';
import { AnalyticsUserDetailed } from '@/[fsd]/features/analytics/ui';
import { useAnalyticsUsersQuery } from '@/api';
import StyledSearchInput from '@/components/SearchInput';

const AnalyticsUsers = memo(props => {
  const { projectId, dateFrom, dateTo, initialUserId, onBackToSource } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || null);
  const [cameFromExternal] = useState(() => !!initialUserId);

  const { palette } = useTheme();

  const { data, isFetching } = useAnalyticsUsersQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
    },
    { skip: !projectId },
  );

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleUserClick = useCallback(userId => setSelectedUserId(userId), []);

  const handleBack = useCallback(() => {
    if (cameFromExternal && onBackToSource) {
      onBackToSource();
    } else {
      setSelectedUserId(null);
    }
  }, [cameFromExternal, onBackToSource]);

  if (selectedUserId) {
    return (
      <AnalyticsUserDetailed
        projectId={projectId}
        userId={selectedUserId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
      />
    );
  }

  const { total = 0, rows = [] } = data || {};

  return (
    <Box sx={styles.usersContent}>
      <Box sx={styles.chartCard}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <Box>
            <Typography
              variant="labelMedium"
              sx={styles.chartTitle}
            >
              User Activity
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.chartSubtitle}
            >
              {total} users
            </Typography>
          </Box>
          <StyledSearchInput
            search={search}
            onChangeSearch={handleSearchChange}
            placeholder="Search by email"
            sx={styles.userSearch}
          />
        </Box>
        <Box sx={styles.tableWrapper}>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.tableCell, { flex: 3 }]}>User</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Events</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Days</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>LLM</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Tool</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Agent</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Chat Msg</Typography>
            <Typography sx={[styles.tableCell, { flex: 1 }]}>Errors</Typography>
          </Box>
          {isFetching && (
            <Box sx={styles.loadingState}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isFetching &&
            rows.map((u, i) => (
              <Box
                key={i}
                sx={styles.clickableRow}
                onClick={() => handleUserClick(u.user_id)}
              >
                <Typography
                  sx={[styles.tableCellValue, { flex: 3 }]}
                  noWrap
                >
                  {u.user_email || `User ${u.user_id}`}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(u.total_events)}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>{u.active_days}</Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(u.llm_events)}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(u.tool_events)}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(u.agent_events)}
                </Typography>
                <Typography sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(u.chat_events)}
                </Typography>
                <Typography
                  sx={[
                    styles.tableCellValue,
                    { flex: 1, color: u.errors > 0 ? palette.status.rejected : undefined },
                  ]}
                >
                  {u.errors}
                </Typography>
              </Box>
            ))}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50]}
          sx={styles.pagination}
        />
      </Box>
    </Box>
  );
});

AnalyticsUsers.displayName = 'AnalyticsUsers';

/** @type {MuiSx} */
const styles = {
  usersContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
    marginBottom: '0.5rem',
    display: 'block',
  }),
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '0.5rem',
  }),
  tableCell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.metrics || palette.text.disabled,
    textTransform: 'uppercase',
  }),
  clickableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `1px solid ${palette.border.table}`,
    gap: '0.5rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: palette.background.conversation?.hover },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  userSearch: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.userInputBackground,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
};

export default AnalyticsUsers;
