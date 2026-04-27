/**
 * MUI MenuList Variants for AlitaUI
 * Based on MUI MenuList composition patterns and AlitaUI design system
 * Contains all menu list style variants and configurations
 */

export const alitaMenuListVariants = [
  // Default MenuList
  /**
   * @variant default
   * @description Default menu list with standard spacing and background
   * @example <MenuList>...</MenuList>
   */
  {
    props: {},
    style: ({ theme }) => ({
      padding: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
    }),
  },

  // Dense MenuList
  /**
   * @variant dense
   * @description Dense menu list with reduced padding for compact layouts
   * @example <MenuList variant="dense">...</MenuList>
   */
  {
    props: { variant: 'dense' },
    style: ({ theme }) => ({
      padding: theme.spacing(0.5, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
      '& .MuiMenuItem-root': {
        minHeight: theme.spacing(4),
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
      },
    }),
  },

  // Icon MenuList
  /**
   * @variant icon
   * @description Menu list optimized for items with icons
   * @example <MenuList variant="icon">...</MenuList>
   */
  {
    props: { variant: 'icon' },
    style: ({ theme }) => ({
      padding: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
      '& .MuiMenuItem-root': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        minHeight: theme.spacing(5),
      },
    }),
  },

  // Compact MenuList
  /**
   * @variant compact
   * @description Compact menu list with minimal spacing
   * @example <MenuList variant="compact">...</MenuList>
   */
  {
    props: { variant: 'compact' },
    style: ({ theme }) => ({
      padding: 0,
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(0.5),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
      '& .MuiMenuItem-root': {
        minHeight: theme.spacing(3.5),
        paddingTop: theme.spacing(0.25),
        paddingBottom: theme.spacing(0.25),
      },
    }),
  },

  // Elevated MenuList
  /**
   * @variant elevated
   * @description Menu list with enhanced shadow for elevated appearance
   * @example <MenuList variant="elevated">...</MenuList>
   */
  {
    props: { variant: 'elevated' },
    style: ({ theme }) => ({
      padding: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.elevated || '0 8px 24px rgba(0,0,0,0.12)',
    }),
  },

  // Context MenuList
  /**
   * @variant context
   * @description Menu list designed for context menus with subtle styling
   * @example <MenuList variant="context">...</MenuList>
   */
  {
    props: { variant: 'context' },
    style: ({ theme }) => ({
      padding: theme.spacing(0.5, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(0.5),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
      minWidth: theme.spacing(20),
      '& .MuiMenuItem-root': {
        fontSize: theme.typography.body2.fontSize,
        paddingTop: theme.spacing(0.75),
        paddingBottom: theme.spacing(0.75),
      },
    }),
  },

  // Navigation MenuList
  /**
   * @variant navigation
   * @description Menu list for navigation items with enhanced styling
   * @example <MenuList variant="navigation">...</MenuList>
   */
  {
    props: { variant: 'navigation' },
    style: ({ theme }) => ({
      padding: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
      '& .MuiMenuItem-root': {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        minHeight: theme.spacing(6),
        borderRadius: theme.spacing(0.5),
        margin: theme.spacing(0, 1),
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
          },
        },
      },
    }),
  },

  // User MenuList
  /**
   * @variant user
   * @description Menu list optimized for user-related actions and profiles
   * @example <MenuList variant="user">...</MenuList>
   */
  {
    props: { variant: 'user' },
    style: ({ theme }) => ({
      padding: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.secondary,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.border.lines}`,
      boxShadow: theme.palette.boxShadow.default,
      minWidth: theme.spacing(28),
      '& .MuiMenuItem-root': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        minHeight: theme.spacing(5),
        '& .MuiAvatar-root': {
          width: theme.spacing(3),
          height: theme.spacing(3),
        },
      },
    }),
  },
];

/**
 * MenuItem variants for enhanced styling within MenuLists
 */
export const alitaMenuItemVariants = [
  // Default MenuItem
  {
    props: {},
    style: ({ theme }) => ({
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      minHeight: theme.spacing(5),
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&.Mui-selected': {
        backgroundColor: theme.palette.action.selected,
        '&:hover': {
          backgroundColor: theme.palette.action.selected,
        },
      },
      '&.Mui-disabled': {
        opacity: 0.5,
      },
    }),
  },

  // Dense MenuItem
  {
    props: { variant: 'dense' },
    style: ({ theme }) => ({
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      minHeight: theme.spacing(4),
      fontSize: theme.typography.body2.fontSize,
    }),
  },

  // Icon MenuItem
  {
    props: { variant: 'icon' },
    style: ({ theme }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      minHeight: theme.spacing(5),
      '& .MuiSvgIcon-root': {
        fontSize: theme.spacing(2),
        color: theme.palette.text.secondary,
      },
    }),
  },

  // Destructive MenuItem
  {
    props: { variant: 'destructive' },
    style: ({ theme }) => ({
      color: theme.palette.error.main,
      '&:hover': {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.dark,
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.error.main,
      },
    }),
  },
];
