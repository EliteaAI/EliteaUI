import { memo } from 'react';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useTextOverflow } from '@/[fsd]/shared/lib/hooks/useTextOverflow.hooks';

const EllipsisLabelWithTooltip = memo(props => {
  const { label, placement = 'top', sx } = props;
  const { textRef, isOverflowing } = useTextOverflow(label);

  return (
    <Tooltip
      title={isOverflowing ? label : ''}
      placement={placement}
    >
      <Box
        component="span"
        ref={textRef}
        sx={[styles.label, sx]}
      >
        {label}
      </Box>
    </Tooltip>
  );
});

EllipsisLabelWithTooltip.displayName = 'EllipsisLabelWithTooltip';

/** @type {MuiSx} */
const styles = {
  label: {
    display: 'inline',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default EllipsisLabelWithTooltip;
