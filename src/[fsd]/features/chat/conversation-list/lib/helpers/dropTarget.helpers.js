import { alpha } from '@mui/material';

/**
 * Shared drop-target styles for folders and the ungrouped area, so the two can't drift apart.
 * Only the glow and hint strength differ between them.
 * Options: minHeight, glowShadow, glowAlpha, hintBorderAlpha, hintBackgroundAlpha.
 * @type {(options: object) => MuiSx}
 */
export const getDropTargetStyles = ({
  minHeight,
  glowShadow,
  glowAlpha,
  hintBorderAlpha,
  hintBackgroundAlpha,
}) => ({
  // Padding while dragging keeps the overlay border inside the list.
  wrapper: hasDropSpacing => ({
    padding: hasDropSpacing ? '0.125rem' : 0,
    transition: 'padding 0.2s ease-in-out',
  }),
  dropZone: {
    position: 'relative',
    minHeight,
    borderRadius: '0.375rem',
    transition: 'all 0.2s ease-in-out',
  },
  activeDropBorder: ({ palette }) => ({
    position: 'absolute',
    inset: '-0.125rem',
    border: `0.125rem dashed ${palette.primary.main}`,
    borderRadius: '0.5rem',
    backgroundColor: alpha(palette.primary.main, 0.08),
    pointerEvents: 'none',
    zIndex: 999,
    boxShadow: `${glowShadow} ${alpha(palette.primary.main, glowAlpha)}`,
  }),
  validDropHint: ({ palette }) => ({
    position: 'absolute',
    inset: '-0.0625rem',
    border: `0.0625rem solid ${alpha(palette.primary.main, hintBorderAlpha)}`,
    borderRadius: '0.4375rem',
    backgroundColor: alpha(palette.primary.main, hintBackgroundAlpha),
    pointerEvents: 'none',
    zIndex: 998,
  }),
  disabledOverlay: ({ palette }) => ({
    position: 'absolute',
    inset: 0,
    backgroundColor: palette.background.overlay.dim,
    borderRadius: '0.375rem',
    pointerEvents: 'none',
    zIndex: 997,
  }),
});
