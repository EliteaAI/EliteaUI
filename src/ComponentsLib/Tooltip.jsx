import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Tooltip, tooltipClasses } from '@mui/material';

import { filterProps } from '@/common/utils';

const StyledTooltip = styled(
  ({ className, ...props }) => (
    <Tooltip
      {...props}
      classes={{ popper: className }}
    />
  ),
  filterProps('extraStyles'),
)(({ extraStyles }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    ...extraStyles,
  },
}));

export const TooltipWithDuration = forwardRef((props, ref) => {
  const { delaySeconds = 3000, children, ...leftProps } = props;
  const [open, setOpen] = useState(false);
  const openTipTimerIdRef = useRef();

  const handleMouseEnter = useCallback(() => {
    // show the tooltip after 3 seconds
    openTipTimerIdRef.current = setTimeout(() => {
      openTipTimerIdRef.current = undefined;
      setOpen(true);
    }, delaySeconds);
  }, [delaySeconds]);

  const handleMouseLeave = useCallback(() => {
    setOpen(false);
    if (openTipTimerIdRef.current) {
      clearTimeout(openTipTimerIdRef.current);
    }
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
    if (openTipTimerIdRef.current) {
      clearTimeout(openTipTimerIdRef.current);
      openTipTimerIdRef.current = undefined;
    }
  }, []);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useImperativeHandle(ref, () => {
    return {
      closeTooltip: () => onCloseRef.current(),
    };
  }, []);

  return (
    <StyledTooltip
      {...leftProps}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      open={open}
      onOpen={undefined}
      onClose={onClose}
    >
      {children}
    </StyledTooltip>
  );
});

TooltipWithDuration.displayName = 'TooltipWithDuration';

export default StyledTooltip;
