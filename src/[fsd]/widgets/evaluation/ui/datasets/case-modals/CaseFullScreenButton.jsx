import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import FullscreenOutlinedIcon from '@/assets/full-screen-icon.svg?react';

const CaseFullScreenButton = memo(props => {
  const { onClick, readOnly = false, sx } = props;

  const button = (
    <Button.BaseBtn
      variant={BUTTON_VARIANTS.tertiary}
      aria-label="Full screen view"
      onClick={onClick}
      sx={[caseFullScreenButtonStyles.button, sx]}
    >
      <FullscreenOutlinedIcon style={caseFullScreenButtonStyles.icon} />
    </Button.BaseBtn>
  );

  if (readOnly) return button;

  return (
    <Tooltip
      title="Full screen view"
      placement="top"
    >
      <Box component="span">{button}</Box>
    </Tooltip>
  );
});

CaseFullScreenButton.displayName = 'CaseFullScreenButton';

/** @type {MuiSx} */
const caseFullScreenButtonStyles = {
  button: {
    padding: '0.25rem',
  },
  icon: {
    width: '1rem',
    height: '1rem',
  },
};

export default CaseFullScreenButton;
