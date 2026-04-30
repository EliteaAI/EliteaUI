import { memo, useCallback, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useTheme } from '@emotion/react';

import DeleteIcon from './Icons/DeleteIcon';

const DeleteEntityButton = memo(props => {
  const {
    name,
    title,
    onDelete,
    isLoading,
    entity_name,
    validatePermission = false,
    iconColor = '',
    buttonClassName = '',
    buttonColor = 'secondary',
    sx = {},
    modalSx = {},
    onCloseAlert,
    disabled,
    shouldRequestInputName = true,
    type = 'button',
  } = props;

  const theme = useTheme();
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
            <Box component="span">
              <IconButton
                variant="elitea"
                color={buttonColor}
                aria-label="delete entity"
                onClick={onClickButton}
                disabled={isLoading || disabled}
                className={buttonClassName}
                sx={{ marginLeft: '0px', ...sx }}
              >
                <DeleteIcon
                  sx={{ fontSize: '16px' }}
                  fill={
                    iconColor ||
                    (isLoading || disabled
                      ? theme.palette.icon.fill.disabled
                      : theme.palette.icon.fill.secondary)
                  }
                />
                {isLoading && <StyledCircleProgress size={16} />}
              </IconButton>
            </Box>
          </Tooltip>
        )}
        <Modal.DeleteEntityModal
          name={name}
          open={openAlert}
          onClose={onClose}
          onCancel={onClose}
          onConfirm={onConfirm}
          shouldRequestInputName={shouldRequestInputName}
          sx={modalSx}
        />
      </>
    );
});

DeleteEntityButton.displayName = 'DeleteEntityButton';

export default DeleteEntityButton;
