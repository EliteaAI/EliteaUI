# Fix FSD Audit

Fix violations from the FSD audit report (`scripts/fsd_audit_report.md`).

## Input

The user specifies which section of the audit report to work on (e.g., "1.1 Upward Import Violations").

## Workflow

1. Read the specified section from `scripts/fsd_audit_report.md`
2. For each violation, analyze the code before fixing:
   - Read the violating file and the imported module
   - Understand what is imported, why, and what dependencies it has
   - Choose the simplest fix that resolves the FSD layer violation
3. Apply fixes — prefer simple approaches:
   - **Move to shared**: if the import is a pure constant, helper, or hook with no upper-layer dependencies
   - **Move to correct layer**: if a component/hook lives in the wrong layer (e.g., page-level code that
     belongs in features)
   - **Promote the consumer**: if an entity composes feature-level components, promote it to widgets
   - **Dependency inversion**: accept the import as a prop/parameter from a higher layer (use sparingly)
4. After each fix, update all import paths across the codebase
5. Update barrel files (`index.js`) in both source and destination
6. Append results to the end of `scripts/fsd_audit_report.md` documenting what was fixed

## Fix Principles

- Do not overcomplicate — choose the simplest valid fix
- Moving code between layers is preferred over abstraction or indirection
- Pure functions, constants, and API endpoints usually belong in `shared/` or `entities/`
- Components that compose features belong in `widgets/`, not `entities/`
- Always update all consumers when moving an export
- Always update barrel files in both old and new locations
- Run `npm run build` after fixes to verify nothing is broken

## Output

After fixing, append a section to the audit report documenting:

- Date of fixes
- Which violations were fixed
- What was done for each (moved where, renamed, etc.)
- Any violations intentionally skipped and why
