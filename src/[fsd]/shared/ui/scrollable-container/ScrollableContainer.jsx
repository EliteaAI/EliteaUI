import { forwardRef, memo } from 'react';

import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

import { Box } from '@mui/material';

const SIMPLEBAR_FILL_STYLE = { height: '100%', width: '100%' };

/**
 * A scrollable container backed by SimpleBar.
 *
 * The `ref` is forwarded to the underlying SimpleBar instance so consumers
 * can call SimpleBar methods (e.g. `ref.current.getScrollElement()`).
 *
 * Use the `sx` prop to extend or override the outer container layout.
 */
const ScrollableContainer = forwardRef((props, ref) => {
  const { children, sx } = props;

  let resolvedSx;

  if (Array.isArray(sx)) {
    resolvedSx = [scrollableContainerStyles.wrapper, ...sx];
  } else if (sx == null) {
    resolvedSx = scrollableContainerStyles.wrapper;
  } else {
    resolvedSx = [scrollableContainerStyles.wrapper, sx];
  }

  return (
    <Box sx={resolvedSx}>
      <SimpleBar
        ref={ref}
        autoHide={false}
        style={SIMPLEBAR_FILL_STYLE}
      >
        {children}
      </SimpleBar>
    </Box>
  );
});

ScrollableContainer.displayName = 'ScrollableContainer';

/** @type {MuiSx} */
const scrollableContainerStyles = {
  wrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    height: '100%',
    width: '100%',
    '& .simplebar-scrollbar::before': {
      borderRadius: '999px',
      backgroundColor: palette.scrollbar.thumb,
      opacity: 1,
      transition: 'background-color 0.2s ease-in-out, opacity 0.2s ease-in-out',
    },
    '& .simplebar-scrollbar.simplebar-visible::before': {
      opacity: 1,
    },
    '& .simplebar-track': {
      pointerEvents: 'auto',
    },
    '& .simplebar-track:hover .simplebar-scrollbar::before': {
      backgroundColor: palette.scrollbar.thumbHover,
      cursor: 'grabbing',
      opacity: 1,
    },
    '& .simplebar-dragging .simplebar-scrollbar::before': {
      backgroundColor: palette.scrollbar.thumbHover,
      opacity: 1,
    },
    '& .simplebar-track.simplebar-vertical': {
      width: '0.5rem',
      right: '0.08125rem',
    },
  }),
};

export default memo(ScrollableContainer);
