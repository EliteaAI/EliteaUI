import { isValidElement, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, ClickAwayListener, Tooltip } from '@mui/material';

import TooltipMarkdownContent from '@/[fsd]/shared/ui/tooltip/TooltipMarkdownContent';
import InfoIcon from '@/components/Icons/InfoIcon';

const INFO_TOOLTIP_DEFAULTS = {
  placement: 'top',
  zIndex: 9999,
  icon: { width: 16, height: 16 },
};

const InfoTooltip = memo(props => {
  const {
    infoTooltip,
    slotProps,
    sx,
    href,
    linkTarget = '_blank',
    rel = 'noopener noreferrer',
    disableTooltip = false,
    TitleComponent,
    titleComponentProps,
    testId,
    contentTestId,
    // Opens on hover or focus; click, Enter or Space pins it until Esc or a click outside
    pinnable = false,
  } = props;
  const styles = infoTooltipStyles();

  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  // Closed by Esc or an unpin click while the icon is still hovered or focused; a new hover or focus clears it
  const [isDismissed, setIsDismissed] = useState(false);

  const isOpen = isPinned || (!isDismissed && (isHovered || isFocused));

  const dismiss = useCallback(() => {
    setIsPinned(false);
    setIsDismissed(true);
  }, []);

  useEffect(() => {
    if (!pinnable || !isOpen) return undefined;
    // Capture phase and preventDefault: Esc closes only the tooltip, not the panel or dialog it sits in
    const handleKeyDown = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismiss();
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [pinnable, isOpen, dismiss]);

  // The icon often sits inside a select label or a switch label: keep the click from opening or toggling them
  const togglePinned = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      if (isPinned) {
        dismiss();
      } else {
        setIsPinned(true);
        setIsDismissed(false);
      }
    },
    [isPinned, dismiss],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') togglePinned(event);
    },
    [togglePinned],
  );

  const pinnableHandlers = useMemo(
    () =>
      pinnable
        ? {
            tabIndex: 0,
            role: 'button',
            'aria-label': 'More info',
            onClick: togglePinned,
            onMouseDown: event => event.stopPropagation(),
            onKeyDown: handleKeyDown,
            onMouseEnter: () => {
              setIsHovered(true);
              setIsDismissed(false);
            },
            onMouseLeave: () => setIsHovered(false),
            onFocus: () => {
              setIsFocused(true);
              setIsDismissed(false);
            },
            onBlur: () => setIsFocused(false),
          }
        : {},
    [pinnable, togglePinned, handleKeyDown],
  );

  const unpin = useCallback(() => setIsPinned(false), []);

  const parseInfoTooltip = useCallback((tooltip, sProps) => {
    if (!tooltip) return null;
    const isObject = typeof tooltip === 'object' && !isValidElement(tooltip);
    if (isValidElement(tooltip)) {
      return {
        title: tooltip,
        placement: sProps?.tooltip?.placement ?? INFO_TOOLTIP_DEFAULTS.placement,
        zIndex: sProps?.tooltip?.zIndex ?? INFO_TOOLTIP_DEFAULTS.zIndex,
        icon: {
          width: sProps?.tooltip?.icon?.width ?? INFO_TOOLTIP_DEFAULTS.icon.width,
          height: sProps?.tooltip?.icon?.height ?? INFO_TOOLTIP_DEFAULTS.icon.height,
          fill: sProps?.tooltip?.icon?.fill,
        },
      };
    }

    return {
      title: isObject ? tooltip.title : tooltip,
      placement: isObject
        ? (tooltip.placement ?? INFO_TOOLTIP_DEFAULTS.placement)
        : INFO_TOOLTIP_DEFAULTS.placement,
      zIndex: isObject
        ? (tooltip.zIndex ?? INFO_TOOLTIP_DEFAULTS.zIndex)
        : (sProps?.tooltip?.zIndex ?? INFO_TOOLTIP_DEFAULTS.zIndex),
      icon: {
        width: isObject
          ? (tooltip.icon?.width ?? INFO_TOOLTIP_DEFAULTS.icon.width)
          : INFO_TOOLTIP_DEFAULTS.icon.width,
        height: isObject
          ? (tooltip.icon?.height ?? INFO_TOOLTIP_DEFAULTS.icon.height)
          : INFO_TOOLTIP_DEFAULTS.icon.height,
        fill: isObject ? tooltip.icon?.fill : undefined,
      },
    };
  }, []);

  const tooltipConfig = useMemo(
    () => parseInfoTooltip(infoTooltip, slotProps),
    [parseInfoTooltip, infoTooltip, slotProps],
  );

  if (!tooltipConfig) return null;

  const boxProps = href ? { component: 'a', href, target: linkTarget, rel } : {};

  const iconElement = (
    <Box
      data-info-tooltip
      data-testid={testId}
      sx={[styles.iconContainer, pinnable && styles.pinnableIcon, sx]}
      component="span"
      {...boxProps}
      {...pinnableHandlers}
    >
      <InfoIcon
        width={tooltipConfig.icon.width}
        height={tooltipConfig.icon.height}
        fill={tooltipConfig.icon.fill}
      />
    </Box>
  );

  if (disableTooltip) return iconElement;

  const resolvedTitleProps = titleComponentProps ?? (typeof infoTooltip === 'object' ? infoTooltip : {});
  let titleContent;
  if (TitleComponent) {
    titleContent = <TitleComponent {...resolvedTitleProps} />;
  } else if (isValidElement(tooltipConfig.title)) {
    titleContent = tooltipConfig.title;
  } else {
    titleContent = <TooltipMarkdownContent>{tooltipConfig.title}</TooltipMarkdownContent>;
  }

  const tooltip = (
    <Tooltip
      title={titleContent}
      placement={tooltipConfig.placement}
      {...(pinnable && {
        open: isOpen,
        describeChild: true,
        disableHoverListener: true,
        disableFocusListener: true,
        disableTouchListener: true,
      })}
      slotProps={{
        popper: {
          sx: {
            zIndex: tooltipConfig.zIndex,
          },
        },
        // Caller-scoped testid on MuiTooltip's own `tooltip` slot (the bubble
        // element that already exists), NOT on a new wrapper node — so the
        // popper DOM is byte-identical for every InfoTooltip instance,
        // whether or not a caller opts in. `undefined` renders no attribute.
        tooltip: { 'data-testid': contentTestId, ...(pinnable && { sx: styles.pinnableTooltip }) },
      }}
    >
      {iconElement}
    </Tooltip>
  );

  if (!pinnable) return tooltip;

  return (
    <ClickAwayListener
      onClickAway={unpin}
      mouseEvent={isPinned ? 'onClick' : false}
      touchEvent={isPinned ? 'onTouchEnd' : false}
    >
      {tooltip}
    </ClickAwayListener>
  );
});

InfoTooltip.displayName = 'InfoTooltip';

/** @type {MuiSx} */
const infoTooltipStyles = () => ({
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    height: '100%',
    position: 'relative',
    cursor: 'pointer',
    overflow: 'visible',
    '& :hover': { opacity: 0.8 },
  },
  pinnableTooltip: {
    maxWidth: '20rem',
  },
  // A shrunk input label is scaled to 0.75: scale the icon back to its size and keep the same 0.5rem
  // gap to the label as outside of input labels
  pinnableIcon: {
    '.MuiFormLabel-root.MuiInputLabel-shrink &&': {
      transform: 'translateX(0.3333rem) scale(1.3334)',
      transformOrigin: 'center',
    },
    '.MuiFormLabel-root:not(.MuiInputLabel-shrink) &&': {
      transform: 'none',
    },
  },
});

export default InfoTooltip;
