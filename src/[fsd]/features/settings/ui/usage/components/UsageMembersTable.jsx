import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';

const SEVERITY_COLOR = {
  exceeded: 'error',
  warning: 'warning',
};

const UsageMembersTable = memo(props => {
  const { rows = [], warningPct } = props;

  const styles = usageMembersTableStyles();

  const [search, setSearch] = useState('');

  const handleSearchClear = useCallback(() => setSearch(''), []);

  const sorted = useMemo(
    () => [...UsageHelpers.filterMembers(rows, search)].sort((a, b) => (b.spend || 0) - (a.spend || 0)),
    [rows, search],
  );

  if (!rows.length) return null;

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
          onSearchChange={setSearch}
          onSearchClear={handleSearchClear}
          placeholder="Search by name or email"
          autoFocus={false}
          sx={styles.search}
        />
      </Box>

      {!sorted.length && (
        <Typography
          variant="bodySmall"
          sx={styles.empty}
        >
          No members found.
        </Typography>
      )}

      {!!sorted.length && (
        <>
          <Box sx={styles.tableHeader}>
            <Typography sx={[styles.cell, { flex: 3 }]}>Member</Typography>
            <Typography sx={[styles.cell, styles.right, { flex: 1.2 }]}>Spent</Typography>
            <Typography sx={[styles.cell, styles.right, { flex: 1.2 }]}>Limit</Typography>
            <Typography sx={[styles.cell, styles.right, { flex: 1 }]}>Used</Typography>
          </Box>

          {sorted.map(row => {
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
