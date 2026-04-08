import { memo } from 'react';

import { Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import useCheckViewScrollHorizontally from '@/hooks/useCheckViewScrollHorizontally';

const EllipsisTypography = memo(props => {
  const { children, sx, ...rest } = props;

  const { isScrollable, viewRef } = useCheckViewScrollHorizontally();
  const styles = styledTypographyStyles();

  return (
    <Tooltip
      placement="top"
      title={isScrollable ? children : ''}
    >
      <Typography
        ref={viewRef}
        component="div"
        variant="bodySmall"
        color="text.secondary"
        sx={[styles.typography, sx]}
        {...rest}
      >
        {children}
      </Typography>
    </Tooltip>
  );
});

EllipsisTypography.displayName = 'EllipsisTypography';

/** @type {MuiSx} */
const styledTypographyStyles = () => ({
  typography: {
    marginRight: '0.5rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
});

export default EllipsisTypography;
