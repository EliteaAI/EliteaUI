import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, useTheme } from '@mui/material';

import { TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import ClockIcon from '@/assets/clock_icon.svg?react';

import IconLabelButton from './IconLabelButton';

const ViewRunHistoryButton = memo(props => {
  const {
    onShowHistory,
    compact,
    disabled = false,
    tooltip = 'View run history',
    testId = 'pipeline-history-tab',
  } = props;
  const theme = useTheme();

  const handleShowHistory = useCallback(
    event => {
      onShowHistory?.(event);
    },
    [onShowHistory],
  );

  if (compact) {
    return (
      <Tooltip
        title={tooltip}
        placement="top"
      >
        <Box component="span">
          <IconButton
            variant="elitea"
            color="secondary"
            aria-label="view run history"
            data-testid={testId}
            data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.runHistory}
            disabled={disabled}
            onClick={handleShowHistory}
          >
            <ClockIcon
              style={{ fontSize: 16 }}
              fill={theme.palette.icon.fill.secondary}
            />
          </IconButton>
        </Box>
      </Tooltip>
    );
  }

  return (
    <IconLabelButton
      label="Run History"
      icon={<ClockIcon />}
      tooltip={tooltip}
      ariaLabel="view run history"
      testId={testId}
      disabled={disabled}
      onClick={handleShowHistory}
      data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.runHistory}
    />
  );
});

ViewRunHistoryButton.displayName = 'ViewRunHistoryButton';

export default ViewRunHistoryButton;
