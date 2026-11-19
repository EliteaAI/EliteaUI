import { memo } from 'react';

import { Switch } from '@/[fsd]/shared/ui';

const TimeLineExpandAllSwitch = memo(props => {
  const { checked, onChange } = props;

  const styles = timeLineExpandAllSwitchStyles();

  return (
    <Switch.BaseSwitch
      label="Expand all steps"
      checked={checked}
      onChange={onChange}
      width="auto"
      slotProps={{
        container: { sx: styles.container },
        label: { variant: 'bodySmall' },
        switch: {
          slotProps: {
            input: { role: 'switch', 'data-testid': 'pipeline-run-details-timeline-expand-all' },
          },
        },
      }}
    />
  );
});

TimeLineExpandAllSwitch.displayName = 'TimeLineExpandAllSwitch';

/** @type {MuiSx} */
const timeLineExpandAllSwitchStyles = () => ({
  container: {
    height: '1.75rem',
    whiteSpace: 'nowrap',
  },
});

export default TimeLineExpandAllSwitch;
