# Transfer to FSD

Migrate a legacy file (or set of files) from the old `src/` structure into the FSD architecture at
`src/[fsd]/`.

## Input

The user provides a file path (e.g., `src/pages/Applications/ApplicationCard.jsx`) or a folder path to
migrate.

## Steps

### 1. Analyze the source file

- Read the file and understand what it is: component, hook, helper, constant, API slice, Redux slice.
- Identify all imports: internal project imports, relative imports, third-party imports.
- Identify all exports: what other files depend on this file (use grep to find all importers).
- Map every dependency: constants, hooks, helpers, utils, other components that this file uses or that use
  this file.

### 2. Determine the FSD destination

Based on what the file does, pick the correct layer:

- **shared** — generic reusable UI, hooks, helpers, constants (not tied to a business domain)
- **entities** — domain-specific data representations and their UI
- **features** — business logic and user-facing functionality tied to a domain
- **widgets** — composite blocks that combine multiple features/entities
- **pages** — thin wrappers that compose widgets/features for a route

Pick or create the right **slice** (kebab-case directory name) and **segment** (`ui/`, `lib/hooks/`,
`lib/constants/`, `lib/helpers/`, `api/`, `model/`).

### 3. Create the destination structure

- Create any missing directories in the target slice.
- If the slice doesn't have an `index.js` barrel file, create one.

### 4. Move and refactor the file

- Copy the file to its new location with correct naming (PascalCase for components, camelCase.type.js for
  logic files).
- Refactor the file to follow ALL FSD conventions from CLAUDE.md:
  - Wrap component in `memo`, destructure props inside body, set `displayName`
  - Move styles to a style function below the component with `/** @type {MuiSx} */`
  - Replace any raw HTML (`div`, `span`, `button`, etc.) with MUI components (`Box`, `Typography`, `BaseBtn`)
  - Use `rem` units instead of `px`
  - Ensure one component per file — extract additional components to their own files
  - Use arrow functions only
  - Use `useTheme` from `@mui/material` (not `@emotion/react`)

### 5. Update imports throughout the codebase

- Update the barrel file (`index.js`) in the new slice to export the moved file.
- Find ALL files that imported from the old path (grep the codebase).
- Update every import to point to the new FSD location.
- If other legacy files import this file, update their imports to use the new `@/[fsd]/...` path.

### 6. Handle dependencies

- If the moved file imports other legacy files that should also move, note them but do NOT move them
  automatically — list them as recommended next migrations.
- If the moved file imports legacy code that will stay in legacy for now (e.g., `@/api/eliteaApi`), keep those
  imports as-is.

### 7. Clean up

- Delete the original file from the old location.
- If the old directory is now empty, remove it.
- Remove any stale barrel exports that referenced the old file.

### 8. Verify

- Run `npm run lint` to check for import errors.
- Report what was moved, where it went, and list any recommended follow-up migrations for dependencies that
  are still in the old structure.

## Output

Provide a summary:

- **Moved**: old path → new path
- **Updated imports**: list of files whose imports were updated
- **Follow-up migrations recommended**: list of legacy dependencies that should be migrated next
