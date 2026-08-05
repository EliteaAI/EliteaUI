import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, useTheme } from '@mui/material';

import { SHARED_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import ClockIcon from '@/assets/clock_icon.svg?react';

const ViewRunHistoryButton = memo(props => {
  const { onShowHistory, compact } = props;
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
        title="View run history"
        placement="top"
      >
        <Box component="span">
          <IconButton
            variant="elitea"
            color="secondary"
            aria-label="view run history"
            data-testid="pipeline-history-tab"
            data-tour={SHARED_TOUR_TARGET_IDS.runHistory}
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
      title="View run history"
      placement="top"
    >
      <Button.BaseBtn
        variant={Button.BUTTON_VARIANTS.iconLabel}
        size="small"
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
