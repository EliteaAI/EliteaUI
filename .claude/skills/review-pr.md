# Review PR

Review a pull request against the project's coding standards and post inline comments from the user's GitHub
account. The review should read as if written by a senior engineer on the team — natural, direct, and helpful.

## Input

The user provides one of:

- A GitHub PR URL (e.g., `https://github.com/EliteaAI/EliteaUI/pull/123`)
- A PR number (e.g., `123` or `#123`)

Extract `owner`, `repo`, and `pullNumber` from the input. Default to `EliteaAI` / `EliteaUI` if only a number
is given.

## Steps

### 1. Fetch PR data

Use the GitHub MCP tools to gather context:

- `pull_request_read` with `method: "get"` — get PR metadata (title, author, base branch, head SHA)
- `pull_request_read` with `method: "get_diff"` — get the full diff
- `pull_request_read` with `method: "get_files"` — list changed files

### 2. Read changed files in full

For each changed file in the PR, read the **full file** from the local repo (checkout the PR branch first if
needed, or read from the head SHA). Understanding the full file context is critical — reviewing only the diff
leads to shallow feedback.

### 3. Review the code

Analyze the changes against these review categories, ordered by priority:

#### A. Business logic issues (Critical)

- Incorrect conditions, wrong state handling, missing edge cases
- Race conditions, memory leaks, unhandled promise rejections
- Broken user flows, missing error boundaries
- Security concerns (XSS, injection, exposed secrets)

#### B. Code that could crash the app (Critical)

- Accessing properties on potentially null/undefined values without optional chaining
- Missing key props in lists
- Incorrect dependency arrays in hooks (stale closures, infinite loops)
- Incorrect event handler wiring
- Broken imports (wrong paths, missing exports)

#### C. Code reuse and duplication (Important)

- Duplicated logic that already exists in `shared/` or another slice
- Components that are very similar to existing ones and should be consolidated
- Utility functions that duplicate helpers already in the codebase
- Hardcoded values that should use existing constants

#### D. FSD architecture compliance (Important — for new code in `src/[fsd]/` only)

Run the same checks as the `fsd-check` skill:

- Wrong-direction imports (lower layer importing from higher layer)
- New files created in legacy directories (`src/components/`, `src/pages/`, etc.)
- Missing barrel files (`index.js`)
- Cross-slice imports bypassing barrel files

#### E. Component and code conventions (from CLAUDE.md)

- Missing `memo()` wrapper on components
- Missing `displayName`
- Props destructured in parameter list instead of inside body
- Multiple components defined in a single file
- `function` declarations instead of arrow functions
- Missing `export default` on components

#### F. Styling conventions

- Raw HTML elements (`<div>`, `<span>`, `<button>`, etc.) instead of MUI components
- `px` units instead of `rem`
- Inline styles or `styled()` instead of the style-function pattern with `sx`
- `useTheme` imported from `@emotion/react` instead of `@mui/material`
- Missing `/** @type {MuiSx} */` annotation on style functions
- Hardcoded colors instead of palette tokens

#### G. File naming

- Component files not PascalCase
- Hook files missing `.hooks.js` suffix
- Helper/constant/slice files with wrong naming pattern
- Directories not in kebab-case

#### H. General best practices

- Overly complex logic that could be simplified
- Missing `useCallback` / `useMemo` where it matters (props passed to children, dependency arrays)
- Comments that explain "what" instead of "why" (or unnecessary comments)
- Dead code, unused imports, console.logs left behind

### 4. Filter and prioritize findings

- Only comment on things that genuinely matter. Do not nitpick.
- Group multiple small issues in the same file area into one comment when appropriate.
- If the PR is touching legacy code (`src/components/`, `src/pages/`), do NOT demand FSD migration — only flag
  FSD violations if the author explicitly placed new code in `src/[fsd]/`.
- If a file was only renamed or moved with no logic changes, skip it.
- Prioritize: business bugs > crashes > duplication > architecture > conventions > style.

### 5. Post the review on GitHub

Use the GitHub MCP tools to post a formal review:

1. **Create a pending review:**

   ```
   mcp__github__pull_request_review_write
     method: "create"
     owner, repo, pullNumber
     commitID: <head SHA from step 1>
   ```

2. **Add inline comments** for each finding:

   ```
   mcp__github__add_comment_to_pending_review
     owner, repo, pullNumber
     path: <file path relative to repo root>
     line: <line number in the new file>
     side: "RIGHT"
     subjectType: "LINE"
     body: <comment text>
   ```

   For multi-line findings, use `startLine` + `line` to highlight a range.

3. **Submit the review:**

   ```
   mcp__github__pull_request_review_write
     method: "submit_pending"
     owner, repo, pullNumber
     event: <"COMMENT" | "REQUEST_CHANGES" | "APPROVE">
     body: <summary>
   ```

   Choose the event based on findings:
   - **APPROVE** — no issues found, or only minor suggestions
   - **COMMENT** — minor suggestions or style issues only
   - **REQUEST_CHANGES** — any business logic bug, crash risk, or significant architectural violation

   The summary body should be 2-3 sentences max. Mention what looks good if appropriate, then state the main
   concern if any.

### 6. Report to the user

After posting, tell the user:

- The review outcome (approved / commented / requested changes)
- How many comments were posted
- The PR URL

## Writing style for comments

Comments are posted from the user's GitHub account, so they must read like a real person wrote them.

**Do:**

- Write in first person ("I think", "we should", "this could")
- Be direct and concise — one short paragraph per comment, two max
- Suggest the fix, not just the problem ("Consider using `Box` here instead of `div`")
- Use a casual-professional tone, like a helpful code review from a teammate
- Use regular hyphens (-), not em dashes
- Use simple formatting: backticks for code, nothing fancy
- If suggesting a code change, use a GitHub suggestion block:
  ````
  ```suggestion
  <corrected code>
  ```
  ````

**Do not:**

- Use em dashes (—), arrows (→), or other special punctuation
- Write overly formal or robotic language
- Start comments with "Issue:", "Problem:", "Violation:" or similar labels
- Use numbered lists or headers inside comments
- Reference CLAUDE.md, FSD rules, or any internal documentation by name — just state the convention naturally
  ("We wrap components in `memo()` in this project")
- Use emoji
- Write more than 4-5 lines per comment unless showing a code suggestion
- Mention AI, Claude, automation, or that this review was generated

## Rules

- Never approve a PR that has business logic bugs or crash risks.
- If the PR has no issues at all, approve with a short positive summary.
- Maximum 15 inline comments per review — consolidate if there are more findings.
- If you cannot determine the line number for a finding, use `subjectType: "FILE"` instead.
- Always read the full changed files, not just the diff hunks.
- Do not review auto-generated files, lock files, or build artifacts.
