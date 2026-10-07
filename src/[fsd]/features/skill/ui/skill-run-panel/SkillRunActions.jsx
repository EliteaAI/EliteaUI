import { memo, useCallback, useState } from 'react';

import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PlusIcon from '@/components/Icons/PlusIcon';

const SkillRunActions = memo(props => {
  const { canStartNewRun, canDeleteMessages, onStartNewRun, onDeleteAllMessages } = props;
  const theme = useTheme();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const styles = skillRunActionsStyles();

  const openDeleteDialog = useCallback(() => setIsDeleteDialogOpen(true), []);
  const closeDeleteDialog = useCallback(() => setIsDeleteDialogOpen(false), []);

  const confirmDeleteAll = useCallback(() => {
    setIsDeleteDialogOpen(false);
    onDeleteAllMessages();
  }, [onDeleteAllMessages]);

  return (
    <>
      <Tooltip
        placement="top"
        title="New run"
      >
        <Box component="span">
          <IconButton
            variant="elitea"
            color="secondary"
            aria-label="new run"
            disabled={!canStartNewRun}
            onClick={onStartNewRun}
            data-testid="skill-run-new-run-button"
          >
            <PlusIcon
              style={styles.icon}
              fill={theme.palette.icon.secondary}
            />
          </IconButton>
        </Box>
      </Tooltip>
      <Tooltip
        placement="top"
        title="Delete all messages"
      >
        <Box component="span">
          <IconButton
            variant="elitea"
            color="secondary"
            aria-label="delete all messages"
            disabled={!canDeleteMessages}
            onClick={openDeleteDialog}
            data-testid="skill-run-delete-all-button"
          >
            <DeleteIcon
              sx={styles.icon}
              fill={theme.palette.icon.secondary}
            />
          </IconButton>
        </Box>
      </Tooltip>
      <Modal.BaseModal
        open={isDeleteDialogOpen}
        variant={ModalConstants.MODAL_VARIANT.simple}
        title="Delete all messages?"
        content={
          <Typography variant="bodySmall">
            All messages of this run will be deleted. The run itself stays in the history. This can&apos;t be
            undone.
          </Typography>
        }
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteAll}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonTestId="skill-run-delete-all-confirm"
        alarm
      />
    </>
  );
});

SkillRunActions.displayName = 'SkillRunActions';

/** @type {MuiSx} */
const skillRunActionsStyles = () => ({
  icon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
});

export default SkillRunActions;
