# EliteA UI - AI Chat Application Instructions

## Project Overview

**EliteA UI** is a sophisticated React-based AI chat application with advanced conversation management,
pipeline creation, and data source integration. This is an enterprise-grade frontend application built for AI
conversation experiences.

### Technology Stack

- **Frontend**: React 18.3+ with hooks, Vite for development/build
- **UI Framework**: Material-UI v7 (@mui/material) with custom theming
- **State Management**: Redux Toolkit with RTK Query for API calls
- **Routing**: React Router DOM v7
- **Styling**: Emotion CSS-in-JS, Material-UI theming system
- **Code Editor**: CodeMirror 6 for code editing features
- **Charts**: Recharts, MUI X-Charts for data visualization
- **Testing**: Playwright for E2E testing with Cucumber

### Architecture Patterns

- **Feature-Sliced Design (FSD)**: The project is organized by business domains and technical
  responsibilities.
- **Feature-based folder structure** organized by domain (Applications, Pipelines, DataSources, etc.)
- **RTK Query** for all API operations with centralized `eliteaApi`
- **Custom theme system** with light/dark mode support
- **Component composition** over inheritance
- **Custom hooks** for reusable logic (prefix with `use`)

### Key FSD Principles

- **Layering Rule**: Lower layers cannot import from higher layers. For example, `features` cannot import from
  `app` or `pages`. This prevents circular dependencies and maintains a clear architectural hierarchy.
- **Single Responsibility**: Each FSD segment (`ui`, `model`, `api`, `lib`) has a specific purpose. UI
  components should only handle presentation, while business logic should reside in `lib` or `model`.
- **Feature Isolation**: Features should be self-contained and independent. This allows them to be reused or
  moved easily.
- **Public API via Index Files**: Each feature slice should expose its public API through an `index.js` file
  (barrel file). This encapsulates the feature's internal structure, and consumers should only import from
  this public API. This allows internal refactoring without breaking external code. For clarity and to avoid
  circular dependencies, imports should be as specific as possible, pointing to the feature's segment (e.g.
  `features/my-feature/ui`) where appropriate.

## File Structure Conventions

```
src/
[fsd]           # Feature-Sliced Design structure (NEW ARCHITECTURE)
├── app/                          # Application layer
│   ├── providers/         # React providers (Router, Redux, Theme)
│   ├── store/                    # Redux store configuration
│   ├── App.jsx                   # Root application component
│   └── main.jsx                  # Application entry point
│
├── pages/                        # Pages layer
│   ├── HomePage/                 # Landing/dashboard page
│   ├── ChatPage/                 # Chat interface page
│   ├── ApplicationsPage/         # Applications listing page
│   ├── PipelinesPage/            # Pipelines management page
│   ├── SettingsPage/             # Settings page
│   └── Page404/                  # Error page
│
├── widgets/                      # Widgets layer
│   ├── Header/                   # Application header
│   ├── Sidebar/                  # Navigation sidebar
│   ├── ChatInterface/            # Complete chat widget
│   ├── ApplicationsList/         # Applications management widget
│   └── NotificationCenter/       # Notifications widget
│
├── features/                     # Features layer
│   ├── auth/                     # Authentication
│   │   ├── api/                  # Login, logout, session APIs
│   │   ├── model/                # Auth state management
│   │   ├── ui/                   # Login forms, auth guards
│   │   └── index.js              # Public exports
│   │
│   ├── chat/                     # Chat functionality
│   │   ├── api/                  # Chat messages, conversations
│   │   ├── model/                # Chat state, message history
│   │   ├── ui/                   # ChatMessage, MessageInput, etc.
│   │   ├── lib/                  # Message formatting, utils
│   │   └── index.js
│   │
│   ├── applications/             # AI Applications management
│   │   ├── api/                  # CRUD operations for applications
│   │   ├── model/                # Applications state
│   │   ├── ui/                   # ApplicationCard, CreateForm, etc.
│   │   ├── lib/                  # Validation, formatting
│   │   └── index.js
│   │
│   ├── pipelines/                # Pipeline creation and management
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/
│   │   ├── lib/                  # Pipeline validation, flow logic
│   │   └── index.js
│   │
│   ├── data-sources/             # Data sources management
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/
│   │   └── index.js
│   │
│   └── monitoring/               # System monitoring
│       ├── api/
│       ├── model/
│       ├── ui/
│       └── index.js
│
├── entities/                     # Entities layer
│   ├── user/                     # User entity
│   │   ├── api/                  # User-related API calls
│   │   ├── model/                # User state, selectors
│   │   ├── ui/                   # UserCard, UserAvatar, etc.
│   │   └── index.js
│   │
│   ├── project/                  # Project entity
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/                   # ProjectCard, ProjectSelect
│   │   └── index.js
│   │
│   ├── conversation/             # Chat conversation entity
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/                   # ConversationItem, ConversationList
│   │   └── index.js
│   │
│   └── application/              # AI Application entity
│       ├── api/
│       ├── model/
│       ├── ui/                   # ApplicationCard, ApplicationIcon
│       └── index.js
│
└── shared/                       # Shared layer
    ├── api/                      # Base API configuration
    │   ├── base.js               # Axios setup, interceptors
    │   ├── eliteaApi.js           # RTK Query base API
    │   └── types.js              # API type definitions
    │
    ├── ui/                       # Reusable UI components
    │   ├── Button/               # Base button component
    │   ├── Input/                # Input components
    │   ├── Modal/                # Modal components
    │   ├── Layout/               # Layout components
    │   ├── DataDisplay/          # Tables, lists, cards
    │   ├── Navigation/           # Tabs, breadcrumbs
    │   └── Feedback/             # Toasts, alerts, loading
    │
    ├── lib/                      # Utility libraries
    │   ├── react-query/          # React Query configuration
    │   ├── validation/           # Yup schemas, validators
    │   ├── formatting/           # Date, number formatting
    │   ├── constants/            # Application constants
    │   └── utils/                # Pure utility functions
    │
    ├── hooks/                    # Reusable React hooks
    │   ├── useLocalStorage.js
    │   ├── useDebounce.js
    │   ├── useToast.js
    │   └── index.js
    │
    ├── assets/                   # Static assets
    │   ├── icons/                # SVG icons
    │   ├── images/               # Images
    │   └── fonts/                # Font files
    │
    ├── config/                   # Configuration files
    │   ├── env.js                # Environment variables
    │   ├── routes.js             # Route definitions
    │   └── theme.js              # MUI theme configuration
    │
    └── styles/                   # Global styles
        ├── globals.css           # Global CSS
        ├── variables.css         # CSS custom properties
        └── reset.css             # CSS reset

Old Structure (pre-FSD):

├── api/           # RTK Query API definitions
├── assets/        # Static assets (SVG icons, images)
├── common/        # Shared constants and utilities
├── components/    # Reusable UI components
├── ComponentsLib/ # Lower-level component library
├── context/       # React Context providers
├── hooks/         # Custom React hooks
├── pages/         # Page-level components (feature folders)
├── slices/        # Redux slices for state management
├── theme/         # Theme variants and styling utilities
└── utils/         # Pure utility functions
```

### Path Aliases

Always use `@/` alias for imports from `src/`:

```javascript
// ✅ Correct
import { VITE_SERVER_URL } from "@/common/constants";
import Button from "@/components/Button";
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

// ❌ Incorrect
import { VITE_SERVER_URL } from "../../../common/constants";
```

### Import Organization

**Consistent Import Ordering:**

1.  **React imports**: `import { memo, useCallback, useContext, useMemo } from 'react';`
2.  **External library imports**: `import { Box, IconButton, Typography } from '@mui/material';`
3.  **Internal feature imports (FSD structure)**: `import { FlowEditorContext } from '@/[fsd]/app/providers';`
4.  **Shared component imports**: `import EntityIcon from '@/components/EntityIcon';`
5.  **Asset imports**: `import StopIcon from '@/assets/stop-icon.svg?react';`
6.  **Theme/style imports**: `import { useTheme } from '@emotion/react';`

**FSD Import Path Best Practices:**

- ✅ **Always specify the layer** when importing from FSD structure:
  `@/[fsd]/features/pipelines/ai-assistant/ui`
- ✅ **Use named exports** for hooks and utilities: `export const useCustomHook = () => {}`
- ✅ **Group related imports** from the same module on one line when possible
- ❌ **Avoid barrel imports** without layer specification: `@/[fsd]/features/pipelines/ai-assistant`

```javascript
// ✅ Correct: Explicit layer imports
import { AIAssistantInput, AIPromptInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { useCodeMirror } from '@/[fsd]/shared/lib/hooks';

// ❌ Incorrect: Missing layer specification
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant';
```

The sorting of imports is also governed by the rules of prettier and eslint:

- **@trivago/prettier-plugin-sort-imports** for sorting imports
- **'import/no-unresolved': ['error', { ignore: ['.svg'] }]** for unresolved imports
- **'import/no-useless-path-segments': 'error'** for unnecessary path segments
- **'import/no-duplicates': 'error'** for duplicate imports
- **'import/no-unused-modules': 'warn'** for unused modules

```javascript
// ✅ Correct order
// 1. React imports
import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

// 2. External library imports
import { Box, IconButton, Typography } from '@mui/material';

// 3. Internal feature imports (FSD structure)
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
// 5. Asset imports
import StopIcon from '@/assets/stop-icon.svg?react';
// 4. Shared component imports
import EntityIcon from '@/components/EntityIcon';
// 6. Theme/style imports
import { useTheme } from '@emotion/react';
```

## API Integration Patterns

### RTK Query Structure

All API calls use RTK Query extending from `eliteaApi`:

```javascript
// ✅ Correct API pattern
import { eliteaApi } from './eliteaApi';

export const applicationsApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    getApplications: builder.query({
      query: ({ projectId, ...params }) => ({
        url: `/api/v2/projects/${projectId}/applications`,
        params,
      }),
      providesTags: ['Applications'],
    }),
  }),
});

export const { useGetApplicationsQuery, useLazyGetApplicationsQuery } = applicationsApi;
```

### Environment Variables

Use the centralized `getEnvVar` utility:

```javascript
// ✅ Correct
import { getEnvVar } from "@/utils/env";
const serverUrl = getEnvVar("VITE_SERVER_URL");

// ❌ Incorrect
const serverUrl = import.meta.env.VITE_SERVER_URL;
```

## Component Development Standards

### Material-UI Integration

Follow MUI's recommended customization approaches as outlined in their
[official documentation](https://mui.com/material-ui/customization/how-to-customize/). Use the established
theming patterns:

**Preferred customization methods (in order of preference):**

1. **sx prop with style functions** - For component-specific styles (PRIMARY pattern in this codebase)
2. **useTheme hook** - For accessing theme in component logic or complex calculations
3. **Theme customization** - Define component variants and overrides in the theme (used sparingly)

**Alternative patterns (found in legacy code, avoid in new code):**

- **styled() API** - For reusable styled components (prefer sx prop instead)
- **className prop with CSS modules/emotion** - When other methods aren't suitable

#### Primary Pattern: sx Prop with Style Functions

The codebase consistently uses this specific pattern for styling components:

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
  const styles = componentStyles(isSmall, leftPanelWidth);

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.contentBox}>Content</Box>
    </Box>
  );
};
```

#### Refactoring Inline Props to `sx`

A common anti-pattern to avoid is passing style-related properties directly as props to MUI components,
instead of using the `sx` prop. This practice is considered impermissible and must be refactored.

**❌ Incorrect: Using individual props for styling**

```javascript
<Box
  display={'flex'}
  flexDirection={'row'}
  alignItems={'center'}
  ref={tabsRef}
  minWidth={tabsMinWidth}
  gap={'12px'}
>
```

**✅ Correct: Consolidating styles into the `sx` prop**

All style properties must be moved into a `styles` object and applied via the `sx` prop, according to our
style function conventions.

```javascript
/** @type {MuiSx} */
const componentStyles = tabsMinWidth => ({
  tabsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: tabsMinWidth,
    gap: '0.75rem', // Converted 12px to rem
  },
});

const MyComponent = () => {
  const styles = componentStyles(tabsMinWidth);
  return (
    <Box
      sx={styles.tabsContainer}
      ref={tabsRef}
    >
      {/* ... */}
    </Box>
  );
};
```

It is **mandatory** to refactor code that uses inline style props. This is not a suggestion but a required
action to ensure consistency, maintainability, and adherence to project standards.

**Key conventions for style functions:**

- Use JSDoc comment `/** @type {MuiSx} */` above style function definitions
- Name style functions as `{componentName}Styles` (e.g., `artifactsStyles`, `runHistoryContainerStyles`)
- Accept dynamic parameters that affect styling (viewport size, state flags, etc.)
- Return an object where keys are semantic names (wrapper, container, contentBox, etc.)
- Access theme tokens via destructuring: `({ palette, spacing, breakpoints }) => ({...})`
- For static styles, use plain objects; for theme-dependent styles, use functions
- Store style functions at the bottom of the component file, before export
- **Never pass theme as parameter**: Use theme callbacks `({ palette }) => ({...})` instead of
  `(theme) => ({ color: theme.palette... })`
- **Use rem units**: Convert all pixel values to rem (e.g., `16px` → `1rem`, `1px` → `0.0625rem`)

#### Theme Access Patterns

```javascript
// ✅ Access theme in component logic
import { useTheme } from '@emotion/react';

const MyComponent = () => {
  const theme = useTheme();

  // Use theme for logic or complex calculations
  const dynamicValue = theme.palette.mode === 'dark' ? 10 : 5;

  return <Box>{/* ... */}</Box>;
};

// ✅ Access theme in sx styles via function
<Box
  sx={({ palette }) => ({
    backgroundColor: palette.background.secondary,
    border: `1px solid ${palette.border.lines}`,
  })}
>
  Content
</Box>;
```

#### Complex Selectors and Nested Styles

```javascript
// ✅ Use nested selectors for child elements
const styles = () => ({
  container: ({ palette }) => ({
    '& .gutter': {
      backgroundColor: palette.background.tabPanel,
      border: `1px solid ${palette.border.lines}`,
      '&:hover': {
        backgroundColor: palette.primary.main,
        opacity: 0.8,
      },
      '&.gutter-horizontal': {
        cursor: 'col-resize',
      },
    },
  }),
});
```

#### Responsive and Conditional Styles

```javascript
// ✅ Apply conditional styles based on props or state
const styles = (isSmall, hasPreview) => ({
  wrapper: {
    display: 'flex',
    flexDirection: isSmall ? 'column' : 'row',
    gap: '0.75rem',
    ...(isSmall
      ? {
          paddingLeft: '1.5rem',
          minHeight: '40rem',
        }
      : {}),
  },
  panel: {
    width: !hasPreview ? '100% !important' : undefined,
    display: hasPreview ? 'flex' : 'none',
  },
});

// ✅ Use theme breakpoints for responsive design
<Box
  sx={{
    px: { xs: '1rem', sm: '1.5rem' },
    width: { xs: '100%', md: '50%' },
  }}
>
  Content
</Box>;
```

#### Theme Tokens Usage

Always use theme tokens instead of hard-coded values:

```javascript
// ✅ Use theme tokens
import { BORDER_RADIUS } from '@/common/designTokens';

const styles = () => ({
  card: ({ palette, spacing }) => ({
    padding: spacing(2),                        // Use spacing function
    backgroundColor: palette.background.paper,  // Use palette
    borderRadius: BORDER_RADIUS.MD,            // Use design tokens
    border: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.primary,
  }),
});

// For consistency and accessibility, all sizing, spacing, and typography should use `rem` units.
// ❌ Avoid hard-coded values
const styles = () => ({
  card: {
    padding: '16px',              // Don't hard-code
    backgroundColor: '#ffffff',   // Don't hard-code colors
    borderRadius: '8px',         // Use design tokens instead
  },
});
```

#### Pixel to Rem Conversion Guide

**Standard Conversion Formula**: `rem = pixels / 16`

Common conversions to memorize:

```javascript
// ✅ Use rem units for all sizing and spacing
const styles = () => ({
  container: {
    // Spacing conversions
    padding: '0.5rem',      // 8px
    margin: '1rem',         // 16px
    gap: '1.5rem',          // 24px

    // Border conversions
    border: '0.0625rem solid',  // 1px
    borderRadius: '0.5rem',     // 8px

    // Size conversions
    width: '20rem',         // 320px
    height: '2.5rem',       // 40px
    minHeight: '6.25rem',   // 100px

    // Special cases
    top: 0,                 // 0 doesn't need units
    fontSize: '0.875rem',   // 14px (but prefer typography variants)
  },
});

// ❌ Avoid pixel units
const styles = () => ({
  container: {
    padding: '8px',         // Should be 0.5rem
    borderRadius: '8px',    // Should be 0.5rem
    width: '320px',         // Should be 20rem
  },
});
```

#### Constants at Component Level

For component-specific layout constants, define them at the top of the file:

```javascript
// ✅ Define layout constants at file level (see Artifacts.jsx example)
const ARTIFACTS_PANEL_WIDTHS = {
  DEFAULT_LEFT_PANEL: 300,
  LARGE_SCREEN_THRESHOLD: 1700,
  COLLAPSED_SIDEBAR_OFFSET: 380,
};

const SPLIT_LAYOUT_CONFIG = {
  MIN_SIZE: 28,
  GUTTER_SIZE: 10,
  SNAP_OFFSET: 30,
};

// Use these constants in style functions
const styles = leftPanelWidth => ({
  sidebar: {
    width: `${leftPanelWidth}px`,
    transition: 'width 0.2s ease-in-out',
  },
});
```

**Important conventions:**

- The project uses custom MUI button variant `elitea` and custom theme palettes
- Always reuse existing theme tokens instead of hard-coded colors
- Import design tokens from `@/common/designTokens` for consistent values
- Use rem units (e.g., `0.0625rem` for 1px) for better accessibility
- Follow the established pattern of defining styles outside JSX for better readability
- Use semantic naming for style keys (wrapper, container, header, content, etc.)
- Place style functions at the bottom of component files, before the default export
- Use `useTheme` hook when you need theme in component logic, not just in styles

#### Buttons

**Always use `BaseBtn` from `@/[fsd]/shared/ui/button/BaseBtn`** for all buttons. Never use raw MUI `Button`,
`IconButton`, or other MUI button primitives directly — `BaseBtn` is the project's design system button and
the only correct choice.

```javascript
// ❌ Avoid: raw MUI primitives
import { Button, IconButton } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

// ✅ Correct: always use BaseBtn
<BaseBtn
  variant={BUTTON_VARIANTS.contained}
  onClick={handleSave}
>
  Save
</BaseBtn>;
```

**Available variants (`BUTTON_VARIANTS`):**

| Variant       | Visual                 | When to use                             |
| ------------- | ---------------------- | --------------------------------------- |
| `contained`   | Filled primary color   | Primary CTA, main page action           |
| `secondary`   | Dark filled, bordered  | Secondary actions                       |
| `special`     | Gradient/accent        | Highlighted special actions             |
| `tertiary`    | Transparent, text-only | Subtle inline or text actions           |
| `alarm`       | Red filled             | Destructive actions (delete, remove)    |
| `neutral`     | Blue filled            | Neutral confirmations                   |
| `positive`    | Green filled           | Confirmatory/success actions            |
| `iconLabel`   | Pill with icon + text  | Toolbar add/action buttons with label   |
| `iconCounter` | Pill with icon + count | Badge-style counters                    |
| `auxiliary`   | Text, accent color     | Auxiliary links or navigational actions |

**Icon-only buttons** — pass `startIcon` with no `children`. `BaseBtn` auto-detects this and renders a
circular button:

```javascript
// ✅ Correct: icon-only (circular, themed)
<BaseBtn
  variant={BUTTON_VARIANTS.tertiary}
  startIcon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
  aria-label="delete item"
  onClick={handleDelete}
/>
```

**With text and icon:**

```javascript
// ✅ Correct: icon + label
<BaseBtn
  variant={BUTTON_VARIANTS.iconLabel}
  startIcon={<PlusIcon />}
  onClick={handleAdd}
>
  Add Item
</BaseBtn>
```

**When wrapping in `Tooltip` with a `disabled` button**, wrap in `<Box component="span">` so the tooltip
receives pointer events:

```javascript
<Tooltip
  title="Delete"
  placement="top"
>
  <Box component="span">
    <BaseBtn
      variant={BUTTON_VARIANTS.alarm}
      startIcon={<DeleteIcon />}
      disabled={isLoading}
    >
      Delete
    </BaseBtn>
  </Box>
</Tooltip>
```

#### SVG Icon Styling

**Never pass MUI's `sx` prop directly to custom SVG icon components.** The `sx` prop is MUI-specific and
causes React warnings when spread onto native `<svg>` elements.

```javascript
// ❌ Incorrect: Passing `sx` directly to SVG component
<ArrowLeftIcon sx={styles.iconStyle} />
<MyCustomIcon sx={{ color: 'red' }} />

// ✅ Correct: Wrap SVG in Box with `component` prop
<Box
  component={ArrowLeftIcon}
  sx={styles.iconStyle}
/>

// ✅ Correct: Use `style` prop for native SVGs
<ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />

// ✅ Correct: Pass specific props the SVG supports
<ArrowLeftIcon fill={theme.palette.icon.fill.default} width={16} height={16} />
```

**Note:** MUI's built-in icons (from `@mui/icons-material`) DO support `sx` because they are wrapped in
`SvgIcon`. Custom SVG components in `/components/Icons/` or imported via `?react` do NOT support `sx` unless
wrapped.

For SVG files imported with Vite's `?react` suffix:

```javascript
import FileUploadIcon from '@/assets/icons/FileUploadIcon.svg?react';

// ❌ Wrong - causes warning
<FileUploadIcon sx={styles.icon} />

// ✅ Correct - wrap in Box
<Box component={FileUploadIcon} sx={styles.icon} />
```

### Component Creation Checklist

- [ ] Wrap component in `React.memo()`.
- [ ] Set a `displayName` for the component.
- [ ] Destructure `props` inside the component body, not in the function signature.
- [ ] Use `useMemo` for expensive computations or derived data.
- [ ] Use `useCallback` for all event handlers passed to child components.
- [ ] Follow the standard import organization.
- [ ] Extract inline styles into a style function at the bottom of the file.
- [ ] Use `/** @type {MuiSx} */` JSDoc annotation for style functions.
- [ ] Convert pixel values to rem units for better accessibility.
- [ ] Use theme callbacks instead of passing theme as parameter.

### Custom Components

Reuse existing component patterns from `/components` and follow MUI's customization guidelines:

```javascript
// ✅ Use existing Button with variants
import { Paper } from '@mui/material';
// ✅ Create new styled components following MUI patterns
import { styled } from '@mui/material/styles';

import Button from '@/components/Button';
// ✅ Use existing styled components
import { StyledDialog } from '@/components/StyledDialog';

<Button
  color="primary"
  variant="contained"
>
  Save Changes
</Button>;

const CustomCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.default,
  // Use theme tokens, not hard-coded values
}));

// ✅ Extend existing MUI components with theme variants
const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'gradient' },
          style: {
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
          },
        },
      ],
    },
  },
});
```

### Native HTML vs MUI Components

During refactoring replace raw HTML tags (div, span, p, h1–h6, button, input, label, etc.) with MUI
components:

- div / span → Box (or Typography component="span" for inline text cases)
- p / h1–h6 → Typography (using variant)
- button → MUI Button
- input / textarea → TextField (or a specialized component from the existing UI library)
- label → FormLabel / InputLabel
- ul / ol / li → Box with list-style via sx (or MUI List / ListItem if list semantics needed)
- form → Box component="form"

Rules:

1. If you need only a container without semantic meaning → use Box.
2. If you need a text element → use Typography with proper variant and component.
3. If a component is already wrapped in a custom UI (e.g. ApplicationCard) do not replace its internal public
   API without a separate task.

Exceptions (may keep native tag):

- Semantic elements affecting accessibility (nav, main, header, footer, section, article) — optionally Box
  component="nav".
- Table structures (table, tr, td) — when MUI Table is not suitable for performance.
- Inline SVG.

Before replacing check:

- Existing CSS child selectors are not broken (replacement may change specificity).
- Playwright tests using data-testid are not broken (preserve attributes).

Goals:

- Unified styling via sx.
- Theme consistency (palette, typography, spacing).
- Reduce DOM heterogeneity.

### Component File Structure

Always prefer **functional components** wrapped with `React.memo` for performance. Every component should have
a `displayName` for better debugging.

**Props handling conventions:**

- Accept `props` as a single parameter to the component function.
- Destructure props on the first line inside the component body, with default values where applicable.
- This pattern provides better readability and makes it easier to track prop usage.

```javascript
// ✅ Correct component structure
import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

const MyComponent = memo(props => {
  const { title, onAction, isEnabled = false } = props;

  const handleAction = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const computedValue = useMemo(() => {
    // perform expensive calculation
    return title.toUpperCase();
  }, [title]);

  return <Box onClick={handleAction}>{computedValue}</Box>;
});

MyComponent.displayName = 'MyComponent';

export default MyComponent;
```

```javascript
// ❌ Avoid - destructuring in function signature
const MyComponent = memo(({ title, onAction, isEnabled }) => {
  // ... component logic
});
```

## State Management Patterns

### Redux Slices

Follow the established slice pattern:

```javascript
// ✅ Standard slice structure
import { createSlice } from '@reduxjs/toolkit';

const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { name, actions } = myFeatureSlice;
export default myFeatureSlice.reducer;
```

### Custom Hooks for Logic

Extract reusable logic into custom hooks:

```javascript
// ✅ Custom hook pattern
export const usePageQuery = projectId => {
  const dispatch = useDispatch();
  const { pageSize } = useSelector(state => state.settings);

  const [searchParams, setSearchParams] = useSearchParams();

  return useMemo(
    () => ({
      page: parseInt(searchParams.get('page') || '1'),
      pageSize,
      // ... other query logic
    }),
    [searchParams, pageSize],
  );
};
```

## Constants and Configuration

### Constants Organization

Store all constants in `/common/constants.js`:

```javascript
// ✅ Organized constants
export const UI_CONSTANTS = {
  SIDE_BAR_WIDTH: 216,
  NAV_BAR_HEIGHT: 60,
  RIGHT_PANEL_WIDTH: 328,
};

export const API_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_TOKENS: 1024,
  DEFAULT_TEMPERATURE: 0.2,
};

export const PERMISSION_GROUPS = {
  READ: 'READ',
  WRITE: 'WRITE',
  ADMIN: 'ADMIN',
};
```

### Feature Flags and Environment

```javascript
// ✅ Environment-based configuration
export const FEATURE_FLAGS = {
  USE_DATASOURCE_MODERATION: getEnvVar('VITE_USE_DATASOURCE_MODERATION') === 'true',
  USE_AGENT_MODERATION: getEnvVar('VITE_USE_AGENT_MODERATION') === 'true',
};
```

## Custom Hooks Best Practices

### Hook Naming and Structure

- Always prefix with `use`.
- **Always use named exports** (`export const useMyHook`) instead of default exports for better tree-shaking
  and consistency.
- Group related hooks in appropriate directories. Shared hooks should be placed in
  `src/[fsd]/shared/lib/hooks/`.
- Extract complex or reusable logic from components into custom hooks.
- File naming: Use `.hooks.js` suffix for hook files (e.g., `useCodeMirror.hooks.js`)

```javascript
// ✅ Well-structured custom hook
// Located in: src/[fsd]/shared/lib/hooks/useSelectedProjectId.hooks.js

export const useSelectedProjectId = () => {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    // Logic to determine project ID from route
    return extractProjectIdFromPath(location.pathname, params);
  }, [location.pathname, params]);
};
```

### Hook Organization in Shared Layer

**Correct Structure:**

```
src/[fsd]/shared/lib/hooks/
├── useCodeMirror.hooks.js       # Editor-related hook
├── useTextOverflow.hooks.js     # UI utility hook
├── useDebounce.hooks.js         # Performance hook
└── index.js                     # Barrel export
```

**Export Pattern:**

```javascript
// index.js - Barrel export for hooks
export { useCodeMirror } from './useCodeMirror.hooks';
export { useTextOverflow } from './useTextOverflow.hooks';
export { useDebounce } from './useDebounce.hooks';
```

## Error Handling and Loading States

### Consistent Error Patterns

```javascript
// ✅ Standard error handling
const { data, error, isLoading } = useGetApplicationsQuery({ projectId });

if (isLoading) return <LoadingIndicator />;
if (error) return <ErrorMessage error={error} />;

return <ApplicationsList data={data} />;
```

### Toast Notifications

Use the existing toast system:

```javascript
// ✅ Use existing toast hook
import useToast from '@/hooks/useToast';

const { toastSuccess, toastError } = useToast();

const handleSave = async () => {
  try {
    await saveData();
    toastSuccess('Data saved successfully');
  } catch (error) {
    toastError('Failed to save data');
  }
};
```

## Testing Standards

### Page Object Pattern

Follow the established Playwright testing pattern:

```javascript
// tests/page_object/BasePage.js pattern
export class FeaturePage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.locator('[data-testid="save-button"]');
  }

  async clickSave() {
    await this.saveButton.click();
  }
}
```

### Test Data Attributes

Use `data-testid` for test selectors:

```jsx
// ✅ Add test identifiers
<Button
  data-testid="submit-button"
  onClick={handleSubmit}
>
  Submit
</Button>
```

## Performance Optimization

### Memoization Guidelines

- Use `useMemo` for expensive calculations and derived data.
- Use `useCallback` for event handlers passed as props to child components.
- Use `React.memo` on components to prevent re-renders when props have not changed.
- **Always add a `displayName` to memoized components for better debugging.**
- Apply `memo` at definition time. If using `forwardRef`, wrap with `memo` at export.
- Avoid inline `memo(forwardRef(...))` as it harms readability.

```javascript
// ✅ Proper memoization with derived data and stable callbacks
const MyComponent = memo(props => {
  const { id, data, onSelect } = props;

  // Memoize complex data transformations
  const options = useMemo(
    () =>
      (data?.details?.tools || []).map(tool => ({
        label: tool.name,
        value: tool.id,
      })) || [],
    [data?.details?.tools],
  );

  const handleSelect = useCallback(item => onSelect(item.id), [onSelect]);

  return (
    <Select
      options={options}
      onSelect={handleSelect}
    />
  );
});

MyComponent.displayName = 'MyComponent';
export default MyComponent;
```

```javascript
// ✅ With forwardRef then memo (export-time wrap acceptable)
const MyComponentWithRef = forwardRef((props, ref) => {
  const { title } = props;
  return <Box ref={ref}>{title}</Box>;
});
MyComponentWithRef.displayName = 'MyComponentWithRef';
export default memo(MyComponentWithRef);
```

```javascript
// ❌ Avoid: memo wrapping inline forwardRef
const MyComponent = memo(
  forwardRef((props, ref) => {
    const { title } = props;
    return <Box ref={ref}>{title}</Box>;
  }),
);
```

## Security and Best Practices

### Authentication Patterns

Follow the existing auth flow:

```javascript
// ✅ Use established auth hooks
const { user, isAuthenticated } = useSelector(state => state.user);
const { data: permissions } = useLazyPermissionListQuery();
```

### Input Validation

Use Formik with Yup validation:

```javascript
// ✅ Standard form validation
import { Formik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});
```

## Accessibility Standards

### ARIA Labels and Roles

```jsx
// ✅ Accessible components
<Button
  aria-label="Delete application"
  aria-describedby="delete-help-text"
  onClick={handleDelete}
>
  <DeleteIcon />
</Button>
<div id="delete-help-text" className="sr-only">
  This action cannot be undone
</div>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible and follow focus management patterns.

## Code Quality Standards

### ESLint Configuration

The project uses ESLint with a comprehensive set of rules defined in `eslint.config.js`. Follow these
established standards:

#### Configuration Overview

- **Parser**: Babel ESLint parser with React preset for JSX support
- **Target**: ES2021+ with modern module syntax
- **Plugins**: React, React Hooks, React Refresh, Import

#### Ignored Directories

The following directories are excluded from linting:

- `node_modules/`, `dist/`, `build/`, `coverage/`
- `tests/` (test files have separate conventions)
- `.vscode/`, `.github/`, `.storybook/`
- Minified and bundled files (`*.min.js`, `*.bundle.js`)

#### React Rules (Enforced)

```javascript
// ✅ React best practices
'react/jsx-uses-react': 'error',           // Prevent React from being marked as unused
'react/jsx-uses-vars': 'error',            // Prevent variables used in JSX from being marked as unused
'react/prop-types': 'off',                 // PropTypes validation is optional (use when needed)
'react-hooks/exhaustive-deps': 'error',    // Enforce proper dependency arrays in hooks
'react/jsx-pascal-case': 'error',          // Enforce PascalCase for component names
'react/jsx-no-undef': 'error',             // Disallow undeclared variables in JSX
'react/jsx-no-bind': 'off',                // Allow .bind() and arrow functions in JSX (disabled for flexibility)
'react-refresh/only-export-components': 'off', // React Refresh rules (currently disabled)

// ❌ Disabled rules
'react/jsx-no-target-blank': 'off',        // Allow target="_blank" without rel="noopener noreferrer"
```

**Common violations to avoid:**

```javascript
// ❌ Missing React in scope (pre-React 17)
function MyComponent() {
  return <div>Hello</div>;
}

// ✅ Correct (React 17+ with new JSX transform)
function MyComponent() {
  return <div>Hello</div>;
}

// ❌ Unused variable in JSX
const MyComponent = () => {
  const unusedVar = 'test'; // ESLint error
  return <div>Hello</div>;
};

// ✅ Use all declared variables
const MyComponent = () => {
  const message = 'test';
  return <div>{message}</div>;
};

// ❌ Missing dependency in useEffect
useEffect(() => {
  fetchData(userId);
}, []); // ESLint error: userId should be in dependency array

// ✅ Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ❌ Component name not in PascalCase
const myComponent = () => <div>Hello</div>;

// ✅ PascalCase component name
const MyComponent = () => <div>Hello</div>;
```

#### Import Rules (Enforced)

```javascript
'import/no-unresolved': ['error', { ignore: ['.svg'] }],  // Ensure imports resolve (except SVG)
'import/no-useless-path-segments': 'error',               // Disallow unnecessary path segments
'import/no-duplicates': 'error',                          // Merge duplicate imports
'import/no-unused-modules': 'warn',                       // Warn about unused exports
```

**Path alias configuration:**

- `@/` alias resolves to `./src`
- Supported extensions: `.ts`, `.js`, `.jsx`, `.json`, `.svg`

```javascript
// ❌ Useless path segments
import Button from '@/components/../components/Button';

// ✅ Clean import path
import Button from '@/components/Button';

// ❌ Duplicate imports
import { Box } from '@mui/material';
import { Typography } from '@mui/material';

// ✅ Merged imports
import { Box, Typography } from '@mui/material';

// ✅ SVG imports are allowed (ignored by resolver)
import Logo from '@/assets/logo.svg';
```

#### Code Quality Rules (Enforced)

```javascript
// Variable declarations
'no-unused-vars': 'error',              // No unused variables
'no-var': 'error',                      // Use let/const instead of var
'prefer-const': 'error',                // Use const when variable is not reassigned
'no-shadow': 'error',                   // Disallow variable shadowing
'vars-on-top': 'error',                 // Require var declarations at top of scope

// Code cleanliness
'no-console': 'error',                  // No console statements in production code
'no-undef': 'error',                    // Disallow undeclared variables
'object-shorthand': 'error',            // Require object literal shorthand
'prefer-arrow-callback': 'error',       // Prefer arrow functions as callbacks

// Warnings
'no-constant-binary-expression': 'warn', // Warn about expressions that always evaluate the same
```

**Common violations to avoid:**

```javascript
// ❌ Unused variable
const unusedVar = 'test';
const result = doSomething();

// ✅ Remove or use all variables
const result = doSomething();
console.log(result); // Only if truly needed for debugging

// ❌ Using var
var count = 0;

// ✅ Use let or const
let count = 0;
const MAX_COUNT = 100;

// ❌ Not using const when possible
let apiUrl = 'https://api.example.com'; // Never reassigned

// ✅ Use const
const apiUrl = 'https://api.example.com';

// ❌ Variable shadowing
const name = 'John';
function greet() {
  const name = 'Jane'; // Shadows outer 'name'
  console.log(name);
}

// ✅ Use different variable names
const userName = 'John';
function greet() {
  const guestName = 'Jane';
  console.log(guestName);
}

// ❌ Console statements
console.log('Debug info');
console.error('Error occurred');

// ✅ Remove console or use proper logging utility
// For debugging: use browser DevTools or a logging library
// Remove before committing

// ❌ Verbose object literals
const user = {
  name: name,
  age: age,
  email: email,
};

// ✅ Object shorthand
const user = {
  name,
  age,
  email,
};

// ❌ Function expressions
setTimeout(function() {
  doSomething();
}, 1000);

// ✅ Arrow functions
setTimeout(() => {
  doSomething();
}, 1000);

// ❌ Undefined variable
function calculate() {
  return result * 2; // 'result' is not defined
}

// ✅ Define all variables
function calculate(result) {
  return result * 2;
}
```

#### Global Variables Available

The following globals are pre-configured and don't need to be declared:

**Browser globals:**

- `window`, `document`, `console`, `navigator`
- `localStorage`, `sessionStorage`, `fetch`
- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`
- `alert`, `location`, `history`, `open`

**ES2021+ globals:**

- `Promise`, `Set`, `Map`, `WeakSet`, `WeakMap`
- `Symbol`, `BigInt`, `Proxy`, `Reflect`

**Web APIs:**

- `FileReader`, `URL`, `FormData`, `URLSearchParams`, `Blob`
- `ResizeObserver`, `IntersectionObserver`, `MutationObserver`
- `Headers`, `Image`, `XMLSerializer`, `File`

**Custom globals:**

- `styled` (Emotion styled-components)

#### Running ESLint

```bash
# Lint all files
npm run lint

# Auto-fix fixable issues
npm run lint -- --fix

# Lint specific files
npm run lint -- src/components/Button.jsx

# Lint and report unused modules
npm run lint -- --report-unused-disable-directives
```

#### Pre-commit Checklist

Before committing, ensure:

- [ ] No ESLint errors (run `npm run lint`)
- [ ] No unused variables or imports
- [ ] All `console.log` statements removed
- [ ] Proper dependency arrays in React hooks
- [ ] All imports use `@/` alias for `src/` paths
- [ ] No duplicate imports
- [ ] Component names in PascalCase
- [ ] Using `const` instead of `let` where possible

#### Disabling ESLint Rules (Use Sparingly)

Only disable rules when absolutely necessary and document why:

```javascript
// ✅ Acceptable: Known issue with external library
// eslint-disable-next-line import/no-unresolved
import SpecialComponent from 'legacy-lib';

// ✅ Acceptable: Temporary console for debugging (remove before commit)
// eslint-disable-next-line no-console
console.log('Debug:', data);

// ❌ Avoid: Disabling rules to bypass errors
// eslint-disable-next-line no-unused-vars
const unused = 'This is bad practice';

// ✅ Better: Fix the issue instead
// Remove the unused variable
```

**Rules for disabling ESLint:**

1. Use `eslint-disable-next-line` for single-line exceptions
2. Use `eslint-disable` and `eslint-enable` blocks for multi-line exceptions
3. Always add a comment explaining why the rule is disabled
4. Prefer fixing the code over disabling rules
5. Never disable rules globally without team discussion

### Conditional Rendering Patterns

**Avoid nested or chained ternary operators** - they harm readability and maintainability.

#### Multiple Conditions (3+)

When you have 3 or more conditional branches, use one of these patterns instead of chained ternaries:

**Pattern 1: Enum + useMemo + switch statement (Preferred for complex UI states)**

```javascript
// ✅ Preferred: Use enums and switch for 3+ conditions
const BUCKET_TYPES = {
  DATA: 'data',
  FILTERED_EMPTY: 'filtered_empty',
  EMPTY: 'empty',
};

const bucketsTypes = useMemo(() => {
  if (filteredBuckets.length > 0) return BUCKET_TYPES.DATA;
  if (searchQuery && !filteredBuckets.length && buckets.length > 0) return BUCKET_TYPES.FILTERED_EMPTY;
  if (!isLoadingBuckets && buckets.length === 0 && !isError) return BUCKET_TYPES.EMPTY;
  return null; // default case
}, [isLoadingBuckets, filteredBuckets.length, searchQuery, buckets.length, isError]);

// Render using switch statement
{
  !isLoadingBuckets && (
    <Box sx={styles.container}>
      {(() => {
        switch (bucketsTypes) {
          case BUCKET_TYPES.DATA:
            return <DataView data={filteredBuckets} />;

          case BUCKET_TYPES.FILTERED_EMPTY:
            return (
              <EmptyState
                title="No results found"
                message="Try adjusting your search terms"
              />
            );

          case BUCKET_TYPES.EMPTY:
            return (
              <EmptyState
                title="No items yet"
                message="Create your first item to get started"
              />
            );

          default:
            return null;
        }
      })()}
    </Box>
  );
}

// ❌ Avoid: Chained ternary operators (hard to read)
{
  !isLoadingBuckets &&
    (filteredBuckets.length > 0 ? (
      <DataView data={filteredBuckets} />
    ) : searchQuery && buckets.length > 0 ? (
      <EmptyState title="No results found" />
    ) : buckets.length === 0 ? (
      <EmptyState title="No items yet" />
    ) : null);
}
```

**Pattern 2: Object lookup (For simple value mappings)**

```javascript
// ✅ Good: Object lookup for simple mappings
const STATUS_MESSAGES = {
  idle: 'Ready to start',
  loading: 'Processing...',
  success: 'Completed successfully',
  error: 'An error occurred',
};

const message = STATUS_MESSAGES[status] || 'Unknown status';

// ❌ Avoid: Multiple ternaries for simple lookups
const message =
  status === 'idle' ? 'Ready to start' :
  status === 'loading' ? 'Processing...' :
  status === 'success' ? 'Completed successfully' :
  status === 'error' ? 'An error occurred' :
  'Unknown status';
```

**Pattern 3: Early returns in render functions (For component logic)**

```javascript
// ✅ Good: Early returns for clarity
const renderContent = () => {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;

  return <DataList items={data} />;
};

return <Box>{renderContent()}</Box>;

// ❌ Avoid: Nested ternaries
return (
  <Box>
    {isLoading ? (
      <LoadingSpinner />
    ) : error ? (
      <ErrorMessage error={error} />
    ) : !data?.length ? (
      <EmptyState />
    ) : (
      <DataList items={data} />
    )}
  </Box>
);
```

#### Simple Conditions (2 or less)

For 1-2 conditions, simple ternaries or `&&` operators are acceptable:

```javascript
// ✅ Acceptable: Single condition
{
  isLoading && <LoadingSpinner />;
}
{
  error && <ErrorMessage error={error} />;
}

// ✅ Acceptable: Two-branch ternary
{
  hasData ? <DataView /> : <EmptyState />;
}

// ✅ Acceptable: Two conditions with logical operators
{
  !isLoading && !error && <DataView />;
}
```

#### Guidelines for Refactoring

**When to refactor:**

- 3 or more conditional branches
- Nested ternary operators (any depth)
- Conditions that are hard to understand at a glance
- Repeated conditional logic across components

**How to choose a pattern:**

1. **Complex UI states with dependencies** → Enum + useMemo + switch
2. **Simple value mappings** → Object lookup
3. **Component-level logic** → Early returns in helper functions
4. **Loading/error/data states** → Early returns pattern

**Benefits of these patterns:**

- Easier to read and understand
- Simpler to add new conditions
- Better for testing and debugging
- Follows single responsibility principle
- Enables proper type safety (when using TypeScript)

### Code Cleanup

- Remove all `console.log` statements before committing (except in debugging utilities)
- Clean up commented code
- Ensure all imports are used
- Follow the established naming conventions
- Write modern ECMAScript modules with `import`/`export` syntax
- Name React components and files using **PascalCase** (e.g. `AddItemButton.jsx`)
- Use **single quotes** for strings and include **semicolons**
- Use `prefer-const`, and eliminate unused variables to satisfy ESLint rules
- Use arrow functions or `forwardRef` only when necessary and avoid inline lambdas in JSX when possible

## Quick Reference - Common Patterns

### Component Boilerplate

```javascript
import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

const MyComponent = memo(props => {
  const { title, onAction, isEnabled = false } = props;
  const styles = myComponentStyles();

  const handleAction = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const computedValue = useMemo(() => {
    return title.toUpperCase();
  }, [title]);

  return (
    <Box sx={styles.container}>
      <Typography>{computedValue}</Typography>
    </Box>
  );
});

MyComponent.displayName = 'MyComponent';

/** @type {MuiSx} */
const myComponentStyles = () => ({
  container: ({ palette, spacing }) => ({
    padding: spacing(2),
    backgroundColor: palette.background.paper,
  }),
});

export default MyComponent;
```

### Custom Hook Boilerplate

```javascript
// src/[fsd]/shared/lib/hooks/useMyHook.hooks.js
import { useMemo } from 'react';

export const useMyHook = (param1, param2) => {
  const result = useMemo(() => {
    // Hook logic
    return processData(param1, param2);
  }, [param1, param2]);

  return result;
};
```

### FSD Import Examples

```javascript
// ✅ Correct: Explicit layer imports
import { MyFeature } from '@/[fsd]/features/my-domain/ui';
import { myHelper } from '@/[fsd]/features/my-domain/lib';
import { useMyHook } from '@/[fsd]/shared/lib/hooks';

// ❌ Incorrect: Missing layer specification
import { MyFeature } from '@/[fsd]/features/my-domain';
```

### Pixel to Rem Quick Reference

```javascript
// Common conversions
1px   → 0.0625rem
8px   → 0.5rem
16px  → 1rem
24px  → 1.5rem
32px  → 2rem
40px  → 2.5rem
100px → 6.25rem
```

## Development Workflow

### Local Development

- Use `npm run dev -- --mode dev` for development server
- Use `npm run test:dev` for test development
- Use `npm run lint` to check code quality
- End-to-end tests use Playwright - run `npm test` (executes tests in `tests/` folder) before committing

### Environment Setup

- Development uses Vite proxy configuration
- Authentication can be disabled with `SKIP_AUTH=true` in test environments
- Environment variables are loaded via Vite and prefixed with `VITE_`
- Environment variables managed through `getEnvVar` utility

### Before Committing

1. **Run linter**: `npm run lint` - Fix all ESLint errors
2. **Check for console.log**: Remove all debug console statements
3. **Verify imports**: Ensure all imports use `@/` alias and explicit layer paths
4. **Check styling**: Ensure rem units used and theme callbacks applied
5. **Test changes**: Run relevant tests to ensure no regressions

Remember: Always analyze existing patterns before implementing new features. This codebase has established
conventions that should be followed consistently.
