# FSD Check

Audit a file, folder, or the entire `src/[fsd]/` directory for violations of FSD architecture rules and code
conventions defined in CLAUDE.md.

## Input

The user provides a file path, folder path, or no argument (audit all of `src/[fsd]/`).

## What to check

### Architecture violations

- **Wrong-direction imports**: a lower layer importing from a higher layer (e.g., `entities/` importing from
  `features/`, `shared/` importing from `entities/`)
- **New files in legacy directories**: any recently created files in `src/components/`, `src/pages/`,
  `src/hooks/`, `src/api/`, `src/slices/`, `src/common/`, `src/utils/` (check git status or recent file
  timestamps)
- **Missing barrel files**: slices or segments without an `index.js`
- **Cross-slice imports within the same layer**: a feature importing directly from another feature's internals
  (should go through barrel file)

### Component conventions

- **Missing `memo` wrapper**: components not wrapped in `memo()`
- **Missing `displayName`**: components without `ComponentName.displayName = 'ComponentName'`
- **Props destructured in parameter**: `memo(({ prop1, prop2 }) =>` instead of
  `memo(props => { const { prop1, prop2 } = props; }`
- **Multiple components in one file**: more than one component definition per `.jsx` file
- **Function declarations**: using `function` keyword instead of arrow functions
- **Default export missing**: components not using `export default`

### Styling violations

- **Raw HTML elements**: `<div>`, `<span>`, `<p>`, `<button>`, `<input>` instead of MUI components
- **Inline styles**: `style={{}}` prop instead of `sx` prop with style function
- **Inline sx objects**: complex styles defined inline in JSX instead of extracted to a style function
- **Missing style function annotation**: style functions without `/** @type {MuiSx} */`
- **px units**: pixel values instead of `rem` (e.g., `'16px'` instead of `'1rem'`)
- **`useTheme` from wrong source**: imported from `@emotion/react` instead of `@mui/material`
- **Style props on MUI components**: using `display`, `flexDirection`, etc. as direct props on `Box` instead
  of `sx`

### File naming violations

- **Component files not PascalCase**: e.g., `myComponent.jsx` instead of `MyComponent.jsx`
- **Hook files missing `.hooks.js` suffix**: e.g., `useModal.js` instead of `useModal.hooks.js`
- **Helper files missing `.helpers.js` suffix**
- **Constant files missing `.constants.js` suffix**
- **Directories not kebab-case**: e.g., `agentHub/` instead of `agent-hub/`

### Test placement

- **Tests not in `__tests__/` folder**: test files placed alongside source files instead of in `__tests__/`

## Output

Report findings grouped by severity:

1. **Errors** — Must fix: architecture violations, wrong imports, raw HTML, missing memo/displayName
2. **Warnings** — Should fix: naming conventions, missing barrel files, px units
3. **Info** — Suggestions: potential improvements, files that could be migrated from legacy

For each finding, report:

- File path and line number
- What the violation is
- How to fix it (brief)

End with a summary count: X errors, Y warnings, Z info.
