import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import MultipleSelect from '@/components/MultipleSelect';
import { useTheme } from '@emotion/react';

const EditUserRolesDialog = memo(props => {
  const {
    title,
    open,
    onClose,
    onCancel,
    onConfirm,
    confirmButtonText = 'Save',
    rolesOptions,
    originalRoles = [],
  } = props;
  const theme = useTheme();
  const [selectedRoles, setSelectedRoles] = useState(originalRoles);

  const hasChangedRoles = useMemo(() => {
    const sortedSelected = [...(selectedRoles || [])].sort();
    const sortedOriginal = [...(originalRoles || [])].sort();
    return JSON.stringify(sortedSelected) !== JSON.stringify(sortedOriginal);
  }, [selectedRoles, originalRoles]);

  useEffect(() => {
    setSelectedRoles(originalRoles || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedRoles);
  }, [onConfirm, selectedRoles]);

  const handleRolesChange = useCallback(newRoles => {
    setSelectedRoles(newRoles);
  }, []);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && selectedRoles.length > 0) {
        event.preventDefault();
        handleConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    },
    [selectedRoles.length, handleConfirm, onCancel],
  );

  const styles = editUserRolesDialogStyles();

  return (
    <Modal.BaseModal
      open={open}
      title={title}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Select the roles to define user permissions for this project.
          </Typography>
          <MultipleSelect
            label="Roles"
            onValueChange={handleRolesChange}
            fullWidth
            value={selectedRoles}
            options={rolesOptions}
            MenuProps={{
              PaperProps: { sx: styles.menuPaper },
            }}
            customSelectedColor={`${theme.palette.text.primary} !important`}
            customSelectedFontSize="0.875rem"
            multiple
            emptyPlaceHolder=""
            showBorder
            valueItemSX={styles.valueItem}
          />
        </Box>
      }
      actions={
        <Box sx={styles.actionsWrapper}>
          <Button
            variant="alita"
            color="secondary"
            onClick={onCancel}
            disableRipple
          >
            Cancel
          </Button>
          <Button
            variant="alita"
            color="primary"
            onClick={handleConfirm}
            disableRipple
            disabled={!selectedRoles.length || !hasChangedRoles}
          >
            {confirmButtonText}
          </Button>
        </Box>
      }
    />
  );
});

EditUserRolesDialog.displayName = 'EditUserRolesDialog';

/** @type {MuiSx} */
const editUserRolesDialogStyles = () => ({
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  actionsWrapper: {
    display: 'flex',
    gap: '1rem',
  },
  menuPaper: {
    marginTop: '0.5rem',
  },
  valueItem: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default EditUserRolesDialog;
