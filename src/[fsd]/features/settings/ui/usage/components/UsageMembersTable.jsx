import { memo } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import { GridTablePagination } from '@/[fsd]/entities/grid-table';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';

const SEVERITY_COLOR = {
  exceeded: 'error',
  warning: 'warning',
};

const SKELETON_ROWS = 3;

const UsageMembersTable = memo(props => {
  const {
    rows = [],
    systemRow,
    warningPct,
    search = '',
    onSearchChange,
    onSearchClear,
    pagination,
    isFetching = false,
    isError = false,
    onRetry,
  } = props;

  const styles = usageMembersTableStyles();

  // Only the very first load has nothing to show; later fetches keep the old page visible
  const showsSkeleton = isFetching && !rows.length;
  const showsEmpty = !isFetching && !isError && !rows.length;

  return (
    <Box sx={styles.card}>
      <Box sx={styles.header}>
        <Box sx={styles.headerText}>
          <Typography
            variant="labelMedium"
            sx={styles.title}
          >
            Members
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.subtitle}
          >
            Per-member usage against each member&apos;s own limit in this project
          </Typography>
        </Box>
        <SimpleSearchBar
          searchQuery={search}
          onSearchChange={onSearchChange}
          onSearchClear={onSearchClear}
          placeholder="Search by name or email"
          autoFocus={false}
          sx={styles.search}
        />
      </Box>

      {isError && (
        <Box sx={styles.errorRow}>
          <Typography
            variant="bodySmall"
            sx={styles.errorText}
          >
            Unable to load the member breakdown.
          </Typography>
          <BaseBtn
            variant={BUTTON_VARIANTS.text}
            onClick={onRetry}
            data-testid="usage-members-retry"
          >
            Retry
          </BaseBtn>
        </Box>
      )}

      {showsEmpty && (
        <Typography
          variant="bodySmall"
          sx={styles.empty}
        >
          {search ? 'No members match this search.' : 'No member usage recorded for this period.'}
        </Typography>
      )}

      {(showsSkeleton || !!rows.length) && (
        <>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.cell, { flex: 3 }]}>Member</Typography>
            <Typography sx={[styles.cell, styles.right, { flex: 1.2 }]}>Spent</Typography>
            <Typography sx={[styles.cell, styles.right, { flex: 1.2 }]}>Limit</Typography>
            <Typography sx={[styles.cell, styles.right, { flex: 1 }]}>Used</Typography>
          </Box>

          {showsSkeleton &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Box
                key={`skeleton-${index}`}
                sx={styles.row}
              >
                <Skeleton
                  variant="text"
                  width="100%"
                />
              </Box>
            ))}

          {rows.map(row => {
            const severity = UsageHelpers.usageSeverity(row.percent_used, warningPct);
            const color = SEVERITY_COLOR[severity];

            return (
              <Box
                key={row.user_id}
                sx={styles.row}
              >
                <Box sx={{ flex: 3, minWidth: 0 }}>
                  <Typography sx={styles.value}>{row.name || row.email || `User ${row.user_id}`}</Typography>
                  {row.email && row.name && row.name !== row.email && (
                    <Typography sx={styles.emailText}>{row.email}</Typography>
                  )}
                </Box>
                <Typography sx={[styles.value, styles.right, { flex: 1.2 }]}>
                  {UsageHelpers.formatMoney(row.spend, row.currency)}
                </Typography>
                <Typography sx={[styles.value, styles.right, styles.muted, { flex: 1.2 }]}>
                  {UsageHelpers.formatLimit(row.effective_limit, row.currency)}
                </Typography>
                <Typography
                  sx={[
                    styles.value,
                    styles.right,
                    { flex: 1 },
                    color ? ({ palette }) => ({ color: palette[color].main, fontWeight: 600 }) : {},
                  ]}
                >
                  {row.percent_used === null || row.percent_used === undefined ? '—' : `${row.percent_used}%`}
                </Typography>
              </Box>
            );
          })}
        </>
      )}

      {/* Pinned outside paging so the member rows always add up to the project total */}
      {!!systemRow && (
        <Box sx={[styles.row, styles.systemRow]}>
          <Box sx={{ flex: 3, minWidth: 0 }}>
            <Typography sx={[styles.value, styles.muted]}>{systemRow.name}</Typography>
            <Typography sx={styles.emailText}>Not attributable to a member</Typography>
          </Box>
          <Typography sx={[styles.value, styles.right, styles.muted, { flex: 1.2 }]}>
            {UsageHelpers.formatMoney(systemRow.spend, systemRow.currency)}
          </Typography>
          <Typography sx={[styles.value, styles.right, styles.muted, { flex: 1.2 }]}>—</Typography>
          <Typography sx={[styles.value, styles.right, styles.muted, { flex: 1 }]}>—</Typography>
        </Box>
      )}

      {!!pagination && <GridTablePagination {...pagination} />}
    </Box>
  );
});

UsageMembersTable.displayName = 'UsageMembersTable';

/** @type {MuiSx} */
const usageMembersTableStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: palette.background.userInputBackground,
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.75rem',
  },
  // These Typography variants render inline, so the column has to come from here
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  // SimpleSearchBar already draws its own border, so it stays visible on this card's fill
  search: {
    width: '15rem',
    flexShrink: 0,
  },
  empty: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    marginTop: '0.5rem',
  }),
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  errorText: ({ palette }) => ({
    color: palette.error.main,
  }),
  tableHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${palette.border.lines}`,
  }),
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${palette.border.lines}`,
    '&:last-of-type': { borderBottom: 'none' },
  }),
  systemRow: {
    fontStyle: 'italic',
  },
  cell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: palette.text.metrics || palette.text.disabled,
  }),
  value: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  emailText: ({ palette }) => ({
    fontSize: '0.6875rem',
    color: palette.text.metrics || palette.text.disabled,
  }),
  muted: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  right: {
    textAlign: 'right',
  },
});

export default UsageMembersTable;
