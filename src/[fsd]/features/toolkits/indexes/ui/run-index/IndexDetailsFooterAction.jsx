import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';

const IndexDetailsFooterAction = memo(props => {
  const { tooltip, children, ...buttonProps } = props;
  const styles = indexDetailsFooterActionStyles();

  return (
    <Tooltip
      title={tooltip ?? ''}
      placement="top"
    >
      <Box
        component="span"
        sx={styles.tooltipAnchor}
      >
        <Button.BaseBtn {...buttonProps}>{children}</Button.BaseBtn>
      </Box>
    </Tooltip>
  );
});

IndexDetailsFooterAction.displayName = 'IndexDetailsFooterAction';

/** @type {MuiSx} */
const indexDetailsFooterActionStyles = () => ({
  tooltipAnchor: {
    display: 'inline-flex',
  },
});

export default IndexDetailsFooterAction;
