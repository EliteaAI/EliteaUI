import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import DeleteIcon from './Icons/DeleteIcon';

const DeleteEntityButton = memo(props => {
  const {
    name,
    title,
    onDelete,
    isLoading,
    entity_name,
    validatePermission = false,
    buttonClassName = '',
    sx = {},
    modalSx = {},
    onCloseAlert,
    disabled,
    shouldRequestInputName = true,
    type = 'button',
    testId,
  } = props;

  const [openAlert, setOpenAlert] = useState(false);
  const { checkPermission } = useCheckPermission();
  const skipConfirmation = useDeleteConfirmationDisabled();

  const onClickButton = useCallback(
    event => {
      event.stopPropagation();
      if (skipConfirmation && shouldRequestInputName) {
        onDelete && onDelete();
      } else {
        setOpenAlert(true);
      }
    },
    [skipConfirmation, shouldRequestInputName, onDelete],
  );

  const onClose = useCallback(
    event => {
      event?.stopPropagation();
      setOpenAlert(false);
      onCloseAlert && onCloseAlert();
    },
    [onCloseAlert],
  );

  const onConfirm = useCallback(
    event => {
      event?.stopPropagation();
      onDelete && onDelete();
      setOpenAlert(false);
    },
    [onDelete],
  );

  if (!validatePermission || checkPermission(PERMISSIONS[entity_name].delete))
    return (
      <>
        {type === 'menuItem' ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
            }}
            onClick={onClickButton}
          >
            <DeleteIcon sx={{ fontSize: '1rem' }} />
            <Typography sx={{ fontWeight: 500, fontSize: '.875rem', lineHeight: '1.5rem' }}>
              Delete
            </Typography>
          </Box>
        ) : (
          <Tooltip
            title={title}
            placement="top"
          >
            <Box
              component="span"
              data-testid={testId}
            >
              <Button.BaseBtn
                variant="secondary"
                startIcon={<DeleteIcon fill="currentColor" />}
                aria-label="delete entity"
                onClick={onClickButton}
                disabled={isLoading || disabled}
                loading={isLoading}
                type={type}
                className={buttonClassName}
                sx={{ marginLeft: '0px', ...sx }}
                disableRipple
              />
            </Box>
          </Tooltip>
        )}
        <Modal.DeleteEntityModal
          name={name}
          open={openAlert}
          onClose={onClose}
          onConfirm={onConfirm}
          shouldRequestInputName={shouldRequestInputName}
          sx={modalSx}
        />
      </>
    );
});

DeleteEntityButton.displayName = 'DeleteEntityButton';

export default DeleteEntityButton;
