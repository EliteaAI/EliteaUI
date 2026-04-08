import { memo, useEffect, useRef, useState } from 'react';

import { Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

const RunHistoryTooltipCell = memo(props => {
  const { text, trigger } = props;

  const cellRef = useRef(null);

  const [tooltip, setTooltip] = useState(false);

  useEffect(() => {
    const el = cellRef.current;

    if (el) setTooltip(el.scrollWidth > el.clientWidth);
  }, [text, trigger]);

  return (
    <Tooltip
      title={tooltip ? text : ''}
      placement="top"
    >
      <Typography
        ref={cellRef}
        variant="bodyMedium"
        color="text.secondary"
      >
        {text}
      </Typography>
    </Tooltip>
  );
});

RunHistoryTooltipCell.displayName = 'RunHistoryTooltipCell';

export default RunHistoryTooltipCell;
