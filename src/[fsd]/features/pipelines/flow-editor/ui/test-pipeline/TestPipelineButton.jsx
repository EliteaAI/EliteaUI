import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const TestPipelineButton = memo(props => {
  const { onClick, disabledReason = '' } = props;

  return (
    // Disabled buttons do not fire pointer events, so the tooltip needs a wrapper to anchor to
    <Tooltip
      title={disabledReason}
      placement="top"
    >
      <Box component="span">
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.special}
          onClick={onClick}
          disabled={Boolean(disabledReason)}
          data-testid="pipeline-test-button"
        >
          Test Pipeline
        </Button.BaseBtn>
      </Box>
    </Tooltip>
  );
});

TestPipelineButton.displayName = 'TestPipelineButton';

export default TestPipelineButton;
