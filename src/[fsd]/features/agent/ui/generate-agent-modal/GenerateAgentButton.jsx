import { memo } from 'react';

import { Box } from '@mui/material';

import { useModal } from '@/[fsd]/shared/lib/hooks/useModal.hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import GenerateAgentModal from './GenerateAgentModal';

const GenerateAgentButton = memo(() => {
  const { isOpen, handleOpen, handleClose } = useModal();
  const { checkPermission } = useCheckPermission();

  if (!checkPermission(PERMISSIONS.applications.update)) return null;

  const styles = generateAgentButtonStyles();

  return (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        size="small"
        startIcon={<SparkleIcon />}
        onClick={handleOpen}
        sx={styles.button}
      >
        Build with AI
      </BaseBtn>
      <Box
        component="span"
        onFocus={e => e.stopPropagation()}
      >
        <GenerateAgentModal
          open={isOpen}
          onClose={handleClose}
        />
      </Box>
    </>
  );
});

const generateAgentButtonStyles = () => ({
  button: ({ palette }) => ({
    borderRadius: '1.25rem',
    color: palette.primary.main,
    '&:hover': {
      color: palette.primary.main,
    },
  }),
});

GenerateAgentButton.displayName = 'GenerateAgentButton';

export default GenerateAgentButton;
