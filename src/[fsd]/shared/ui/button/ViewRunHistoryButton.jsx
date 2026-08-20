import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, useTheme } from '@mui/material';

import { TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import ClockIcon from '@/assets/clock_icon.svg?react';

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
    <Tooltip
      title={tooltip}
      placement="top"
    >
      <Box
        component="span"
        sx={{ display: 'inline-flex' }}
      >
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.iconLabel}
          size="small"
          aria-label="view run history"
          data-testid={testId}
          data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.runHistory}
          disabled={disabled}
          onClick={handleShowHistory}
          startIcon={<ClockIcon />}
        >
          Run History
        </Button.BaseBtn>
      </Box>
    </Tooltip>
  );
});

ViewRunHistoryButton.displayName = 'ViewRunHistoryButton';

export default ViewRunHistoryButton;
