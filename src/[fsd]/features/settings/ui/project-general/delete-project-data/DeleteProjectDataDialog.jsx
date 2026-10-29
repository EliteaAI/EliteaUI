import { memo, useCallback, useEffect, useState } from 'react';

import { Box, List, ListItem, Typography } from '@mui/material';

import { ProjectDataDeleteConstants } from '@/[fsd]/features/settings/lib/constants';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import BackupAlert from '../backup-restore/BackupAlert';

const { CONFIRMATION_VALUE, COUNT_UNAVAILABLE, CREDENTIALS_WARNING, PROJECT_DATA_TYPE, SKIP_REASON } =
  ProjectDataDeleteConstants;

const DeleteProjectDataDialog = memo(props => {
  const { open, projectName, selectedTypes = [], isDeleting, onClose, onConfirm } = props;

  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (!open) setConfirmation('');
  }, [open]);

  const isConfirmed = confirmation === CONFIRMATION_VALUE;

  const selectedKeys = selectedTypes.map(type => type.key);
  const showCredentialsWarning =
    selectedKeys.includes(PROJECT_DATA_TYPE.credentials) &&
    !(selectedKeys.includes(PROJECT_DATA_TYPE.toolkits) && selectedKeys.includes(PROJECT_DATA_TYPE.mcps));

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    onClose?.();
  }, [isDeleting, onClose]);

  const handleConfirm = useCallback(() => {
    if (!isConfirmed || isDeleting) return;
    onConfirm?.();
  }, [isConfirmed, isDeleting, onConfirm]);

  const handleChange = useCallback(event => setConfirmation(event.target.value), []);

  const styles = deleteProjectDataDialogStyles();

  const content = (
    <Box sx={styles.root}>
      <Typography
        variant="bodyMedium"
        color="text.deleteAlertText"
      >
        You are about to permanently delete all items of the following types from this project:
      </Typography>
      <List
        dense
        sx={styles.list}
      >
        {selectedTypes.map(type => (
          <ListItem
            key={type.key}
            sx={styles.listItem}
            data-testid={`project-data-delete-type-${type.key}`}
          >
            <Typography variant="labelMedium">
              {type.label} ({type.count ?? COUNT_UNAVAILABLE})
            </Typography>
            {type.blocked > 0 && (
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {type.blocked} {(type.skipReason || SKIP_REASON.published).text}
              </Typography>
            )}
          </ListItem>
        ))}
      </List>
      <Typography
        variant="bodyMedium"
        color="text.deleteAlertText"
      >
        This action is irreversible and may affect other project members and resources that depend on these
        items. We strongly recommend creating a backup before proceeding.
      </Typography>
      {showCredentialsWarning && (
        <BackupAlert
          severity="warning"
          data-testid="project-data-delete-credentials-warning"
        >
          {CREDENTIALS_WARNING}
        </BackupAlert>
      )}
      <Input.InputBase
        data-testid="project-data-delete-confirm-input"
        autoComplete="off"
        label={`Type ${CONFIRMATION_VALUE} to confirm`}
        value={confirmation}
        onChange={handleChange}
        disabled={isDeleting}
        enableAutoBlur={false}
      />
    </Box>
  );

  const actions = (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleClose}
        disabled={isDeleting}
        data-testid="project-data-delete-cancel"
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.alarm}
        onClick={handleConfirm}
        disabled={!isConfirmed || isDeleting}
        data-testid="project-data-delete-confirm"
      >
        {isDeleting ? 'Deleting...' : 'Delete permanently'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      titleIcon={ModalConstants.MODAL_ICON_TYPE.destructive}
      title={`Delete data from ${projectName}?`}
      content={content}
      actions={actions}
      onClose={handleClose}
      data-testid="project-data-delete-modal"
    />
  );
});

DeleteProjectDataDialog.displayName = 'DeleteProjectDataDialog';

/** @type {MuiSx} */
const deleteProjectDataDialogStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  list: {
    padding: 0,
  },
  listItem: {
    padding: '0.125rem 0',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});

export default DeleteProjectDataDialog;
