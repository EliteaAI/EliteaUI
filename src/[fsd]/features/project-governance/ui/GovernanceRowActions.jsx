import { memo, useCallback, useState } from 'react';

import { Box, Tooltip } from '@mui/material';

import * as GovernanceHelpers from '@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

// The actions of one governed row the admin may take (C-1009, #7269). An approval opens the approve dialog; a change
// that takes something out of use asks once more inline; the rest run at once. An approval the four-eyes rule keeps
// from this admin is shown disabled with its reason.
const CONFIRM = ['suspend', 'retire', 'revoke', 'reject', 'rebind'];

const GovernanceRowActions = memo(props => {
  const { kind, row, userId, checkPermission, onRun, onApprove, isBusy = false } = props;
  const styles = governanceRowActionsStyles();
  const [confirming, setConfirming] = useState(null);

  const actions = GovernanceHelpers.rowActions(kind, row, userId).filter(item =>
    checkPermission(item.permission),
  );

  const handleClick = useCallback(
    item => {
      if (item.approval) onApprove(kind, row, item);
      else if (CONFIRM.includes(item.action)) setConfirming(item);
      else onRun(kind, row, item);
    },
    [kind, onApprove, onRun, row],
  );

  const handleConfirm = useCallback(() => {
    const item = confirming;
    setConfirming(null);
    onRun(kind, row, item);
  }, [confirming, kind, onRun, row]);

  if (confirming) {
    return (
      <Box sx={styles.root}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          size="small"
          onClick={handleConfirm}
          disabled={isBusy}
          data-testid={`governance-confirm-${confirming.action}-${row.id}`}
        >
          {`${confirming.label}?`}
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          size="small"
          onClick={() => setConfirming(null)}
        >
          Cancel
        </Button.BaseBtn>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      {actions.map(item => (
        <Tooltip
          key={item.action}
          title={item.disabledReason || ''}
        >
          <Box component="span">
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              size="small"
              disabled={isBusy || Boolean(item.disabledReason)}
              onClick={() => handleClick(item)}
              data-testid={`governance-action-${item.action}-${row.id}`}
            >
              {item.label}
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
});

GovernanceRowActions.displayName = 'GovernanceRowActions';

/** @type {MuiSx} */
const governanceRowActionsStyles = () => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.25rem',
  },
});

export default GovernanceRowActions;
