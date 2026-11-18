import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

// "Save <version name>": disabled without edits, while saving, or for a reason shown as its tooltip
const CompareSaveButton = memo(props => {
  const { label, isDirty, isSaving, disabledReason, onClick, testId, sx } = props;
  const isDisabled = !isDirty || isSaving || Boolean(disabledReason);

  return (
    <Tooltip
      title={disabledReason && !isSaving ? disabledReason : ''}
      placement="top"
    >
      <Box
        component="span"
        sx={[compareSaveButtonStyles.wrapper, sx]}
      >
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          disabled={isDisabled}
          onClick={onClick}
          data-testid={testId}
        >
          {isSaving ? 'Saving...' : label}
        </BaseBtn>
      </Box>
    </Tooltip>
  );
});

CompareSaveButton.displayName = 'CompareSaveButton';

/** @type {MuiSx} */
const compareSaveButtonStyles = {
  wrapper: {
    display: 'inline-flex',
    alignSelf: 'flex-end',
  },
};

export default CompareSaveButton;
