import { memo, useCallback } from 'react';

import { Stack, Typography } from '@mui/material';

import { Checkbox, Chip, Tooltip } from '@/[fsd]/shared/ui';

const ToolGroupHeader = memo(props => {
  const {
    groupKey,
    label,
    tooltip,
    values,
    selectedCount,
    matchCount,
    isSearching,
    onToggleTools,
    disabled,
  } = props;

  const totalCount = values.length;
  const handleToggle = useCallback(
    () => onToggleTools(values, selectedCount === values.length),
    [onToggleTools, values, selectedCount],
  );

  const styles = toolGroupHeaderStyles(isSearching);

  const definition = (
    <Tooltip.InfoTooltip
      infoTooltip={tooltip}
      testId={`tool-group-info-${groupKey}`}
    />
  );

  if (isSearching) {
    return (
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={styles.root}
      >
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          data-testid={`tool-group-label-${groupKey}`}
        >
          {label} ({matchCount})
        </Typography>
        {definition}
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={styles.root}
    >
      <Checkbox.BaseCheckbox
        checked={selectedCount === totalCount}
        indeterminate={selectedCount > 0 && selectedCount < totalCount}
        onChange={handleToggle}
        disabled={disabled}
        size="small"
        inputProps={{
          'data-testid': `tool-group-checkbox-${groupKey}`,
          'aria-label': `Select all ${label} tools`,
        }}
        sx={styles.checkbox}
      />
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
      >
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          onClick={disabled ? undefined : handleToggle}
          sx={styles.label(disabled)}
          data-testid={`tool-group-label-${groupKey}`}
        >
          {label}
        </Typography>
        {definition}
      </Stack>
      <Chip.CountBadge
        count={selectedCount}
        total={totalCount}
        ariaLabel={`${selectedCount} of ${totalCount} ${label} tools enabled`}
        testId={`tool-group-count-${groupKey}`}
      />
    </Stack>
  );
});

ToolGroupHeader.displayName = 'ToolGroupHeader';

/** @type {MuiSx} */
const toolGroupHeaderStyles = isSearching => ({
  root: {
    display: isSearching ? 'inline-flex' : 'flex',
    marginBottom: isSearching ? '0.5rem' : '1rem',
  },
  checkbox: {
    padding: 0,
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  },
  label: disabled => ({
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
  }),
});

export default ToolGroupHeader;
