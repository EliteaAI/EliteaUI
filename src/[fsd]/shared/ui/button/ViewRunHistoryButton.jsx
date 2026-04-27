import { memo } from 'react';

import { IconButton, Tooltip } from '@mui/material';

import ClockIcon from '@/assets/clock_icon.svg?react';

const ViewRunHistoryButton = memo(({ onShowHistory }) => {
  return (
    <Tooltip
      title="View run history"
      placement="top"
    >
      <IconButton
        variant="alita"
        color="secondary"
        aria-label="view run history"
        onClick={onShowHistory}
      >
        <ClockIcon />
      </IconButton>
    </Tooltip>
  );
});

ViewRunHistoryButton.displayName = 'ViewRunHistoryButton';

export default ViewRunHistoryButton;
