# Review Uncommitted Changes

Review the working tree against the project's coding standards, using the same rules as a PR review, and
report the findings in the terminal. Nothing is committed, pushed, or posted to GitHub.

Use this before committing, or whenever the user asks for a review of what they have in progress.

## Input

Optional. The user may give:

- Nothing — review every uncommitted change (staged, unstaged, and untracked)
- `staged` — review only what is staged (`git diff --cached`)
- `unstaged` — review only what is not staged
- One or more paths — review only changes under those paths

## Steps

### 1. Gather the changes

```bash
git status --short              # what changed, including untracked files
git diff                        # unstaged changes
git diff --cached               # staged changes
```

Scope the diffs to the requested paths when the user gave any (`git diff -- <paths>`).

If the working tree is clean, say so and stop — there is nothing to review.

Untracked files do not appear in `git diff`, so collect them from `git status --short` (lines starting with
`??`) and treat their whole contents as added code.

### 2. Read changed files in full

For every changed or new file, read the **full file**, not only the diff hunks. Understanding the surrounding
file is critical — reviewing hunks in isolation leads to shallow feedback.

Also read the files the changed code imports from when a finding depends on them (for example, to check that
an export exists, or that a helper already does the same thing).

### 3. Review the code

Apply the review categories in `.claude/skills/review-pr.md`, sections A through H — that file is the single
source of truth for what to look for, so the same standards apply here as in a PR review:

- **A. Business logic issues** (Critical)
- **B. Code that could crash the app** (Critical)
- **C. Code reuse and duplication** (Important)
- **D. FSD architecture compliance** (Important, new code in `src/[fsd]/` only)
- **E. Component and code conventions** from CLAUDE.md
- **F. Styling conventions**, including semantic palette token usage
- **G. File naming**
- **H. General best practices**

### 4. Filter and prioritize findings

Follow the same filtering as a PR review:

- Only report things that genuinely matter. Do not nitpick.
- Group several small issues in the same file area into one finding.
- Do not demand FSD migration of legacy code the user merely touched (`src/components/`, `src/pages/`); flag
  FSD violations only for new code placed in `src/[fsd]/`.
- Skip pure renames and moves with no logic change.
- Prioritize: business bugs > crashes > duplication > architecture > conventions > style.
- Skip auto-generated files, lock files, and build artifacts.

### 5. Report in the terminal

Do not post anything to GitHub and do not create a commit.

Group findings by file, most severe first, and mark each with its severity. Reference every finding as
`path/to/File.jsx:42` so it is clickable in the IDE, and keep each finding to a couple of lines: what is
wrong, and what to do instead.

```
src/[fsd]/features/foo/ui/FooPanel.jsx

  Critical  FooPanel.jsx:24 - `items.map` runs before the query resolves, so `items` is undefined on
            first render. Default it: `const { items = [] } = props;`

  Minor     FooPanel.jsx:88 - `palette.background.tabButton.default` is a background token used for
            `color`. Use a `text.*` token here.
```

Finish with a one-line verdict:

- **Ready to commit** — nothing found, or only minor suggestions
- **Fix first** — any business logic bug, crash risk, or significant architectural violation

Then offer to apply the fixes. Apply them only if the user says yes, and re-check the files afterwards.

## Writing style for findings

- Plain and direct, the way a teammate would say it out loud.
- State the fix, not only the problem.
- One or two lines per finding; add a short code snippet only when it makes the fix obvious.
- Backticks for code. No emoji, no headers inside a finding, no severity words like "Violation:" as a prefix
  (the severity column already says it).
- State the convention naturally ("we wrap components in `memo()` in this project") rather than citing
  CLAUDE.md, FSD rules, or this skill by name.

## Rules

- Never commit, stage, push, or open a PR from this skill. It is read-only until the user asks for fixes.
- Always read the full changed files, not just the diff hunks.
- Include untracked files — new files are usually where most findings are.
- Maximum 15 findings — consolidate the rest into a short "also worth a look" line.
- If the user asks for fixes, fix only what was reported and leave unrelated code alone.
