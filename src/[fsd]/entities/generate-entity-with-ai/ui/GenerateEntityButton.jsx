import { memo } from 'react';

import { Box } from '@mui/material';

import { useModal } from '@/[fsd]/shared/lib/hooks/useModal.hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import useCheckPermission from '@/hooks/useCheckPermission';

const GenerateEntityButton = memo(props => {
  const { permission, renderModal, buttonTestId, label = 'Build with AI' } = props;
  const { isOpen, handleOpen, handleClose } = useModal();
  const { checkPermission } = useCheckPermission();

  if (!checkPermission(permission)) return null;

  return (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.special}
        size="small"
        startIcon={<SparkleIcon />}
        onClick={handleOpen}
        sx={styles.button}
        data-testid={buttonTestId}
      >
        {label}
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

GenerateEntityButton.displayName = 'GenerateEntityButton';

/** @type {MuiSx} */
const styles = {
  button: {
    borderRadius: '1.25rem',
  },
};

export default GenerateEntityButton;
