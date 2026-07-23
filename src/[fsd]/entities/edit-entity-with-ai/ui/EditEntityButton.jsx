import { memo } from 'react';

import { Box } from '@mui/material';

import { useModal } from '@/[fsd]/shared/lib/hooks/useModal.hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import useCheckPermission from '@/hooks/useCheckPermission';

const EditEntityButton = memo(props => {
  const { permission, renderModal, buttonTestId } = props;

  const { isOpen, handleOpen, handleClose } = useModal();
  const { checkPermission } = useCheckPermission();

  if (!checkPermission(permission)) return null;

  return (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        size="small"
        startIcon={<SparkleIcon />}
        onClick={handleOpen}
        sx={styles.button}
        data-testid={buttonTestId}
      >
        Edit with AI
      </BaseBtn>
      <Box
        component="span"
        onFocus={e => e.stopPropagation()}
      >
        {renderModal({ open: isOpen, onClose: handleClose })}
      </Box>
    </>
  );
});

EditEntityButton.displayName = 'EditEntityButton';

/** @type {MuiSx} */
const styles = {
  button: ({ palette }) => ({
    borderRadius: '1.25rem',
    color: palette.primary.main,

    '&:hover': {
      color: palette.primary.main,
    },
  }),
};

export default EditEntityButton;
