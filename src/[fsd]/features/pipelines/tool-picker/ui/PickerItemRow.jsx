import { memo, useCallback } from 'react';

import { Box, ListItemIcon, MenuItem, Tooltip, Typography } from '@mui/material';

import CheckedIcon from '@/assets/checked-icon.svg?react';

/** One picker row: icon, name, short description, "In use" tag and an optional status (MCP login) */
const PickerItemRow = memo(props => {
  const { item, icon, selected = false, onSelect, status, 'data-testid': testId } = props;

  const handleClick = useCallback(() => onSelect?.(item), [item, onSelect]);

  const isDisabled = Boolean(item.disabledReason);
  const styles = pickerItemRowStyles(isDisabled, selected);

  const row = (
    <MenuItem
      role="option"
      aria-selected={selected}
      selected={selected}
      disabled={isDisabled}
      onClick={handleClick}
      sx={styles.root}
      data-testid={testId}
    >
      <Box sx={styles.icon}>{icon}</Box>
      <Box sx={styles.text}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          noWrap
        >
          {item.label}
        </Typography>
        {item.description && (
          <Typography
            variant="bodySmall"
            color="text.primary"
            noWrap
          >
            {item.description}
          </Typography>
        )}
      </Box>
      {item.inUse && (
        <Typography
          variant="labelSmall"
          sx={styles.inUse}
          data-testid={testId ? `${testId}-in-use` : undefined}
        >
          In use
        </Typography>
      )}
      {status}
      {selected && (
        <ListItemIcon sx={styles.check}>
          <CheckedIcon />
        </ListItemIcon>
      )}
    </MenuItem>
  );

  if (!isDisabled) return row;

  return (
    <Tooltip
      title={item.disabledReason}
      placement="left"
    >
      <Box component="span">{row}</Box>
    </Tooltip>
  );
});

PickerItemRow.displayName = 'PickerItemRow';

/** @type {MuiSx} */
const pickerItemRowStyles = (isDisabled, selected) => ({
  // Same selected row as the shared SingleSelect
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    minHeight: '2.5rem',
    ...(isDisabled && { '&.Mui-disabled': { opacity: 0.6 } }),
    ...(selected && { background: `${palette.background.interactiveItem.active} !important` }),
  }),
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    flexShrink: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  inUse: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.125rem 0.375rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.metrics,
  }),
  check: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    minWidth: '1rem !important',
    marginLeft: '1rem',
    '& svg': { fontSize: '1rem', color: 'text.secondary' },
  },
});

export default PickerItemRow;
