import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import { Switch } from '@/[fsd]/shared/ui';

const TOOLTIP_ALLOWED =
  'Agents and pipelines you run in other projects can read this secret on your behalf. ' +
  'Turn it off to keep the secret private to this project.';
const TOOLTIP_BLOCKED = 'Platform-managed secrets cannot be shared.';
const TOOLTIP_READ_ONLY = 'You do not have permission to change secret sharing.';
const TOOLTIP_EDITING = 'Save or cancel your changes to update sharing.';

const SecretExternalAccessCell = memo(props => {
  const { row, checked = false, canEdit = true, isRowEditing = false, isPending = false, onToggle } = props;

  const styles = secretExternalAccessCellStyles();

  const handleChange = useCallback(
    (_event, nextValue) => {
      onToggle?.(row, nextValue);
    },
    [onToggle, row],
  );

  const tooltip = row.is_default
    ? TOOLTIP_BLOCKED
    : !canEdit
      ? TOOLTIP_READ_ONLY
      : isRowEditing
        ? TOOLTIP_EDITING
        : TOOLTIP_ALLOWED;

  return (
    <Box sx={styles.container}>
      <StyledTooltip
        title={tooltip}
        placement="top"
      >
        <Box
          component="span"
          sx={styles.switchWrapper}
        >
          <Switch.BaseSwitch
            data-testid="secret-row-external-access-toggle"
            checked={checked}
            disabled={!canEdit || isRowEditing || isPending || row.is_default}
            onChange={handleChange}
          />
        </Box>
      </StyledTooltip>
    </Box>
  );
});

SecretExternalAccessCell.displayName = 'SecretExternalAccessCell';

/** @type {MuiSx} */
const secretExternalAccessCellStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  switchWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
  },
});

export default SecretExternalAccessCell;
