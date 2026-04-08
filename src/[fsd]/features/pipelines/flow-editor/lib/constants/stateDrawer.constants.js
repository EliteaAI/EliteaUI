/**
 * Constants for Pipeline Flow Editor State Drawer
 */

// Drawer resize constraints
export const MIN_DRAWER_WIDTH = 310;
export const MAX_DRAWER_WIDTH = 800;

// Drawer width breakpoints for responsive layout
export const DRAWER_BREAKPOINT_NARROW = 310; // Icon buttons for default values
export const DRAWER_BREAKPOINT_EXPANDED = 550; // Multiline default values and wider name fields

// Variable name field widths (numeric values for calculations and interpolation)
export const NAME_FIELD_WIDTH_NARROW = 162;
export const NAME_FIELD_WIDTH_EXPANDED = 180;

// Item display modes
export const ItemMode = {
  Create: 'create',
  Display: 'display',
};
