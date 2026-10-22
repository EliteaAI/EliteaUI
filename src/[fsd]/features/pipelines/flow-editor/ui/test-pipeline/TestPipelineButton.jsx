import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const NO_NODES_REASON = 'Add a node to test the pipeline';

const TestPipelineButton = memo(props => {
  const { onClick, hasNodes, disabledReason } = props;

  const tooltip = !hasNodes ? NO_NODES_REASON : disabledReason || '';

  return (
    // Disabled buttons do not fire pointer events, so the tooltip needs a wrapper to anchor to
    <Tooltip
      title={tooltip}
      placement="top"
    >
      <Box component="span">
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={onClick}
          disabled={Boolean(tooltip)}
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
