// Design tokens for spacing, sizing, and other common values

export const SPACING = {
  // Common spacing values used throughout the app
  XS: '4px',
  SM: '8px',
  MD: '12px',
  LG: '16px',
  XL: '20px',
  XXL: '24px',
  XXXL: '32px',

  // Specific spacing values
  gap: {
    XS: '4px',
    SM: '8px',
    MD: '12px',
    LG: '16px',
    XL: '20px',
    XXL: '24px',
  },

  padding: {
    XS: '4px',
    SM: '8px',
    MD: '12px',
    LG: '16px',
    XL: '20px',
    XXL: '24px',
    XXXL: '32px',
  },

  margin: {
    XS: '4px',
    SM: '8px',
    MD: '12px',
    LG: '16px',
    XL: '20px',
    XXL: '24px',
    XXXL: '32px',
  },

  // Layout spacing
  listItemSpacing: '18px',
  containerGap: '24px',
  gridSpacing: '32px',
  cardSpacing: '24px',
};

export const ICON_SIZES = {
  XS: '12px',
  SM: '16px',
  MD: '20px',
  LG: '24px',
  XL: '28px',
  XXL: '32px',
  XXXL: '44px', // Used for larger container icons
  ERROR_IMAGE: '80px', // For Mermaid error bomb icon
};

export const BORDER_RADIUS = {
  SM: '4px',
  MD: '8px',
  LG: '16px',
  XL: '20px',
  XXL: '22px', // For circular icons
};

export const HEIGHTS = {
  input: '24px',
  button: '28px',
  buttonLarge: '40px',
  tableRow: '52px',
  tableHeader: '30px',
  card: '112px',
  iconContainer: '44px',
  toolIcon: '32px',
  errorContainer: '200px', // For Mermaid error displays
};

export const WIDTHS = {
  // Table column percentages
  tableColumn: '33.33%',
  sidePanel: '328px',
  dialogSmall: '500px',
  dialogMedium: '452px',
  errorContainer: '300px', // For Mermaid error displays
};

export const LAYOUT = {
  containerGap: '24px',
  gridSpacing: '32px',
  cardSpacing: '24px',
  listItemSpacing: '18px',

  // Common container dimensions
  maxHeight: {
    table: '440px',
    dropdown: '373px',
  },
};
