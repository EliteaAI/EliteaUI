import { memo, useCallback } from 'react';

import { Box, Tooltip, useTheme } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

const CaseRowActions = memo(props => {
  const { caseItem, canEdit, onEdit, onDelete } = props;
  const { palette } = useTheme();

  const handleEdit = useCallback(
    event => {
      event.stopPropagation();
      onEdit?.(caseItem);
    },
    [caseItem, onEdit],
  );

  const handleDelete = useCallback(
    event => {
      event.stopPropagation();
      onDelete?.(caseItem);
    },
    [caseItem, onDelete],
  );

  const styles = caseRowActionsStyles(palette);

  if (!canEdit) return null;

  return (
    <Box sx={styles.actions}>
      <Tooltip
        title="Edit"
        placement="top"
      >
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          onClick={handleEdit}
          sx={styles.actionButton}
          data-testid={`case-edit-${caseItem.id}`}
        >
          <EditIcon
            fill={palette.icon.default}
            sx={styles.editIcon}
          />
        </Button.BaseBtn>
      </Tooltip>
      <Tooltip
        title="Delete"
        placement="top"
      >
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          onClick={handleDelete}
          sx={styles.actionButton}
          data-testid={`case-delete-${caseItem.id}`}
        >
          <DeleteIcon sx={styles.icon} />
        </Button.BaseBtn>
      </Tooltip>
    </Box>
  );
});

CaseRowActions.displayName = 'CaseRowActions';

/** @type {MuiSx} */
const caseRowActionsStyles = palette => ({
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  actionButton: {
    padding: '0.25rem',
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&:hover svg path': {
      fill: palette.icon.secondary,
    },
  },
  editIcon: {
    width: '1rem',
    height: '1rem',
  },
  icon: {
    fontSize: '1rem',
    '& path': {
      fill: palette.icon.default,
    },
  },
});

export default CaseRowActions;
