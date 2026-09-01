# CLAUDE.md — EliteaUI

## Project Overview

EliteaUI is the React frontend for the Elitea AI platform. It provides a web interface for managing AI agents,
prompts, datasources, pipelines, and toolkits.

**Stack:** React 18 · Vite 6 · Redux Toolkit · MUI 7 · Emotion · JavaScript (no TypeScript)

## Quick Start

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run lint       # eslint
npm run format     # prettier
npm run test       # playwright e2e tests
```

## Architecture: Feature-Sliced Design Migration

The project is **actively migrating** from a flat structure (`src/`) to Feature-Sliced Design (`src/[fsd]/`).

### Golden Rule

> **Never create new files in the old structure.** All new code goes into `src/[fsd]/`. The old `src/`
> directories (`components/`, `pages/`, `hooks/`, `api/`, `slices/`, `common/`, `utils/`) are legacy. They
> will be emptied and removed once migration completes.

Importing FROM legacy code into FSD code is acceptable during migration (e.g., `@/api/eliteaApi`,
`@/hooks/useSelectedProject`). Creating new files IN legacy directories is not.

### FSD Layers (top → bottom, strict import direction)

```
src/[fsd]/
  app/        → application shell: layout, providers, routes
  pages/      → thin page wrappers that compose widgets/features
  widgets/    → self-contained composite UI blocks (peers with features)
  features/   → business feature modules — largest layer (peers with widgets)
  entities/   → domain entity components and logic
  shared/     → reusable UI kit, hooks, helpers, constants, config, store
  stories/    → Storybook stories (non-standard layer, collocated)
```

**Import rule:** a layer may only import from layers below it. `features/` and `widgets/` are **peers** — they
may import from each other. Features are large business modules; widgets are smaller self-contained UI blocks.
Neither may import from `pages/` or `app/`.

**Redux store** lives in `shared/config/store.js` — accessible from any layer.

### Slice Internal Structure

```
<slice-name>/
  api/                → RTK Query endpoint definitions
  lib/
    constants/        → domain constants (UPPER_SNAKE_CASE objects)
    helpers/          → pure functions
    hooks/            → custom React hooks
    utils/            → utility functions
    serialize/        → data transformation
    validation/       → validation schemas
    context/          → React contexts
  model/              → Redux slices
  ui/                 → React components
  index.js            → public API barrel
```

Not every slice needs every segment — include only what is needed.

## Code Style Guide

### Components

**One file = one component.** Never define multiple components in a single file. Extract each component into
its own `.jsx` file.

Always use `memo` wrapping with arrow function. Destructure props inside the body, not in the parameter list.
Always set `displayName`. Use `default` export for components.

```jsx
import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

const MyComponent = memo(props => {
  const { title, items = [], onSelect, sx = {} } = props;

  const handleClick = useCallback(
    item => {
      onSelect?.(item);
    },
    [onSelect],
  );

  const styles = myComponentStyles();

  return (
    <Box sx={[styles.root, sx]}>
      <Typography variant="bodyMedium">{title}</Typography>
      {items.map(item => (
        <Box
          key={item.id}
          sx={styles.item}
          onClick={() => handleClick(item)}
        >
          {item.name}
        </Box>
      ))}
    </Box>
  );
});

MyComponent.displayName = 'MyComponent';

/** @type {MuiSx} */
const myComponentStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  item: ({ palette }) => ({
    padding: '0.75rem',
    color: palette.text.secondary,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
});

export default MyComponent;
```

When `forwardRef` is needed, nest it inside `memo`:

```jsx
const MyInput = memo(
  forwardRef((props, ref) => {
    const { label, ...restProps } = props;
    return (
      <Input.InputBase
        ref={ref}
        label={label}
        {...restProps}
      />
    );
  }),
);
MyInput.displayName = 'MyInput';
```

### Styling

**Use the style-function pattern with MUI `sx` prop. No `makeStyles`, no `useStyles`, no `styled()`, no CSS
modules, no separate CSS files.**

Rules:

- Define a style function **below the component**, after `displayName`
- Name it `camelCaseComponentNameStyles` (e.g., `myComponentStyles`)
- Annotate with `/** @type {MuiSx} */`
- Return an object of named style keys
- Use `({ palette }) =>` for theme-dependent styles
- Use `rem` units everywhere (use `0.0625rem` for 1px)
- **NEVER hardcode colors** — always use palette colors from the theme (e.g., `palette.text.primary`, not
  `rgba(104, 108, 118, 1)` or `#686C76`)
- Merge external `sx` with array syntax: `sx={[styles.root, sx]}`
- Style functions can accept parameters for conditional styles

```jsx
/** @type {MuiSx} */
const cardStyles = (isActive, isCompact) => ({
  root: ({ palette }) => ({
    padding: isCompact ? '0.5rem' : '1rem',
    backgroundColor: isActive ? palette.background.tabButton.active : palette.background.default,
  }),
});
```

### Shared UI Components — Always Prefer Shared Over Legacy

**Always use shared FSD components from `@/[fsd]/shared/ui` instead of legacy or direct MUI imports:**

| Instead of                      | Use                                                                      |
| ------------------------------- | ------------------------------------------------------------------------ |
| `<StyledDialog>` (legacy)       | `<Modal.BaseModal>` with `ModalConstants.MODAL_VARIANT`                  |
| `<IconButton>` (MUI)            | `<Button.BaseBtn>` with `BUTTON_VARIANTS.tertiary` for icon-only         |
| `<TextField>` (MUI)             | `<Input.InputBase>` with `INPUT_VARIANTS`                                |
| `<MuiButton>` (MUI)             | `<Button.BaseBtn>` with `BUTTON_VARIANTS.elitea` and `BUTTON_COLORS`     |
| `<ConfirmationDialog>` (legacy) | `<Modal.BaseModal>` with `variant={ModalConstants.MODAL_VARIANT.simple}` |

Import shared components and constants:

```jsx
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';
```

### MUI Components — Always Prefer MUI Over Raw HTML

**Never use raw HTML elements when an MUI equivalent exists:**

| Instead of  | Use                                                  |
| ----------- | ---------------------------------------------------- |
| `<div>`     | `<Box>`                                              |
| `<span>`    | `<Box component="span">` or `<Typography>`           |
| `<p>`       | `<Typography>`                                       |
| `<button>`  | `<Button.BaseBtn>` (from `@/[fsd]/shared/ui/button`) |
| `<input>`   | `<Input.InputBase>` (from `@/[fsd]/shared/ui/input`) |
| `<select>`  | MUI `<Select>`                                       |
| `<ul>/<li>` | MUI `<List>/<ListItem>`                              |
| `<a>`       | React Router `<Link>` or MUI `<Link>`                |
| `<table>`   | MUI X `<DataGrid>`                                   |

Custom Typography variants used in the project: `'bodyMedium'`, `'bodySmall'`, `'bodySmall2'`,
`'headingSmall'`, `'labelMedium'`, `'labelSmall'`.

Access theme in components via `useTheme()` from `@mui/material`. In `sx` functions, destructure `palette`
directly: `({ palette }) => ({...})`.

### Hooks

- File naming: `use<Name>.hooks.js`
- Use named exports (not default)
- Wrap callbacks with `useCallback` and provide explicit dependency arrays
- Wrap computed values with `useMemo`

```js
export const useMyFeature = (initialValue = null) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback(newValue => {
    setValue(newValue);
  }, []);

  return { value, handleChange };
};
```

### Constants

- File naming: `<name>.constants.js`
- Use `UPPER_SNAKE_CASE` for constant object names
- Use named exports
- **Local-only constants** (used within a single file) — define at the top of that file, no need to move to
  `lib/constants/`
- **Shared constants** (exported and used by multiple files) — move to `lib/constants/` in the appropriate
  slice

```js
// Local constant — stays in the component file
const MAX_VISIBLE_ITEMS = 5;

// Shared constant — lives in lib/constants/<name>.constants.js
export const STATUS_OPTIONS = {
  active: 'active',
  archived: 'archived',
  draft: 'draft',
};
```

**Importing shared constants** — import the namespace from the shared barrel, then destructure:

```js
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';

// Inside component or function:
const { ParticipantEntityTypes } = ParticipantEntityConstants;
```

### Helpers

- File naming: `<name>.helpers.js`
- Pure functions, named exports
- No side effects

### API Layer (RTK Query)

- File naming: `<name>Api.js`
- Use `eliteaApi.injectEndpoints()` pattern
- Define tag types for cache invalidation
- Use `transformResponse` for data shaping via serialize functions

### Redux Slices

- File naming: `<name>.slice.js`
- Export selectors as named functions: `export const selectSomething = state => state.sliceName.field;`
- Export both `{ name, actions }` and `default` reducer

### Barrel Files (index.js)

Every public-facing folder gets a barrel file. Patterns:

```js
// UI components — named re-export of defaults
export { default as MyComponent } from './MyComponent';

// Hooks/helpers — wildcard re-export
export * from './useMyHook.hooks';

// Grouped namespace re-export (shared/ui, shared/lib/constants)
export * as Button from './button';
export * as ModalConstants from './modal.constants';
```

## File Naming Conventions

| Category              | Convention               | Example                           |
| --------------------- | ------------------------ | --------------------------------- |
| Component files       | `PascalCase.jsx`         | `AgentCard.jsx`                   |
| Hook files            | `camelCase.hooks.js`     | `useModal.hooks.js`               |
| Helper files          | `camelCase.helpers.js`   | `notification.helpers.js`         |
| Constant files        | `camelCase.constants.js` | `llmSettings.constants.js`        |
| Redux slice files     | `camelCase.slice.js`     | `importWizard.slice.js`           |
| API files             | `camelCaseApi.js`        | `runHistoryApi.js`                |
| Serialize files       | `camelCase.serialize.js` | `runHistory.serialize.js`         |
| Test files            | `<name>.test.js(x)`      | `budgetWarning.constants.test.js` |
| Story files           | `PascalCase.stories.jsx` | `BaseBtn.stories.jsx`             |
| Barrel files          | `index.js`               | always `index.js`                 |
| FSD slice directories | `kebab-case`             | `agent-hub/`, `grid-table/`       |

## Import Ordering

Prettier auto-sorts imports in this order (with blank lines between groups):

1. `react` imports
2. Third-party libraries (redux, react-router, date-fns, etc.)
3. `@unleash/` imports
4. `@mui/` imports
5. `@/` aliased project imports (FSD and legacy)
6. Relative imports (`./`, `../`)

The `@` alias maps to `src/`. FSD imports use `@/[fsd]/...`.

## Testing

**Unit tests:** Vitest + React Testing Library

- Tests must live in a `__tests__/` folder co-located with the code they test (e.g.,
  `ui/__tests__/MyComponent.test.jsx`, `lib/helpers/__tests__/myHelper.helpers.test.js`)
- Never place test files alongside source files — always inside `__tests__/`

```jsx
import { describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
```

- Use `data-testid` attributes for element selection
- Wrap components in `ThemeProvider` for rendering
- Use `vi.mock()` for module mocking
- `beforeEach(() => vi.clearAllMocks())`, `afterEach(() => cleanup())`

**E2E tests:** Playwright — tests in `tests/` directory.

**Storybook:** stories live in `src/[fsd]/stories/shared/` using CSF format.

## Formatting

Configured in `.prettierrc`:

- 110 char line width
- 2-space indent
- Single quotes
- Trailing commas
- No parens on single-arg arrow functions (`arrowParens: "avoid"`)
- Import sorting via `@trivago/prettier-plugin-sort-imports`

## Key Conventions Checklist

- [ ] One file = one component (never multiple components in a single file)
- [ ] Arrow functions only (no `function` declarations)
- [ ] `memo()` wrapper on every component
- [ ] Props destructured inside body: `const { x, y } = props;`
- [ ] `displayName` set on every component
- [ ] Style function below component with `/** @type {MuiSx} */`
- [ ] `rem` units (never `px`)
- [ ] MUI components (never raw HTML `div`/`span`/`button`)
- [ ] Shared UI components (Modal.BaseModal, Button.BaseBtn, Input.InputBase) over legacy equivalents
- [ ] `useTheme` from `@mui/material` (not from `@emotion/react`)
- [ ] Palette colors from theme (never hardcoded hex except in theme config)
- [ ] New files only in `src/[fsd]/` (never in legacy directories)
- [ ] `useCallback` for event handlers where it makes sense (passed to child components, used in dependency
      arrays)
- [ ] Named exports for hooks, helpers, constants; default exports for components
