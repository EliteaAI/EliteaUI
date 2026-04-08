import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import { Tooltip, Typography, useTheme } from '@mui/material';

/**
 * Custom hook to detect text overflow
 * Returns true if the text is truncated (overflowing its container)
 */
export const useTextOverflow = text => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const element = textRef.current;
        const isTextOverflowing = element.scrollWidth > element.clientWidth;
        setIsOverflowing(isTextOverflowing);
      }
    };

    // Check overflow with multiple delays to handle different rendering scenarios
    const timeoutId1 = setTimeout(checkOverflow, 50);
    const timeoutId2 = setTimeout(checkOverflow, 200);

    // Check overflow on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkOverflow, 10);
    });

    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      resizeObserver.disconnect();
    };
  }, [text]);

  return { textRef, isOverflowing };
};

/**
 * Typography component with conditional tooltip
 * Shows tooltip only when text overflows
 */
export const TypographyWithConditionalTooltip = forwardRef(
  ({ title, placement = 'right', children, sx, ...typographyProps }, ref) => {
    const theme = useTheme();
    const { textRef, isOverflowing } = useTextOverflow(title);

    const handleRef = useCallback(
      el => {
        textRef.current = el;
        if (ref) {
          if (typeof ref === 'function') {
            ref(el);
          } else {
            ref.current = el;
          }
        }
      },
      [ref, textRef],
    );

    return (
      <Tooltip
        title={isOverflowing ? title : ''}
        placement={placement}
        disableHoverListener={!isOverflowing}
        arrow
        slotProps={{
          tooltip: {
            sx: {
              padding: '4px 8px',
              maxWidth: '300px',
              wordWrap: 'break-word',
            },
          },
          popper: {
            sx: {
              zIndex: (theme.vars || theme).zIndex.tooltip,
            },
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 8], // [skidding, distance] - 8px distance from element
                },
              },
            ],
          },
        }}
      >
        <Typography
          ref={handleRef}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...sx,
          }}
          {...typographyProps}
        >
          {children}
        </Typography>
      </Tooltip>
    );
  },
);

TypographyWithConditionalTooltip.displayName = 'TypographyWithConditionalTooltip';

/**
 * Conditional Tooltip Component (Legacy support)
 * Only shows tooltip when text is actually truncated
 */
export const ConditionalTooltip = ({ children, title, placement = 'right', ...tooltipProps }) => {
  const theme = useTheme();
  const { textRef, isOverflowing } = useTextOverflow(title);

  return (
    <Tooltip
      title={isOverflowing ? title : ''}
      placement={placement}
      disableHoverListener={!isOverflowing}
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: theme.palette.background.tooltip.default,
            color: theme.palette.text.button.primary,
            fontStyle: 'normal',
            padding: '4px 8px',
            borderRadius: '4px', // Small corner radius like default MUI tooltip
            maxWidth: '300px',
            margin: '2px',
            wordWrap: 'break-word',
            // Using labelSmall variant styles
            ...theme.typography.labelSmall,
            '& .MuiTooltip-arrow': {
              color: theme.palette.background.tooltip.default,
            },
          },
        },
        popper: {
          sx: {
            zIndex: (theme.vars || theme).zIndex.tooltip,
          },
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 8], // [skidding, distance] - 8px distance from element
              },
            },
          ],
        },
      }}
      {...tooltipProps}
    >
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </span>
    </Tooltip>
  );
};
