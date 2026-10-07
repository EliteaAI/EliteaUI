import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const CompareRunSettingsColumn = memo(props => {
  const { rows, changedKeys, side } = props;
  const styles = compareRunSettingsColumnStyles();

  return (
    <Box sx={styles.root}>
      {!changedKeys.size && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
      {rows.map(row => (
        <Box
          key={row.key}
          sx={[styles.row, changedKeys.has(row.key) && styles.changedRow]}
          data-testid={`compare-run-settings-${side}-${row.key}`}
          data-changed={changedKeys.has(row.key)}
        >
          <Typography
            variant="labelSmall"
            sx={styles.label}
          >
            {row.label}
          </Typography>
          <Typography
            variant="bodyMedium"
            sx={styles.value}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

CompareRunSettingsColumn.displayName = 'CompareRunSettingsColumn';

/** @type {MuiSx} */
const compareRunSettingsColumnStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
  },
  noDiffNote: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
  row: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
  }),
  changedRow: ({ palette }) => ({
    borderColor: palette.warning.main,
  }),
  label: ({ palette }) => ({
    color: palette.text.primary,
  }),
  value: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'right',
  }),
});

export default CompareRunSettingsColumn;
