import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const SEVERITY_COLOR = {
  exceeded: 'error',
  warning: 'warning',
};

const UsageMembersTable = memo(props => {
  const { rows = [], warningPct } = props;

  const styles = usageMembersTableStyles();

  if (!rows.length) return null;

  const sorted = [...rows].sort((a, b) => (b.spend || 0) - (a.spend || 0));

  return (
    <Box sx={styles.card}>
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

      <Box sx={styles.tableHeader}>
        <Typography sx={[styles.cell, { flex: 3 }]}>Member</Typography>
        <Typography sx={[styles.cell, styles.right, { flex: 1.2 }]}>Spend</Typography>
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
    marginBottom: '0.75rem',
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
