---
paths:
  - src/[fsd]/**/*
---

# FSD Rules

You are working inside the Feature-Sliced Design (`src/[fsd]/`) directory. All code here MUST follow these
rules strictly.

## Architecture

- **Layer import direction**: `app → pages → widgets / features → entities → shared`. A layer may only import
  from layers below it. Never import upward.
- **`features` and `widgets` are peers**: `features` may import from `widgets` and vice-versa. In this project
  features are large business modules while widgets are smaller self-contained UI blocks, so cross-imports
  between them are allowed.
- **Redux store** lives in `shared/config/store.js` so every layer can import it.
- **Cross-slice imports within the same layer**: import through the barrel file (`index.js`), never reach into
  another slice's internals.
- **No new files in legacy directories** (`src/components/`, `src/pages/`, `src/hooks/`, `src/api/`,
  `src/slices/`, `src/common/`, `src/utils/`). All new code goes in `src/[fsd]/`.
- Importing FROM legacy into FSD is acceptable during migration.

## Component Rules

- **One file = one component.** Never define multiple components in a single file.
- **Always wrap in `memo`**: `const MyComponent = memo(props => { ... });`
- **Destructure props inside the body**, not in the parameter list: `const { prop1, prop2 } = props;`
- **Always set `displayName`**: `MyComponent.displayName = 'MyComponent';`
- **Always `export default`** for components.
- **Arrow functions only.** No `function` declarations.
- **`forwardRef` nests inside `memo`**:
  ```jsx
  const MyComp = memo(
    forwardRef((props, ref) => { ... }),
  );
  ```

## Styling

- **Style function pattern only.** No `makeStyles`, `useStyles`, `styled()`, CSS modules, or separate CSS
  files.
- Define the style function **below the component**, after `displayName`.
- Name it `camelCaseComponentNameStyles` (e.g., `myComponentStyles`).
- Annotate with `/** @type {MuiSx} */`.
- Use `({ palette }) =>` for theme-dependent styles.
- **`rem` units only** — never `px`. Use `0.0625rem` for 1px.
- Merge external `sx` with array syntax: `sx={[styles.root, sx]}`.
- **No inline style props** on MUI components (like `display`, `flexDirection` as direct props on `Box`).
  Always use `sx`.

## MUI — No Raw HTML

- `<div>` → `<Box>`
- `<span>` → `<Box component="span">` or `<Typography>`
- `<p>` / headings → `<Typography>`
- `<button>` → `<BaseBtn>` from `@/[fsd]/shared/ui/button` or MUI `<Button>`
- `<input>` → `<Input.InputBase>` from `@/[fsd]/shared/ui/input`
- `<select>` → MUI `<Select>`
- `<ul>/<li>` → MUI `<List>/<ListItem>`
- `<a>` → React Router `<Link>` or MUI `<Link>`
- `<table>` → MUI X `<DataGrid>`
- `useTheme` from `@mui/material` — **never** from `@emotion/react`

## File Naming

- Components: `PascalCase.jsx` (e.g., `AgentCard.jsx`)
- Hooks: `camelCase.hooks.js` (e.g., `useModal.hooks.js`)
- Helpers: `camelCase.helpers.js`
- Constants: `camelCase.constants.js`
- Redux slices: `camelCase.slice.js`
- API files: `camelCaseApi.js`
- Serialize: `camelCase.serialize.js`
- Tests: `<name>.test.js(x)` — always inside `__tests__/` folder
- Barrel files: always `index.js`
- Directories (slices): `kebab-case` (e.g., `agent-hub/`)

## Constants

- Local-only constants (used in one file) — define at the top of that file.
- Shared constants (exported, used by multiple files) — move to `lib/constants/` in the appropriate slice.
- Use `UPPER_SNAKE_CASE` for constant object names.
- **Importing shared constants**: import the namespace from the shared barrel, then destructure inside the
  component body:

  ```js
  import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';

  // Inside component or function:
  const { ParticipantEntityTypes } = ParticipantEntityConstants;
  ```

## Hooks

- File suffix: `.hooks.js`
- Named exports only (no default export).
- `useCallback` for event handlers where it makes sense (passed to children, used in dependency arrays).

## Barrel Files

- Every public-facing folder gets an `index.js`.
- Components: `export { default as MyComponent } from './MyComponent';`
- Hooks/helpers: `export * from './useMyHook.hooks';`
- Grouped: `export * as Button from './button';`

## Tests

- Always in `__tests__/` folder, co-located with the code they test.
- Never place test files alongside source files.
- Use Vitest + React Testing Library.
- Use `data-testid` attributes for selectors.

## Import Order

Prettier handles sorting automatically. The order is:

1. `react`
2. Third-party libraries
3. `@mui/` imports
4. `@/` project imports (FSD and legacy)
5. Relative imports (`./`, `../`)
