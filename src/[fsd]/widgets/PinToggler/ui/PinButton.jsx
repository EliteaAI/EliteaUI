import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { usePin } from '@/[fsd]/widgets/PinToggler/lib/hooks';
import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import PinIconOutlined from '@/assets/pin-icon.svg?react';

const PinButton = memo(props => {
  const {
    entityId,
    entityType,
    initialPinned = false,
    formikContext = null,
    variant = 'default',
    alwaysVisible = false,
    disabled: externalDisabled = false,
    onPinChange,
  } = props;

  const { isPinned, togglePin, isLoading } = usePin({
    entityId,
    entityType,
    initialPinned,
    formikContext,
    onPinChange,
  });

  const disabled = externalDisabled || isLoading || !entityId;

  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();
      if (!disabled) {
        togglePin();
      }
    },
    [disabled, togglePin],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const tooltipTitle = useMemo(() => (isPinned ? 'Unpin from top' : 'Pin to top'), [isPinned]);

  const isVisible = isPinned || isHovered || alwaysVisible;
  const tooltipDelay = variant === 'toolbar' ? 0 : 3000;

  // Ensure the icon doesn't stay visible after unpin/reorder when not actually hovered
  useEffect(() => {
    if (!isPinned && !alwaysVisible) {
      setIsHovered(false);
    }
  }, [isPinned, alwaysVisible]);

  const styles = pinButtonStyles(isVisible, variant);

  return (
    <StyledTooltip
      key={`pin-tooltip-${isPinned}`}
      title={tooltipTitle}
      placement="top"
      enterDelay={tooltipDelay}
      enterNextDelay={tooltipDelay}
      disableFocusListener
      disableTouchListener
    >
      <Box component="span">
        <IconButton
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
          aria-label={tooltipTitle}
          sx={styles.button}
        >
          {isPinned ? <PinIconFilled /> : <PinIconOutlined />}
        </IconButton>
      </Box>
    </StyledTooltip>
  );
});

PinButton.displayName = 'PinButton';

/** @type {MuiSx} */
const pinButtonStyles = (isVisible, variant) => ({
  button: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    minWidth: '1.75rem',
    padding: 0,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    ...(variant === 'toolbar'
      ? {
          backgroundColor: palette.background.button.secondary.default,
          '&:hover': {
            backgroundColor: palette.background.button.secondary.hover,
          },
        }
      : {
          color: palette.icon.fill.default,
          '&:hover': {
            backgroundColor: palette.background.button.secondary.default,
          },
        }),
  }),
});

export default PinButton;
