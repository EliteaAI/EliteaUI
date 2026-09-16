# Palette Semantic Misuse Fixes

**Rule:** A token's top-level category name must match the CSS property it is applied to.
- `palette.background.*` → only `background`, `backgroundColor`, `bgcolor`
- `palette.border.*` → only `border`, `borderColor`, `borderTop/Bottom/Left/Right`, `outline`
- `palette.text.*` → only `color` on text/typography elements
- `palette.icon.fill.*` → only `color`/`fill` on SVG/icon elements
- `palette.boxShadow.*` → only `boxShadow`

**57 total violations across 32 files.** Grouped into 6 fix groups below.

---

## Group A — `palette.background.*` used as border value (11 violations)

### A1. `background.wrong` as `border:` (3 files)

`background.wrong` (= `red40`) has the exact same value as `border.error`. Direct swap.

| File | Line | Current | Fix |
|------|------|---------|-----|
| `[fsd]/features/chat/ui/error-trace/ErrorTrace.jsx` | 133 | `border: \`1px solid ${palette.background.wrong}\`` | → `palette.border.error` |
| `[fsd]/features/chat/ui/error-trace/BudgetErrorMessage.jsx` | 65 | `border: \`0.0625rem solid ${palette.background.wrong}\`` | → `palette.border.error` |
| `[fsd]/features/toolkits/indexes/ui/index-list/IndexListItem.jsx` | 328 | `border: \`1px solid ${palette.background.wrong}\`` | → `palette.border.error` |

**Status:** [ ] pending

---

### A2. `background.interactiveItem.hover` as `border:` (2 files)

Used as a subtle hover/active card border. Map to `palette.border.lines` (closest semantic match — a subtle divider border).

| File | Line | Current | Fix |
|------|------|---------|-----|
| `[fsd]/features/toolkits/indexes/ui/index-list/IndexListItem.jsx` | 324 | `border: \`.0625rem solid ${palette.background.interactiveItem.hover}\`` | → `palette.border.lines` |
| `[fsd]/features/chat/participants/ui/ExpandedParticipants/ParticipantNormalCard.jsx` | 173 | `border: isActive ? \`0.0625rem solid ${palette.background.interactiveItem.hover}\` : undefined` | → `palette.border.lines` |

**Status:** [ ] pending

---

### A3. `background.surface.interactive.default` as `border:` (4 files)

Used as a subtle card separator border in evaluation widgets. Map to `palette.border.lines`.

| File | Line | Fix |
|------|------|-----|
| `[fsd]/widgets/evaluation/ui/common/SharedDatasetBadge.jsx` | 45 | → `palette.border.lines` |
| `[fsd]/widgets/evaluation/ui/suite/dimension/DimensionCard.jsx` | 189 | → `palette.border.lines` |
| `[fsd]/widgets/evaluation/ui/dimensions/DimensionItem.jsx` | 136 | → `palette.border.lines` |
| `[fsd]/widgets/evaluation/ui/dimensions/ManageDimensionCard.jsx` | 213 | → `palette.border.lines` |

**Status:** [ ] pending

---

### A4. `background.wrong` raw value assigned to `border` key in style map (1 file)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `[fsd]/shared/ui/banner-message/BannerMessage.jsx` | 76 | `border: palette.background.wrong` | → `palette.border.error` |

**Status:** [ ] pending

---

### A5. `background.default.secondary` as `borderColor:` (1 file)

Used as a border color on a preview panel separator. Map to `palette.border.default`.

| File | Line | Fix |
|------|------|-----|
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/PreviewDocument.jsx` | 171 | `borderColor: \`${palette.background.default.secondary} !important\`` → `palette.border.default` |

**Status:** [ ] pending

---

## Group B — `palette.border.*` used as text `color:` (5 violations, 4 files)

### B1. `border.hover` as text `color:` → `palette.text.default` (3 violations)

`border.hover` = `gray10` in dark, `light10` in light — **identical values** to `text.default`. Pure semantic fix.

| File | Lines | Fix |
|------|-------|-----|
| `[fsd]/features/chat/participants/ui/CollapsedParticipants/CollapsedParticipantsDropdown.jsx` | 232 | `color: palette.border.hover` → `palette.text.default` |
| `[fsd]/features/chat/participants/ui/UsersParticipantDropdown/index.jsx` | 226 | `color: palette.border.hover` → `palette.text.default` |
| `[fsd]/features/pipelines/flow-editor/ui/FlowEditor.jsx` | 699 | `color: \`${theme.palette.border.hover} !important\`` → `palette.text.default` |

**Status:** [ ] pending

---

### B2. `border.lines` as text `color:` → `palette.text.disabled` (2 violations)

Used for muted section label uppercase text. Map to `palette.text.disabled` (nearest muted text token).

| File | Lines | Fix |
|------|-------|-----|
| `[fsd]/features/chat/participants/ui/CollapsedParticipants/CollapsedParticipantsDropdown.jsx` | 211 | `color: palette.border.lines` → `palette.text.disabled` |
| `[fsd]/features/chat/participants/ui/UsersParticipantDropdown/index.jsx` | 205 | `color: palette.border.lines` → `palette.text.disabled` |

**Status:** [ ] pending

---

## Group C — `palette.text.*` used as `background:` (8 violations, 3 files)

### C1. `text.tertiary` as scrollbar `background:` — token does not exist (7 violations)

`palette.text.tertiary` is not defined anywhere in the palette — renders as `undefined`. The correct token for scrollbar thumb hover is `palette.components.scrollbar.thumbHover`.

| File | Lines | Fix |
|------|-------|-----|
| `[fsd]/features/settings/ui/project-general/project-ai-configurations/open-ai-template/CodePreviewContent.jsx` | 61 | `background: palette.text.tertiary` → `palette.components.scrollbar.thumbHover` |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/PreviewContent.jsx` | 380, 494, 577, 635, 691 (5×) | same fix |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/MdxPreview.jsx` | 389 | same fix |

**Status:** [ ] pending

---

### C2. `text.secondary` / `text.primary` in shimmer gradient with `WebkitBackgroundClip: 'text'` (1 case)

`SubAgentAccordion.jsx` line 138 — intentional CSS technique (text color rendered via `background-clip: text`). Not a true violation — the text color is applied through a clip mask. **Skip / no action needed.**

---

## Group D — `palette.text.*` used as `borderColor:` (1 violation)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `[fsd]/features/chat/ui/chat-hitl-actions/ClarifyingQuestionControl.jsx` | 338 | `borderColor: palette.text.secondary` (on `MuiInputBase-root:hover`) | → `palette.border.hover` |

**Status:** [ ] pending

---

## Group E — `palette.icon.fill.*` used as `backgroundColor:` (1 violation)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `[fsd]/features/settings/ui/ai-providers/ConfigurationCard.jsx` | 220 | `backgroundColor: palette.icon.fill.highTier` | → `palette.background.surface.interactive.active` (green20 ≈ dark hover tint; or add dedicated component token) |

**Note:** `icon.fill.highTier` = `green20` (#2bd48d33) — a low-opacity green used as a badge background. Nearest semantic background token is `palette.background.surface.interactive.active` (same low-opacity colored fill intent). If values differ visually, add `components.configurationCard.background.highTier`.

**Status:** [ ] pending

---

## Group F — `palette.text.*` used as SVG/icon `fill:` (31 violations, ~20 files)

All these should use `palette.icon.fill.*` tokens. The mapping below is value-safe (same hex in both themes):

| Used token | Replace with | Values match? |
|------------|-------------|---------------|
| `palette.text.secondary` | `palette.icon.fill.secondary` | ✓ identical |
| `palette.text.primary` | `palette.icon.fill.default` | ✓ identical |
| `palette.text.default` | `palette.icon.fill.default` | ✓ identical |
| `palette.text.accent` | `palette.icon.fill.accent` | ✓ identical |
| `palette.text.disabled` | `palette.icon.fill.disabled` | ✓ identical |
| `palette.text.metrics` | `palette.icon.fill.primary` | ⚠ near-match (gray00 vs grey500) — use `icon.fill.default` instead |

### Files to update:

| File | Lines | Current → Fix |
|------|-------|---------------|
| `[fsd]/features/settings/ui/settings-drawer/SettingsDrawer.jsx` | 224 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/features/settings/ui/system-prompts/ServicePromptsSection.jsx` | 548, 651 | `text.primary` fallback → `icon.fill.default` |
| `[fsd]/features/settings/ui/analytics/AnalyticsContainer.jsx` | 554, 581, 585, 597, 601 | `text.metrics` / `text.default` / `text.secondary` → `icon.fill.primary` / `icon.fill.default` / `icon.fill.secondary` |
| `[fsd]/features/chat/ui/error-trace/ErrorTrace.jsx` | 166 | `text.default` → `icon.fill.default` |
| `[fsd]/features/chat/participants/ui/ParticipantActions/EditParticipantButton.jsx` | 67 | `text.primary` → `icon.fill.default` |
| `[fsd]/features/pipelines/flow-editor/ui/nodes/RunStateNodeGroup.jsx` | 124 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/features/pipelines/flow-editor/ui/nodes/RunStateNode.jsx` | 189 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/features/skill-hub/ui/AttachToAgentDialog.jsx` | 510 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/shared/ui/modal/ExpandedViewerModal.jsx` | 166 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/datasets/DatasetsPanel.jsx` | 107 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/datasets/case-modals/CreateCaseModal.jsx` | 613 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/datasets/case-modals/AddCaseMenu.jsx` | 138 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/datasets/case-modals/AddCaseFromChatsModal.jsx` | 366 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/datasets/case-modals/ImportCaseModal.jsx` | 275 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/suite/dataset/DatasetSection.jsx` | 184, 213 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/suite/dataset/AttachedDatasetCard.jsx` | 380 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/suite/dimension/AddDimensionMenu.jsx` | 151 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/common/SharedDatasetBadge.jsx` | 51 | `text.primary` → `icon.fill.default` |
| `[fsd]/widgets/evaluation/ui/dimensions/DimensionItem.jsx` | 158 | `text.secondary` → `icon.fill.secondary` |
| `[fsd]/widgets/evaluation/ui/suite/SuiteDetailPanel.jsx` | 535 | `text.disabled` → `icon.fill.disabled` |
| `[fsd]/widgets/sidebar-root/ui/SidebarMenuItem.jsx` | 103 | `text.metrics` fallback → `icon.fill.default` |
| `[fsd]/features/apps/ui/catalog/applicationActionButton.styles.js` | 31, 44 | `text.accent` / `text.disabled` → `icon.fill.accent` / `icon.fill.disabled` |
| `components/MermaidDiagramOutput/DiagramOutput.jsx` | 428 | `text.primary` → `icon.fill.default` |
| `components/IconButton.jsx` | 37 | `text.secondary` → `icon.fill.secondary` |

**Status:** [ ] pending

---

## Execution Order

1. **Group A** — Background as border (11 fixes, 7 files)
2. **Group B** — Border as text color (5 fixes, 4 files)
3. **Group C** — Text as background (7 fixes, 3 files) — includes missing token bug
4. **Group D** — Text as borderColor (1 fix, 1 file)
5. **Group E** — Icon.fill as background (1 fix, 1 file)
6. **Group F** — Text as SVG fill (31 fixes, ~20 files)

Run `npm run theme:check` after each group. Run `npm run lint` when all groups are done.
