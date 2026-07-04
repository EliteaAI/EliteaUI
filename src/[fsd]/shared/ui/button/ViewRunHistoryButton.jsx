import { memo, useCallback } from 'react';

import { IconButton, Tooltip } from '@mui/material';

import { SHARED_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
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
      <IconButton
        variant="elitea"
        color="secondary"
        aria-label="view run history"
        data-testid="pipeline-history-tab"
        data-tour={SHARED_TOUR_TARGET_IDS.runHistory}
        onClick={handleShowHistory}
      >
        <ClockIcon />
      </IconButton>
    </Tooltip>
  );
});

ViewRunHistoryButton.displayName = 'ViewRunHistoryButton';

export default ViewRunHistoryButton;
