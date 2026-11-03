import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';

/**
 * One choice out of a few, drawn as the segmented control of the mockups.
 * Each segment gets `data-testid="<testId>-<value>"`, the ids the radio buttons had.
 */
const ScheduleSegmentedToggle = memo(props => {
  const { testId, items, value, onChange, disabled = false } = props;

  const buttons = useMemo(
    () =>
      items.map(item => ({
        value: item.value,
        label: item.label,
        buttonProps: {
          'data-testid': `${testId}-${String(item.value).toLowerCase().replace(/\s+/g, '-')}`,
          disabled: disabled || item.disabled,
        },
      })),
    [items, testId, disabled],
  );

  return (
    <Box data-testid={testId}>
      <TabGroupButton
        arrayBtn={buttons}
        value={value}
        onChange={(_, next) => onChange(next)}
        disableTooltip
      />
    </Box>
  );
});

ScheduleSegmentedToggle.displayName = 'ScheduleSegmentedToggle';

export default ScheduleSegmentedToggle;
