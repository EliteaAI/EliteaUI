import { useMemo } from 'react';

import {
  CARD_FLEX_GRID,
  CARD_TOTAL_WIDTH_PX,
  CARD_WIDTH_PX,
  FULL_WIDTH_CARD_FLEX_GRID,
} from '@/common/constants';

const CARD_GAP_PX = CARD_TOTAL_WIDTH_PX - CARD_WIDTH_PX; // 16px gap between cards

/**
 * Computes card width for responsive grid layout.
 *
 * For <= 3 cards: returns an object keyed by MUI custom breakpoints
 * (prompt_list_xs, prompt_list_xl, etc.) → MUI generates responsive media queries.
 *
 * For > 3 cards: returns a fixed pixel width that distributes remaining
 * container space evenly across columns.
 *
 * @param {number} cardListWidth - measured container width in px
 * @param {number} cardCount - number of cards to render
 * @param {boolean} isFullWidthPage - whether the page uses the full-width grid
 * @returns {string|object} card width value for the sx `width` property
 */
export const useCardLayout = (cardListWidth, cardCount, isFullWidthPage) => {
  return useMemo(() => {
    const gridSet = isFullWidthPage ? FULL_WIDTH_CARD_FLEX_GRID : CARD_FLEX_GRID;
    const cardWidthConfig =
      {
        1: gridSet.ONE_CARD,
        2: gridSet.TWO_CARDS,
        3: gridSet.THREE_CARDS,
      }[cardCount] || gridSet.MORE_THAN_THREE_CARDS;

    if (cardCount <= 3) {
      return cardWidthConfig;
    }

    const maxCols = Math.floor((cardListWidth + CARD_GAP_PX) / CARD_TOTAL_WIDTH_PX);
    const remainingSpace = cardListWidth - maxCols * CARD_TOTAL_WIDTH_PX;
    const extraWidthPerCard = remainingSpace / maxCols;
    const destWidth = `${CARD_WIDTH_PX + extraWidthPerCard}px`;
    return destWidth;
  }, [cardListWidth, cardCount, isFullWidthPage]);
};
