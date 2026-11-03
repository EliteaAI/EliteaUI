import { memo } from 'react';

import { Box, Divider, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';

const TestPanelCloseButton = memo(props => {
  const { onClose, testId = 'test-panel-close' } = props;

  const styles = testPanelCloseButtonStyles();

  return (
    <>
      <Divider
        orientation="vertical"
        flexItem
        sx={styles.divider}
      />
      <Tooltip
        title="Close"
        placement="top"
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            startIcon={<CloseIcon sx={styles.closeIcon} />}
            onClick={onClose}
            aria-label="Close test panel"
            data-testid={testId}
          />
        </Box>
      </Tooltip>
    </>
  );
});

TestPanelCloseButton.displayName = 'TestPanelCloseButton';

/** @type {MuiSx} */
const testPanelCloseButtonStyles = () => ({
  divider: ({ palette }) => ({
    marginY: '0.25rem',
    borderColor: palette.border.lines,
  }),
  closeIcon: {
    fontSize: '1rem',
  },
});

export default TestPanelCloseButton;
