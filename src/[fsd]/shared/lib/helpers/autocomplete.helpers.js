import {
  LISTBOX_MIN_HEIGHT_REM,
  LISTBOX_OFFSET_REM,
  MAX_LISTBOX_HEIGHT,
} from '../constants/autocomplete.constants.js';

const isValidHeight = height => (typeof height === 'string' ? height.trim() !== '' : Number.isFinite(height));

const toCssHeight = height => (typeof height === 'number' ? `${height}px` : height);

/**
 * Keeps the listbox maxHeight within the viewport: the caller-provided maxHeight (if valid),
 * the space actually available for the listbox (px, optional) and 40vh, whichever is smallest.
 */
export const clampListBoxStyle = (style, availableHeight) => {
  const limits = [];

  if (isValidHeight(style?.maxHeight)) limits.push(toCssHeight(style.maxHeight));
  if (Number.isFinite(availableHeight)) limits.push(`${availableHeight}px`);

  if (!limits.length) return style ?? {};

  return { ...style, maxHeight: `min(${[...limits, MAX_LISTBOX_HEIGHT].join(', ')})` };
};

/**
 * Height (px) the listbox can take below the anchor, but never less than three option rows.
 */
export const getListboxMaxHeight = (anchorRect, viewportHeight, remPx) =>
  Math.max(
    LISTBOX_MIN_HEIGHT_REM * remPx,
    Math.floor(viewportHeight - anchorRect.bottom - LISTBOX_OFFSET_REM * remPx),
  );
