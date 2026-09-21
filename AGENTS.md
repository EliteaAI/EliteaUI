# EliteaUI agent guidance

This repository owns the React 18 / Vite 6 / Redux Toolkit / MUI 7 frontend. Use JavaScript; do not introduce
TypeScript or upgrade dependencies as a side effect. These rules are derived from [CLAUDE.md](./CLAUDE.md).
Read that file for the full architecture, examples and design conventions before editing UI code.

## Ownership and scope

- Verify this repository's Git root and status before changes. Preserve unrelated work.
- All new application source and unit tests go in `src/[fsd]/`. Do not create files in legacy `src/pages`,
  `components`, `hooks`, `api`, `common` or `utils`. Existing legacy files may be edited; FSD may import
  legacy code during migration.
- Follow the FSD layers: app → pages → widgets/features → entities → shared. Widgets and features are peers
  and may import each other. Never import upward.
- Put code in the owning slice (`api`, `lib`, `model`, `ui`) and expose public APIs through `index.js`. Do not
  introduce new infrastructure for a local UI change.

## Components and shared UI

- One component per `.jsx` file. Use `const Name = memo(props => { ... })`, destructure props inside the body,
  set `Name.displayName`, and default-export it. Nest `forwardRef` inside `memo` where needed.
- Prefer `Input.InputBase`, `Button.BaseBtn` and `Modal.BaseModal` from `@/[fsd]/shared/ui` over raw MUI or
  legacy equivalents. Use their shared variants.
- Prefer MUI `Box`, `Typography`, lists and React Router links over raw HTML.
- Extract event handlers into `useCallback` with complete dependencies. Memoize derived model/option arrays
  passed to child components; avoid inline duplication.
- Put reusable hooks in `lib/hooks/use<Name>.hooks.js`, with named exports. Test the real hook instead of
  reading source text or evaluating strings as functions.
- Shared exported constants belong in `lib/constants/<name>.constants.js`; use UPPER_SNAKE_CASE names,
  namespace-export via the barrel and destructure imports. Constants used only in one file may stay local.
- Helpers are pure named exports in `<name>.helpers.js`. RTK Query APIs use `<name>Api.js`,
  `eliteaApi.injectEndpoints()` and appropriate cache invalidation.

## Styling

- Use MUI `sx` and a named `camelCaseComponentStyles` function below `displayName`, annotated
  `/** @type {MuiSx} */`. Keep styles out of inline JSX objects.
- Use rem units and semantic theme palette tokens. No hardcoded colors, CSS files, CSS modules, `styled()`,
  `makeStyles` or `useStyles` in new code.
- Use background tokens for backgrounds, border tokens for borders, text tokens for text and icon tokens for
  icons. Import `useTheme` from `@mui/material`.
- Merge external styles using `sx={[styles.root, sx]}`.

## Tests and verification

- Unit/component tests use Vitest and React Testing Library in co-located `__tests__/` directories. Do not
  place tests next to source files.
- Render components with `ThemeProvider`; select stable `data-testid` elements. Use `vi.mock`, clear mocks
  before each test and clean up rendered trees afterwards.
- Cover behavioral changes at their boundary: saved user choices must survive catalog refreshes and
  project-default changes. Do not claim UI-only checks prove runtime routing, provider capabilities or
  calibration results.
- Use npm and the existing `package-lock.json`. `npm test -- <paths>` runs focused Vitest tests;
  `npm run test:e2e` runs Playwright. `npm run build` builds production.
- Run ESLint and Prettier on changed files first; avoid repository-wide reformatting. Formatting is two
  spaces, single quotes, 110 columns, trailing commas and unparenthesized single arrow arguments. Prettier
  sorts imports.
- Report failed/skipped checks with their actual reason. Review comments are only resolved after the fix is
  committed/pushed and verified. Never merge or close feature issues as a side effect of addressing a review.
