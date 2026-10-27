import { memo, useCallback, useMemo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import {
  Box,
  CircularProgress,
  Link,
  TablePagination,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';

import { AnalyticsChatsConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useAnalyticsChatsTable } from '@/[fsd]/features/settings/lib/hooks';
import { DeletedChip } from '@/[fsd]/features/settings/ui/analytics';
import {
  analyticsTableSortLabelSx,
  analyticsTableStyles,
} from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import EllipsisLabelWithTooltip from '@/[fsd]/shared/ui/label/EllipsisLabelWithTooltip';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import StyledSearchInput from '@/components/SearchInput';

import ChatParticipantChips from './ChatParticipantChips';

const { CHAT_ACTIVITY_TOP_N } = AnalyticsChatsConstants;

const NUM_COLUMN_KEYS = new Set([
  'responses',
  'users',
  'total_tokens',
  'input_tokens',
  'output_tokens',
  'cache_read_tokens',
  'cache_creation_tokens',
  'errors',
]);

const COST_COLUMN_KEYS = new Set([
  'llm_cost',
  'input_cost',
  'output_cost',
  'cache_read_cost',
  'cache_creation_cost',
  'avg_cost_per_response',
]);

const ChatActivityTable = memo(props => {
  const { projectId, dateFrom, dateTo, isPersonalProject, onChatClick } = props;

  const styles = useMemo(() => chatActivityTableStyles(), []);

  const {
    columns,
    rows,
    total,
    isFetching,
    showAll,
    page,
    rowsPerPage,
    search,
    sort,
    handleSearchChange,
    handleSort,
    handlePageChange,
    handleRowsPerPageChange,
    handleShowAll,
  } = useAnalyticsChatsTable({ projectId, dateFrom, dateTo, isPersonalProject });

  const renderChatNameCell = useCallback(
    r => (
      <Box sx={styles.chatNameCell}>
        <Box
          component="span"
          sx={styles.chatNameText}
        >
          {r.chat_name || 'Private chat'}
        </Box>
        {r.is_deleted && <DeletedChip testId="analytics-chats-deleted-chip" />}
        {r.can_open && (
          <Tooltip
            title="Open chat"
            placement="top"
          >
            <Link
              component={RouterLink}
              to={`/chat/${r.conversation_id}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={styles.chatLinkIcon}
              onClick={e => e.stopPropagation()}
            >
              ↗
            </Link>
          </Tooltip>
        )}
      </Box>
    ),
    [styles],
  );

  const renderModelsCell = useCallback(r => {
    const models = r.models || [];
    if (!models.length) return '-';
    const labels = models
      .map(m => (typeof m === 'object' ? m.display_name || m.model_name : m) || '')
      .filter(Boolean);
    if (!labels.length) return '-';
    const first = labels[0];
    const extra = labels.length - 1;
    if (extra > 0) {
      return (
        <Tooltip
          title={labels.join(', ')}
          placement="top"
        >
          <Box component="span">
            {first} +{extra}
          </Box>
        </Tooltip>
      );
    }
    return first;
  }, []);

  const renderLastActivityCell = useCallback(r => {
    if (!r.last_activity) return '-';
    const formatted = new Date(r.last_activity).toLocaleString();
    return (
      <EllipsisLabelWithTooltip
        label={formatted}
        sx={{ display: 'block', width: '100%' }}
      />
    );
  }, []);

  const renderCell = useCallback(
    (column, r) => {
      if (column.key === 'chat_name') return renderChatNameCell(r);
      if (column.key === 'participants') return <ChatParticipantChips participants={r.participants} />;
      if (column.key === 'models') return renderModelsCell(r);
      if (column.key === 'last_activity') return renderLastActivityCell(r);
      if (column.key === 'avg_duration_ms') return AnalyticCommonHelpers.fmtDuration(r.avg_duration_ms);
      if (COST_COLUMN_KEYS.has(column.key)) return AnalyticCommonHelpers.fmtCost(r[column.key]);
      if (NUM_COLUMN_KEYS.has(column.key)) return AnalyticCommonHelpers.fmtNum(r[column.key]);
      return r[column.key] ?? '-';
    },
    [renderChatNameCell, renderModelsCell, renderLastActivityCell],
  );

  return (
    <Box sx={styles.card}>
      <Box sx={styles.tableHeaderRow}>
        <Box>
          <Typography
            variant="labelMedium"
            sx={styles.title}
          >
            Chat Activity
          </Typography>
          <Box sx={styles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={styles.subtitle}
              data-testid="analytics-chats-count"
            >
              {total} chats
            </Typography>
            <InfoTooltip
              infoTooltip={{
                title: 'Chats with recorded activity during the selected date range.',
                icon: { width: 12, height: 12 },
              }}
            />
          </Box>
        </Box>
        <StyledSearchInput
          search={search}
          onChangeSearch={handleSearchChange}
          placeholder="Search chats"
          sx={styles.searchInput}
          testId="analytics-chats-search-input"
        />
      </Box>
      <Box
        sx={styles.tableWrapper}
        data-testid="analytics-chats-table"
      >
        <Box
          sx={styles.tableHeader}
          data-testid="analytics-chats-table-header"
        >
          {columns.map(column => (
            <Box
              key={column.key}
              sx={[styles.tableCell, { width: column.width, flexShrink: 0 }]}
            >
              {column.sortable === false ? (
                column.label
              ) : (
                <TableSortLabel
                  active={sort.sortBy === column.key}
                  direction={sort.sortBy === column.key ? sort.sortOrder : 'desc'}
                  onClick={() => handleSort(column.key)}
                  sx={analyticsTableSortLabelSx}
                  data-testid={`analytics-chats-sort-${column.key}`}
                >
                  {column.label}
                </TableSortLabel>
              )}
            </Box>
          ))}
        </Box>
        {isFetching && rows.length === 0 && (
          <Box sx={styles.loadingState}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!isFetching && rows.length === 0 && (
          <Box sx={styles.emptyState}>
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              No chat usage in this period
            </Typography>
          </Box>
        )}
        {rows.length > 0 && (
          <Box sx={isFetching ? styles.rowsFetching : styles.rows}>
            {rows.map((r, i) => (
              <Box
                key={r.conversation_uuid || i}
                sx={styles.clickableRow}
                onClick={() => onChatClick(r.conversation_uuid)}
                data-testid="analytics-chats-row"
              >
                {columns.map(column => (
                  <Box
                    key={column.key}
                    sx={[
                      styles.tableCellValue,
                      { width: column.width, flexShrink: 0 },
                      column.key === 'errors' && r.errors > 0 && styles.errorValue,
                    ]}
                    data-testid={`analytics-chats-row-${column.key}`}
                  >
                    {renderCell(column, r)}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      {!showAll && total > CHAT_ACTIVITY_TOP_N && !isFetching && (
        <Box sx={styles.showAllRow}>
          <BaseBtn
            variant={BUTTON_VARIANTS.text}
            onClick={handleShowAll}
            data-testid="analytics-chats-show-all-btn"
            sx={styles.showAllBtn}
          >
            Show all chats ({total})
          </BaseBtn>
        </Box>
      )}
      {showAll && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[20, 50, 100]}
          sx={styles.pagination}
          slotProps={{
            select: { 'data-testid': 'analytics-chats-pagination-rows-select' },
            displayedRows: { 'data-testid': 'analytics-chats-pagination-range' },
            actions: {
              previousButton: { 'data-testid': 'analytics-chats-pagination-prev' },
              nextButton: { 'data-testid': 'analytics-chats-pagination-next' },
            },
          }}
        />
      )}
    </Box>
  );
});

ChatActivityTable.displayName = 'ChatActivityTable';

/** @type {MuiSx} */
const chatActivityTableStyles = () => ({
  card: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  subtitleRow: { display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' },
  subtitle: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
  searchInput: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.surface.interactive.default,
    borderRadius: '1.6875rem',
    gap: '0.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  tableWrapper: { width: '100%', overflowX: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
  }),
  tableCell: ({ palette }) => ({
    ...analyticsTableStyles.tableCell({ palette }),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  clickableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    ...analyticsTableStyles.tableCellValue({ palette }),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  errorValue: ({ palette }) => ({ color: palette.status.rejected }),
  rows: { transition: 'opacity 0.15s ease' },
  rowsFetching: { opacity: 0.5, pointerEvents: 'none', transition: 'opacity 0.15s ease' },
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  emptyState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
  showAllRow: { display: 'flex', justifyContent: 'center', padding: '0.75rem 0' },
  showAllBtn: ({ palette }) => ({ color: palette.text.accent }),
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
  chatNameCell: { display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 },
  chatNameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flexShrink: 1,
  },
  chatLinkIcon: ({ palette }) => ({
    cursor: 'pointer',
    color: palette.text.accent,
    flexShrink: 0,
  }),
});

export default ChatActivityTable;
