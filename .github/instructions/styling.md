# Styling and Theme Instructions

## Theme System Architecture

EliteA UI uses a sophisticated **Material-UI theming system** with custom extensions for the AI chat
application. The theme supports light/dark modes and provides consistent design tokens.

> **Note**: This document provides extended styling examples. For primary styling patterns and the standard
> workflow, refer to the main `copilot-instructions.md` file, which includes:
>
> - Standard `/** @type {MuiSx} */` JSDoc annotations
> - Theme callback patterns (`({ palette }) => ({...})`)
> - Pixel to rem conversion guide
> - Component style function conventions

## Theme Structure

### Main Theme Configuration (`/src/MainTheme.js`)

```javascript
// ✅ Theme structure overview
import { eliteaButtonStyle } from '@/components/Button.jsx';
import { eliteaDataGridStyle } from '@/components/DataGrid.jsx';

import darkPalette from './darkPalette';
import lightPalette from './lightPalette';

// Custom typography variants
export const typographyVariants = {
  headingMedium: {
    fontWeight: 600,
    fontSize: '1rem', // 16px
    lineHeight: '1.5rem', // 24px
  },
  headingSmall: {
    fontWeight: 600,
    fontSize: '0.875rem', // 14px
    lineHeight: '1.5rem', // 24px
  },
  labelMedium: {
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: '1.5rem', // 24px
  },
  labelSmall: {
    fontWeight: 500,
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem', // 16px
  },
  bodyMedium: {
    fontWeight: 400,
    fontSize: '0.875rem', // 14px
    lineHeight: '1.5rem', // 24px
  },
  bodySmall: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem', // 16px
  },
};
```

### Typography Usage

```javascript
// ✅ Use custom typography variants
<Typography variant="headingMedium">Section Title</Typography>
<Typography variant="headingSmall">Subsection</Typography>
<Typography variant="labelMedium">Form Label</Typography>
<Typography variant="labelSmall">Helper Text</Typography>
<Typography variant="bodyMedium">Body Text</Typography>
<Typography variant="bodySmall">Small Details</Typography>

// ✅ Accessing theme colors in typography
<Typography
  variant="bodyMedium"
  sx={(theme) => ({
    color: theme.palette.text.secondary
  })}
>
  Secondary text
</Typography>
```

## Color System

### Theme-Aware Color Usage

```javascript
// ✅ Accessing theme colors properly
import { styled } from '@mui/material/styles';

const StyledComponent = styled(Box)(({ theme }) => ({
  // Text colors
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,

  // Button colors
  '& .primary-button': {
    color: theme.palette.text.button.primary,
    backgroundColor: theme.palette.background.button.primary.default,
    '&:hover': {
      backgroundColor: theme.palette.background.button.primary.hover,
    },
    '&:active': {
      backgroundColor: theme.palette.background.button.primary.pressed,
    },
  },

  // Border colors
  border: `1px solid ${theme.palette.border.lines}`,

  // Status colors
  '& .success': { color: theme.palette.success.main },
  '& .error': { color: theme.palette.error.main },
  '& .warning': { color: theme.palette.warning.main },
}));
```

### Common Color Patterns

```javascript
// ✅ Standard color usage patterns
const ColorExamples = styled(Box)(({ theme }) => ({
  // Primary content
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,

  // Cards and panels
  '& .card': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },

  // Interactive states
  '& .hover-item': {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },

  // Disabled states
  '& .disabled': {
    color: theme.palette.text.disabled,
    backgroundColor: theme.palette.action.disabledBackground,
  },
}));
```

## Component Styling Patterns

### Primary Pattern: `sx` Prop with Style Functions

The codebase consistently uses the `sx` prop with style functions as the primary method for styling
components. This approach is preferred for its co-location of styles with component logic, ease of dynamic
styling, and direct access to the theme.

```javascript
// ✅ Preferred pattern: Define styles as a function returning an object
/** @type {MuiSx} */
const componentStyles = (dynamicParam1, dynamicParam2) => ({
  wrapper: ({ palette, spacing }) => ({
    padding: spacing(2),
    backgroundColor: palette.background.paper,
    color: palette.text.primary,
    display: 'flex',
    gap: spacing(1),
  }),
  contentBox: {
    flex: 1,
    minHeight: '100%',
  },
});

// Apply styles using sx prop
const MyComponent = ({ isSmall }) => {
  const styles = componentStyles(isSmall, someOtherParam);

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.contentBox}>Content</Box>
    </Box>
  );
};
```

**Key conventions for style functions:**

- Use JSDoc comment `/** @type {MuiSx} */` above style function definitions.
- Name style functions as `{componentName}Styles` (e.g., `artifactsStyles`, `runHistoryContainerStyles`).
- Accept dynamic parameters that affect styling (e.g., viewport size, state flags).
- Return an object where keys are semantic names for elements (`wrapper`, `container`, `contentBox`, etc.).
- Access theme tokens via a destructured function argument: `({ palette, spacing, breakpoints }) => ({...})`.
- For static styles, use plain objects; for theme-dependent styles, use functions.
- Store style functions at the bottom of the component file, before the default export.

### Alternative Pattern: `styled()` API (Legacy Code)

The `styled()` API is found in older parts of the codebase. While functional, it is not the preferred method
for new components. Avoid using it unless you are modifying existing code that already uses this pattern.

```javascript
// ❌ Avoid in new code, use for maintaining legacy components
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));
```

## Layout and Spacing

### Consistent Spacing System

```javascript
// ✅ Layout constants from constants.js
import { NAV_BAR_HEIGHT, RIGHT_PANEL_WIDTH, SIDE_BAR_WIDTH } from '@/common/constants';

// ✅ Use theme spacing units
const SpacingExamples = styled(Box)(({ theme }) => ({
  // Standard spacing increments (8px base)
  padding: theme.spacing(1), // 8px
  margin: theme.spacing(2), // 16px
  gap: theme.spacing(3), // 24px

  // Multiple values
  padding: theme.spacing(2, 3), // 16px 24px
  margin: theme.spacing(1, 2, 3, 2), // 8px 16px 24px 16px

  // Fractional spacing
  padding: theme.spacing(0.5), // 4px
  margin: theme.spacing(1.5), // 12px
}));

const LayoutComponent = styled(Box)(({ theme }) => ({
  marginLeft: `${SIDE_BAR_WIDTH}rem`,
  paddingTop: `${NAV_BAR_HEIGHT}rem`,

  // Responsive layout
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
  },
}));
```

### Grid and Flexbox Patterns

```javascript
// ✅ Common layout patterns
const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(3),
  padding: theme.spacing(3),

  // Responsive grid
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(2),
  },
}));

const FlexContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),

  // Responsive flex
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));
```

## Button Styling

### Using Existing Button Styles

```javascript
// ✅ Reuse established button patterns
import { eliteaButtonStyle } from '@/components/Button';

const CustomButton = styled(Button)(({ theme, buttonVariant = 'primary' }) => ({
  ...eliteaButtonStyle(theme, buttonVariant),

  // Additional customizations
  minWidth: '140px',

  '&.loading': {
    pointerEvents: 'none',
    opacity: 0.7,
  },
}));

// Usage with variants
<CustomButton buttonVariant="primary">Primary</CustomButton>
<CustomButton buttonVariant="secondary">Secondary</CustomButton>
<CustomButton buttonVariant="tertiary">Tertiary</CustomButton>
```

### Icon Button Patterns

```javascript
// ✅ Icon button styling
import { eliteaIconButtonStyle } from '@/components/IconButton';

const ActionIconButton = styled(IconButton)(({ theme }) => ({
  ...eliteaIconButtonStyle(theme),

  '&.danger': {
    color: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.light + '20', // 20% opacity
    },
  },
}));
```

## Form Styling

### Input Field Patterns

```javascript
// ✅ Custom input styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,

    '& fieldset': {
      borderColor: theme.palette.border.lines,
    },

    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },

    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
    },
  },

  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,

    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));
```

### Form Layout Patterns

```javascript
// ✅ Consistent form layouts
const FormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(3),

  '& .form-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },

  '& .form-row': {
    display: 'flex',
    gap: theme.spacing(2),

    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },

  '& .form-actions': {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),

    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
    },
  },
}));
```

## Data Display Styling

### Table and Grid Styling

```javascript
// ✅ Use existing DataGrid styles
import { eliteaDataGridStyle } from '@/components/DataGrid';

const CustomDataGrid = styled(DataGrid)(({ theme }) => ({
  ...eliteaDataGridStyle(theme),

  // Additional customizations
  '& .highlighted-row': {
    backgroundColor: theme.palette.action.selected,
  },

  '& .status-active': {
    color: theme.palette.success.main,
  },

  '& .status-inactive': {
    color: theme.palette.error.main,
  },
}));
```

### Card Styling Patterns

```javascript
// ✅ Consistent card styling
const DataCard = styled(Paper)(({ theme, variant = 'default' }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,

  ...(variant === 'outlined' && {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
  }),

  ...(variant === 'selected' && {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  }),

  '& .card-header': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },

  '& .card-actions': {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
}));
```

## Animation and Transitions

### Consistent Animation Patterns

```javascript
// ✅ Theme-based transitions
const AnimatedComponent = styled(Box)(({ theme }) => ({
  transition: theme.transitions.create(['opacity', 'transform'], {
    duration: theme.transitions.duration.short,
  }),

  '&.entering': {
    opacity: 0,
    transform: 'translateY(-10px)',
  },

  '&.entered': {
    opacity: 1,
    transform: 'translateY(0)',
  },

  '&:hover': {
    transform: 'translateY(-2px)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shorter,
    }),
  },
}));
```

## Responsive Design

### Breakpoint Usage

```javascript
// ✅ Responsive design patterns
const ResponsiveContainer = styled(Box)(({ theme }) => ({
  // Mobile first approach
  padding: theme.spacing(2),

  // Tablet
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },

  // Desktop
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: theme.spacing(4),
  },

  // Large screens
  [theme.breakpoints.up('lg')]: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
}));
```

### Mobile-Specific Patterns

```javascript
// ✅ Mobile adaptations
const MobileAdaptive = styled(Box)(({ theme }) => ({
  // Default desktop styles
  display: 'flex',
  flexDirection: 'row',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',

    '& .sidebar': {
      order: 2, // Move sidebar to bottom on mobile
    },

    '& .main-content': {
      order: 1,
    },
  },

  // Touch-friendly interactions
  [theme.breakpoints.down('sm')]: {
    '& .clickable': {
      minHeight: '44px', // Touch target size
      padding: theme.spacing(1.5),
    },
  },
}));
```

## Dark Mode Considerations

### Theme-Agnostic Styling

```javascript
// ✅ Works in both light and dark modes
const ThemeAgnosticComponent = styled(Box)(({ theme }) => ({
  // Use semantic color names
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderColor: theme.palette.divider,

  // Avoid hardcoded colors
  '& .success-indicator': {
    color: theme.palette.success.main, // ✅ Good
    // color: '#4caf50', // ❌ Bad - hardcoded
  },

  // Use alpha channels for overlays
  '& .overlay': {
    backgroundColor: theme.palette.action.hover,
  },
}));
```

## Performance Considerations

### Styled Component Optimization

```javascript
// ✅ Optimized styled components
const OptimizedStyledComponent = styled(Box, {
  shouldForwardProp: prop => prop !== 'isActive' && prop !== 'variant',
})(({ theme, isActive, variant }) => ({
  // Base styles
  padding: theme.spacing(2),

  // Conditional styles
  ...(isActive && {
    backgroundColor: theme.palette.primary.light,
  }),

  // Variant styles
  ...(variant === 'compact' && {
    padding: theme.spacing(1),
  }),
}));
```

### CSS-in-JS Best Practices

```javascript
// ✅ Efficient theme access
const theme = useTheme();

// ✅ Memoize complex calculations
const complexStyles = useMemo(
  () => ({
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    boxShadow: `0 3px 5px 2px ${theme.palette.primary.main}30`,
  }),
  [theme.palette.primary.main, theme.palette.secondary.main],
);
```

Remember: Always use the established theme system and color tokens. This ensures consistency across the
application and proper light/dark mode support.
