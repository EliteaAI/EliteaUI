import { memo, useCallback } from 'react';

import { Tooltip } from '@mui/material';

import { SHARED_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import ClockIcon from '@/assets/clock_icon.svg?react';

const ViewRunHistoryButton = memo(props => {
  const { onShowHistory } = props;

  const handleShowHistory = useCallback(
    event => {
      onShowHistory?.(event);
    },
    [onShowHistory],
  );

  return (
    <Tooltip
      title="View run history"
      placement="top"
    >
      <Button.BaseBtn
        variant="elitea"
        color="secondary"
        aria-label="view run history"
        data-testid="pipeline-history-tab"
        data-tour={SHARED_TOUR_TARGET_IDS.runHistory}
        onClick={handleShowHistory}
        startIcon={<ClockIcon />}
      >
        Run History
      </Button.BaseBtn>
    </Tooltip>
  );
});

ViewRunHistoryButton.displayName = 'ViewRunHistoryButton';

export default ViewRunHistoryButton;
