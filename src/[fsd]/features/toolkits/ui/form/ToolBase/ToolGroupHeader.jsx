import { memo } from 'react';

import { Stack, Typography } from '@mui/material';

import { Checkbox, Tooltip } from '@/[fsd]/shared/ui';

const ToolGroupHeader = memo(props => {
  const { groupKey, label, tooltip, selectedCount, totalCount, onToggleAll, disabled } = props;

  const styles = toolGroupHeaderStyles();

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={styles.root}
    >
      <Checkbox.BaseCheckbox
        checked={selectedCount === totalCount}
        indeterminate={selectedCount > 0 && selectedCount < totalCount}
        onChange={onToggleAll}
        disabled={disabled}
        size="small"
        inputProps={{
          'data-testid': `tool-group-checkbox-${groupKey}`,
          'aria-label': `Select all ${label} tools`,
        }}
        sx={styles.checkbox}
      />
      <Typography
        variant="labelSmall"
        onClick={disabled ? undefined : onToggleAll}
        sx={styles.label(disabled)}
      >
        {label}
      </Typography>
      <Tooltip.InfoTooltip
        infoTooltip={tooltip}
        testId={`tool-group-info-${groupKey}`}
      />
      <Typography
        variant="labelSmall"
        color="text.secondary"
        data-testid={`tool-group-count-${groupKey}`}
      >
        {selectedCount} / {totalCount}
      </Typography>
    </Stack>
  );
});

ToolGroupHeader.displayName = 'ToolGroupHeader';

/** @type {MuiSx} */
const toolGroupHeaderStyles = () => ({
  root: {
    marginBottom: '0.5rem',
  },
  checkbox: {
    padding: '0.25rem',
  },
  label: disabled => ({
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
  }),
});

export default ToolGroupHeader;
