import { memo } from 'react';

import { Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import ExpandIcon from '@/assets/expand-icon.svg?react';

const TimeLineGroupToggle = memo(props => {
  const { label, expanded, onToggle } = props;

  const styles = timeLineGroupToggleStyles();

  return (
    <Tooltip title={label}>
      <Button.BaseBtn
        variant={Button.BUTTON_VARIANTS.icon}
        sx={styles.toggle}
        aria-label={label}
        aria-expanded={expanded}
        onClick={onToggle}
        startIcon={expanded ? <CollapseIcon aria-hidden="true" /> : <ExpandIcon aria-hidden="true" />}
      />
    </Tooltip>
  );
});

TimeLineGroupToggle.displayName = 'TimeLineGroupToggle';

/** @type {MuiSx} */
const timeLineGroupToggleStyles = () => ({
  toggle: {
    flexShrink: 0,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
});

export default TimeLineGroupToggle;
