import { SPACING as DESIGN_SPACING, HEIGHTS, ICON_SIZES } from '@/common/designTokens';

// Unified dropdown constants matching Figma specifications
export const TIMEOUTS = {
  FOCUS_RETRY_1: 50,
  FOCUS_RETRY_2: 150,
  FOCUS_RETRY_3: 300,
};

export const DIMENSIONS = {
  MENU_WIDTH: '14.25rem', // 228px - Exact Figma width
  MENU_MAX_HEIGHT: '23.3125rem', // 373px - Set maxHeight instead of fixed height
  ITEM_HEIGHT: HEIGHTS.buttonLarge, // 40px
  SEARCH_FIELD_HEIGHT: '2rem', // 32px - Figma height
  ICON_SIZE: ICON_SIZES.SM, // 16px
  ICON_SVG_SIZE: '0.73rem', // ~11.68px - SVG size inside EntityIcon container
};

export const SPACING = {
  MENU_PADDING: '0.25rem 0', // 4px 0px - Figma padding
  MENU_TOP_MARGIN: DESIGN_SPACING.SM, // 8px
  ITEM_ICON_TEXT_GAP: DESIGN_SPACING.gap.MD, // 12px (Figma gap between icon and text)
  ITEM_REGULAR_GAP: DESIGN_SPACING.gap.SM, // 8px (Figma gap for regular items)
};

export const BORDER_RADIUS = {
  MENU: DESIGN_SPACING.SM, // 8px
};
