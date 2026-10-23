// Sizes in px, matching the NodeTypeSelector styles (1rem = 16px)
const CARD_WIDTH = 258;
const GRID_GAP = 8;
const PAPER_PADDING_X = 32;
const PAPER_BORDER = 2;
const ANCHOR_GAP = 8;
export const BOUNDARY_MARGIN = 24;
const MIN_HEIGHT = 200;

export const TWO_COLUMNS_WIDTH = CARD_WIDTH * 2 + GRID_GAP + PAPER_PADDING_X + PAPER_BORDER;

/**
 * Fits the node type selector into the canvas it opens over:
 * two columns when the canvas is wide enough, otherwise one, and a max height so it scrolls
 * inside the canvas instead of overflowing it.
 */
export const getNodeTypeSelectorLayout = ({ boundaryRect, anchorRect, isCentered = false }) => {
  if (!boundaryRect) {
    return { columns: 2, maxWidth: null, maxHeight: null };
  }

  const maxWidth = Math.max(boundaryRect.width - BOUNDARY_MARGIN * 2, CARD_WIDTH);
  const availableHeight =
    isCentered || !anchorRect
      ? boundaryRect.height - BOUNDARY_MARGIN * 2
      : boundaryRect.bottom - anchorRect.bottom - ANCHOR_GAP - BOUNDARY_MARGIN;

  return {
    columns: maxWidth >= TWO_COLUMNS_WIDTH ? 2 : 1,
    maxWidth,
    maxHeight: Math.max(availableHeight, MIN_HEIGHT),
  };
};
