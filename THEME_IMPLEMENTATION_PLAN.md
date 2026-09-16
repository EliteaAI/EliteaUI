# Theme Implementation Plan — Issue #6385

## Three Goals

1. **Extract all hardcoded colors** from every JSX/JS file — replace with palette tokens
2. **Semantically correct, abstract palette naming** — every token used only for its semantic category (e.g., `text.*` only as CSS `color`, `background.*` only as CSS `background`/`backgroundColor`, `border.*` only as CSS `border`/`borderColor`, `icon.*` only as SVG/icon fill)
3. **Dark and light palettes must have identical key structure** — same keys at every nesting level, only values differ

---

## Part 1 — Fix Hardcoded Colors in `MainTheme.js`

**File:** `src/MainTheme.js:203–226`

Current code uses CSS color names (`'green'`, `'red'`, `'orange'`) and an imported constant `darkBlue` for `MuiAlert` overrides.

**Fix:** Replace with theme callback functions that use palette tokens.

```js
// Before (line 203–226)
import darkPalette, { darkBlue, white } from './darkPalette';

MuiAlert: {
  styleOverrides: {
    filledSuccess:  { backgroundColor: 'green',    background: 'green',    color: white },
    filledError:    { backgroundColor: 'red',       background: 'red',      color: white },
    filledInfo:     { backgroundColor: darkBlue,    background: darkBlue,   color: white },
    filledWarning:  { backgroundColor: 'orange',    background: 'orange',   color: white },
  },
},

// After
import darkPalette from './darkPalette';

MuiAlert: {
  styleOverrides: {
    filledSuccess:  ({ theme }) => ({ backgroundColor: theme.palette.status.success,  color: theme.palette.text.alwaysWhite }),
    filledError:    ({ theme }) => ({ backgroundColor: theme.palette.status.error,    color: theme.palette.text.alwaysWhite }),
    filledInfo:     ({ theme }) => ({ backgroundColor: theme.palette.status.info,     color: theme.palette.text.alwaysWhite }),
    filledWarning:  ({ theme }) => ({ backgroundColor: theme.palette.status.warning,  color: theme.palette.text.alwaysWhite }),
  },
},
```

Also replace the hardcoded box-shadow string in `MuiDialog` (line 79) `'0 0 1.475rem 0 #FFFFFF0D'` with `theme.palette.boxShadow.dialog` — add `boxShadow.dialog` to both palettes.

Remove the named exports `white` and `darkBlue` from `darkPalette.js` — they are implementation details, not public tokens.

---

## Part 2 — Fix Color Value Discrepancies vs Figma

Figma source: "Alita Library" PDF, pages 1–5 (Colors, Backgrounds, Borders, Text categories).

**`darkPalette.js` corrections:**

| Variable | Current value | Correct value | Figma token / note |
|---|---|---|---|
| `primaryHover` | `'#83EFFF'` | `'#FFFFFF'` | Changelog p.1: "DT primary button hover — remove hover color, replace with White" |
| `yellow` | `'#F1BD17'` | `'#F1DB17'` | Figma yellow_default |
| `green8` | `'#2bd48e14'` | `'#2bd48d14'` | Opacity variant hex typo (digit `e` → `d`) |
| `orange40` | `'#e8791166'` | `'#e9791166'` | Opacity variant hex typo (digit `8` → `9`) |
| `warning` | `'#e97912'` | remove entirely | Duplicate of `warningStatus = '#E97912'` |

**`lightPalette.js` corrections:**

| Variable | Current value | Correct value | Figma token / note |
|---|---|---|---|
| `yellow` | `'#FEBD17'` | `'#F1DB17'` | Figma yellow_default (same value in both themes) |

**Rename: `blue_03` → `iris_blue`**

The Figma changelog renames the `blue_03` token to `iris_blue` (#6390FE). In the codebase, any variable or palette key called `blue03` or `blue_03` must be renamed to `irisBlue`.

**Rename: `turquoise_gradient` → `cyan_gradient`**

Any palette key or CSS variable named `turquoiseGradient` must be renamed to `cyanGradient`.

---

## Part 3 — Flatten Palette File Structure

Both files use a two-level spread anti-pattern:

```js
// Current — two declarations, one spread
const oldDarkPalette = { ... };
const darkColorScheme = { ... };
const darkPalette = { ...oldDarkPalette, ...darkColorScheme, overrides... };
```

**Fix:** Collapse into a single object literal per file. Raw color constants stay at the top. The exported default is a single assignment — no intermediate objects, no spreads.

```js
// After
const darkPalette = {
  mode: 'dark',
  background: { ... },
  border: { ... },
  text: { ... },
  // ...
};
export default darkPalette;
```

Remove `oldDarkPalette`, `darkColorScheme`, `oldLightPalette`, `lightColorScheme`.

---

## Part 4 — Palette Structural Parity (Goal #3)

Key diff shows these keys exist in only one theme:

| Key | Only in | Resolution |
|---|---|---|
| `background.folder.borderGradient` | dark | Add to light with appropriate value |
| `background.dark10` | light | Add to dark with appropriate value |
| `background.dark15` | light | Add to dark |
| `background.dark20` | light | Add to dark |
| `background.folder.shadow` | light | Add to dark |
| `border.blue04` | light | Add to dark |
| `boxShadow.aiAnswer` | light | Add to dark |

**Verification script** — add to `package.json` as `"theme:check"`:

```js
// scripts/checkPaletteParity.js
import dark from '../src/darkPalette.js';
import light from '../src/lightPalette.js';
function flatKeys(obj, p = '') {
  return Object.keys(obj).flatMap(k => {
    const path = p ? `${p}.${k}` : k;
    return obj[k] && typeof obj[k] === 'object' ? flatKeys(obj[k], path) : [path];
  });
}
const dk = new Set(flatKeys(dark));
const lk = new Set(flatKeys(light));
const onlyDark = [...dk].filter(k => !lk.has(k));
const onlyLight = [...lk].filter(k => !dk.has(k));
if (onlyDark.length || onlyLight.length) {
  console.error('ONLY IN DARK:', onlyDark);
  console.error('ONLY IN LIGHT:', onlyLight);
  process.exit(1);
}
console.log('✓ Palette parity OK');
```

---

## Part 5 — Semantic Palette Enforcement (Goal #2)

### Semantic Rules

| Palette namespace | Allowed CSS properties | Forbidden |
|---|---|---|
| `palette.text.*` | `color` | `background`, `backgroundColor`, `borderColor`, `fill` |
| `palette.background.*` | `background`, `backgroundColor` | `color`, `borderColor`, `fill` |
| `palette.border.*` | `borderColor`, `border`, `outlineColor` | `color`, `background`, `backgroundColor` |
| `palette.icon.*` | `fill`, `stroke`, `color` (icon-only contexts) | `background`, `backgroundColor`, `borderColor` |

### A. `background.*` used as text `color` (must fix)

| File | Line | Misused token | Correct replacement |
|---|---|---|---|
| `[fsd]/features/settings/ui/project-context/ProjectContextEmptyState.jsx` | 86 | `palette.background.tooltip.default` | `palette.text.secondary` |
| `[fsd]/features/settings/ui/analytics/AnalyticsContainer.jsx` | 470 | `palette.background.tooltip.default` | `palette.text.secondary` |
| `[fsd]/features/skill-hub/ui/SkillCategorySection.jsx` | 180 | `palette.background.button.primary.hover` | `palette.text.primary` |
| `[fsd]/features/chat/ui/model-menu/ModelMenu.jsx` | 101 | `palette.background.button.drawerMenu.hover` | `palette.text.primary` |
| `[fsd]/features/chat/ui/playback/PlaybackToolBar.jsx` | 174 | `palette.background.button.primary.disabled` | `palette.text.disabled` |
| `[fsd]/features/agent-hub/ui/AgentModal.jsx` | 396 | `palette.background.button.primary.hover` | `palette.text.primary` |
| `[fsd]/features/agent-hub/ui/AgentCategorySection.jsx` | 182 | `palette.background.button.primary.hover` | `palette.text.primary` |
| `[fsd]/features/interactive-tours/ui/InteractiveTourCard.jsx` | 230 | `palette.background.interactiveTourPrompt.counter` | `palette.text.interactiveTourCounter` |
| `[fsd]/widgets/context-budget/ui/ExpandableText.jsx` | 93 | `palette.background.button.primary.hover` | `palette.text.primary` |
| `[fsd]/entities/folder/ui/FolderSection.jsx` | 285 | `palette.background.button.primary.disabled` | `palette.text.disabled` |
| `[fsd]/entities/folder/ui/FolderItem.jsx` | 185 | `palette.background.button.primary.disabled` | `palette.text.disabled` |
| `[fsd]/entities/empty-state-page/ui/EmptyStatePage.jsx` | 101 | `palette.background.tooltip.default` | `palette.text.secondary` |
| `pages/Artifacts/component/BucketInfoTooltip.jsx` | 113 | `palette.background.paper` | `palette.text.secondary` |

### B. `text.*` used as `background`/`backgroundColor` (must fix)

| File | Lines | Misused token | Correct replacement |
|---|---|---|---|
| `[fsd]/features/settings/ui/project-general/.../CodePreviewContent.jsx` | 61 | `palette.text.tertiary` | `palette.background.codePreview` |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/MdxPreview.jsx` | 389 | `palette.text.tertiary` | `palette.background.codePreview` |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/PreviewContent.jsx` | 380, 494, 577, 635, 691 | `palette.text.tertiary` | `palette.background.codePreview` |
| `[fsd]/features/toolkits/ui/form/ToolOpenAPI/OpenAPISchemaInput.jsx` | 245 | `palette.text.contextHighLight` | `palette.background.contextHighlight` |
| `[fsd]/shared/ui/input/FileReaderInput.jsx` | 152 | `palette.text.contextHighLight` | `palette.background.contextHighlight` |
| `[fsd]/shared/ui/slider/DiscreteSlider.jsx` | 221 | `palette.text.primary` | `palette.background.slider.track` |
| `[fsd]/widgets/evaluation/ui/datasets/DatasetItem.jsx` | 248 | `palette.text.tooltip.default` | `palette.background.tooltip.default` |

### C. `border.*` used as `background`/`backgroundColor` (must fix)

| File | Misused token | Correct replacement |
|---|---|---|
| `[fsd]/features/settings/ui/usage/components/UsageModelTable.jsx` | `palette.border.lines` | `palette.background.tableRow.default` |
| `[fsd]/features/settings/ui/usage/components/UsageMeter.jsx` | `palette.border.lines` | `palette.background.meterTrack` |
| `[fsd]/features/settings/ui/project-general/.../CodePreviewContent.jsx` | `palette.border.lines` | `palette.background.codePreview` |
| `[fsd]/features/settings/ui/analytics/AnalyticsContainer.jsx` | `palette.border.lines` | `palette.background.tableRow.default` |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/PreviewDocument.jsx` | `palette.border.lines` | `palette.background.codePreview` |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/PreviewContent.jsx` (×6 lines) | `palette.border.lines` | `palette.background.codePreview` |
| `[fsd]/features/artifacts/ui/FilePreviewCanvas/MdxPreview.jsx` | `palette.border.lines` | `palette.background.codePreview` |
| `[fsd]/features/chat/ui/chat-button/PlusChatSubmenu.jsx` | `palette.border.lines` | `palette.background.divider` |
| `[fsd]/features/chat/participants/ui/CollapsedParticipants/CollapsedPerticapantsList.jsx` | `palette.border.lines` | `palette.background.listItem.default` |
| `[fsd]/features/chat/participants/ui/CollapsedParticipants/CollapsedParticipantsDropdown.jsx` | `palette.border.lines` | `palette.background.listItem.default` |
| `[fsd]/features/pipelines/flow-editor/ui/FlowEditor.jsx` | `palette.border.table` | `palette.background.flowEditor` |
| `[fsd]/shared/ui/category/CategorySection.jsx` | `palette.border.table` | `palette.background.tableRow.default` |
| `[fsd]/shared/ui/accordion/StyledAccordionSummary.jsx` | `palette.border.toolCardGradient` | `palette.background.toolCardGradient` |
| `[fsd]/shared/ui/slider/DiscreteSlider.jsx` | `palette.border.lines` | `palette.background.slider.track` |
| `[fsd]/pages/settings/PersonalTokens.jsx` | `palette.border.lines` | `palette.background.tableRow.hover` |
| `[fsd]/pages/agent-evaluate/AgentEvaluateHistoryPage.jsx` | `palette.border.lines` | `palette.background.tableRow.default` |

### New Tokens Required for Semantic Fixes

Add to **both** palettes (same key path, different values per theme):

```
background.codePreview              — code preview panel background
background.meterTrack               — progress meter track fill
background.divider                  — decorative divider fill
background.flowEditor               — pipeline flow editor canvas background
background.tableRow.default         — table/list row default background
background.tableRow.hover           — table/list row hover background
background.slider.track             — slider track fill
background.contextHighlight         — drag-over/drop zone highlight (renamed from text.contextHighLight)
background.surfaceOverlay           — semi-transparent overlay on surfaces
background.surfaceSubtle            — very light surface tint
background.dropTarget               — drag-and-drop target highlight
background.errorHighlight           — error highlight in code editors
background.toolCardGradient         — tool card gradient background (moved from border.toolCardGradient)
background.listItem.default         — list item default background
background.button.split.default     — split button default surface
background.button.split.hover       — split button hover surface
background.button.split.pressed     — split button pressed surface
background.chatStarter.strong       — chat starter chip background (LT: iris_blue_40%, DT: magenta 20%)
background.chatStarter.subtle       — chat starter chip subtle background (LT: iris_blue_20%, DT: magenta 10%)
text.accent                         — primary accent text color (DT: cyan_default, LT: magenta_default)
text.accentHover                    — accent text hover/pressed (DT: cyan_pressed, LT: magenta_pressed)
text.progressStatus                 — progress/loading status text (DT: blue_light #29B8F5, LT: blue_dark #006DD1)
text.labeled                        — labeled field text (DT: gray_00 #CAD0D8, LT: light_00 #5B5E69)
icon.fill.onPrimary                 — icon color on primary-colored surfaces
icon.fill.warning                   — warning state icon color
text.alwaysWhite                    — constant white text (invariant, e.g. on filled badges)
text.disabled                       — disabled state text color
text.interactiveTourCounter         — counter text in interactive tour cards
boxShadow.dialog                    — dialog elevation shadow (moved from hardcoded string)
```

Keys to **remove** from both palettes after migration:

```
text.contextHighLight     → replaced by background.contextHighlight
border.toolCardGradient   → replaced by background.toolCardGradient
```

---

## Part 6 — Extract All Hardcoded Colors from Component Files (Goal #1)

**Rule:** No hex, rgba, or rgb literal in any JSX/JS file outside of `*Palette.js`, `MainTheme.js`, and `chartPalette.js`.

### `src/ComponentsLib/Chat/UserInput.jsx`

| Hardcoded | Replace with |
|---|---|
| `'#3B3E46'` | `palette.border.lines` |
| `'rgba(255, 255, 255, 0.05)'` | `palette.background.input.default` |
| `'#FFFFFF'` (text color) | `palette.text.alwaysWhite` |
| `'#0E131D'` (icon on primary button) | `palette.icon.fill.onPrimary` |
| `'#686C76'` (disabled button bg) | `palette.background.button.primary.disabled` |
| `'#6ae8fa'` (send button bg) | `palette.background.button.primary.default` |
| `'#E97912'` (stop icon) | `palette.icon.fill.warning` |

The `??` fallback pattern (`input?.color ?? '#FFFFFF'`) must also be replaced — the default value should come from the palette, not an inline literal. Pass theme tokens as the default value or read from the theme object.

### `[fsd]/entities/grid-table/ui/GridTablePagination.jsx:146`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.1)'` | `palette.background.tabButton.default` |

### `[fsd]/features/agent/ui/generate-agent-modal/GenerateAgentReviewForm.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.2)'` | `palette.background.surfaceOverlay` |

### `[fsd]/features/chat/conversation-list/ui/folders/DroppableFolderItem.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(0,0,0,0.3)'` | `palette.background.dropTarget` |

### `[fsd]/features/chat/conversation-list/ui/groups/DateGroup.jsx`

| Hardcoded | Replace with |
|---|---|
| `mode === 'dark' ? '#A9B7C1' : '#757575'` | `palette.text.secondary` |

### `[fsd]/features/chat/conversation-list/ui/groups/DroppableGroupedArea.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(0,0,0,0.3)'` | `palette.background.dropTarget` |

### `[fsd]/features/chat/participants/ui/ExpandedParticipants/ExpandedParticipantsList.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.1)'` | `palette.background.tabButton.default` |

### `[fsd]/features/chat/participants/ui/ExpandedParticipants/ParticipantsAccordion.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.02)'` | `palette.background.surfaceSubtle` |

### `[fsd]/features/chat/ui/chat-hitl-actions/SensitiveToolParams.jsx`

| Hardcoded | Replace with |
|---|---|
| dark `rgba(255,255,255,0.08)` / light `rgba(0,0,0,0.04)` | `palette.background.surfaceOverlay` |
| dark `rgba(255,255,255,0.04)` / light `rgba(0,0,0,0.02)` | `palette.background.surfaceSubtle` |

### `[fsd]/features/chat/ui/chat-input/AgentEditorPanel.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.1)'` × 2 | `palette.background.tabButton.default` |

### `[fsd]/features/pipelines/yaml-editor/ui/YamlCodeEditor.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(215,22,22,0.20)'` × 2 | `palette.background.errorHighlight` |

### `[fsd]/features/settings/lib/constants/analyticsCommon.constants.js`

These are data-visualization / chart colors — categorical contrast values intentionally invariant across themes. **Do not move to `darkPalette.js` / `lightPalette.js`.** Extract to a dedicated file:

```js
// src/[fsd]/shared/config/theme/chartPalette.js
export const CHART_COLORS = [
  '#10A37F', '#4285F4', '#D4A574', '#FF9900',
  '#58A6FF', '#3FB950', '#D29922', '#BC8CFF',
  '#39D2C0', '#F0883E',
];
export const CHART_TYPE_COLORS = {
  api:      '#58A6FF',
  socketio: '#39D2C0',
  llm:      '#BC8CFF',
  tool:     '#F0883E',
  agent:    '#3FB950',
  rpc:      '#D29922',
  chat:     '#79C0FF',
};
export const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
```

Import `CHART_COLORS`, `CHART_TYPE_COLORS`, `MEDAL_COLORS` wherever they are currently hardcoded.

### `[fsd]/features/settings/ui/ai-providers/ConfigurationSection.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.05)'` | `palette.background.input.default` |
| `'rgba(38,43,52,1)'` | `palette.background.default.secondary` |

### `[fsd]/features/settings/ui/analytics/AnalyticsGuide.jsx`

| Hardcoded | Replace with |
|---|---|
| `'#58A6FF'` | `CHART_TYPE_COLORS.api` |

### `[fsd]/features/settings/ui/analytics/AnalyticsOverview.jsx`

| Hardcoded | Replace with |
|---|---|
| `'#58A6FF'` × 2 (SVG stroke/fill) | `CHART_TYPE_COLORS.api` |

### `[fsd]/features/settings/ui/usage/components/UsageMeter.jsx:89`

| Hardcoded | Replace with |
|---|---|
| `isDarkMode ? theme.palette.border.lines : '#3D44561A'` | `palette.background.meterTrack` (also fixes Part 5-C misuse) |

### `[fsd]/features/toolkits/indexes/ui/index-list/IndexListItem.jsx`

| Hardcoded | Replace with |
|---|---|
| `const ERROR_ICON_FILL = '#D71616'` | `palette.status.error` |

### `[fsd]/widgets/context-budget/ui/ContextBudgetCollapsed.jsx`

| Hardcoded | Replace with |
|---|---|
| `'#FFC107'` | `palette.status.warning` |
| `'#0FA52D'` | `palette.status.success` |

### `[fsd]/widgets/context-budget/ui/ContextBudgetProgress.jsx:86`

| Hardcoded | Replace with |
|---|---|
| `'#3D44561A'` | `palette.background.meterTrack` |

### `[fsd]/widgets/nps-survey/ui/CheckboxQuestion.jsx`

| Hardcoded | Replace with |
|---|---|
| `'rgba(255,255,255,0.6)'` | `palette.text.secondary` |
| `'#fff'` | `palette.text.alwaysWhite` |
| `'rgba(99,144,254,0.1)'` | `palette.background.tabButton.default` |
| `'#0E131D'` | `palette.background.default.primary` |

### `[fsd]/shared/ui/button/BaseBtn.jsx`

The `split` and `agentHub` button variants have inline `palette.mode === 'dark' ? rgba(...) : rgba(...)` patterns.

**Fix:** Replace each pair with the corresponding `palette.background.button.split.*` token. Eliminate all `palette.mode ===` conditionals from component files — that logic belongs in the palette files.

### `[fsd]/pages/resources/ui/ResourceVersionInfo.jsx`

| Hardcoded | Replace with |
|---|---|
| mode-conditional rgba series | `palette.background.surfaceOverlay` |
| `'#777A83'` | `palette.text.secondary` |
| `'rgb(169,183,193)'` | `palette.text.tertiary` |

---

## Part 6b — SVG / Non-MUI Components

SVG elements (`<svg>`, `<path>`, `<rect>`, `<circle>`, Recharts chart primitives) are not MUI components. The `sx` prop and `({ palette }) =>` style callbacks do not apply to them. Each case requires a different approach depending on how the SVG is rendered.

### Pattern 1 — Icon component that accepts a `fill`/`stroke` prop

**Use `useTheme()` and pass the token value as a prop.**

```jsx
// Correct — icon component reads from theme via useTheme(), accepts override via props
import { useTheme } from '@mui/material';

const MyIcon = memo(props => {
  const theme = useTheme();
  return (
    <svg {...props}>
      <path fill={props.fill || theme.palette.icon.fill.default} />
    </svg>
  );
});
```

Callers pass the palette token explicitly when a non-default color is needed:

```jsx
// Caller — reads theme and passes the correct token
const { palette } = useTheme();
<MyIcon fill={palette.icon.fill.warning} />
```

**Do not** pass a hardcoded hex literal as the `fill` prop from the caller. The token must come from the theme.

### Pattern 2 — Inline SVG embedded in JSX (not a reusable icon component)

**Read the theme at the component level, assign to a variable, use it in the SVG attribute.**

```jsx
const MyComponent = memo(props => {
  const { palette } = useTheme();

  return (
    <svg>
      <path fill={palette.icon.fill.default} />
    </svg>
  );
});
```

### Pattern 3 — `currentColor` CSS cascade (preferred for simple monochrome icons)

When the icon should always match the surrounding text color, set `fill="currentColor"` on the path and control the color via the parent element's CSS `color` property through the `sx` prop. No `useTheme()` needed in the icon.

```jsx
// Icon file — paths use currentColor
<svg><path fill="currentColor" /></svg>

// Usage — color flows from CSS color property
<Box sx={{ color: palette.icon.fill.secondary }}>
  <MyIcon />  {/* inherits color from Box */}
</Box>
```

This is the simplest and most maintainable approach for icons that are always monochrome. Prefer this pattern when creating new icon components.

### Pattern 4 — Recharts / data visualization SVG primitives

Recharts components (`<Line>`, `<Area>`, `<Bar>`, `<Pie>`, etc.) accept `stroke` and `fill` props directly. The chart colors are **not** theme palette tokens (they are categorical data colors from `chartPalette.js`). Read them from `CHART_COLORS` or `CHART_TYPE_COLORS`:

```jsx
import { CHART_TYPE_COLORS } from '@/[fsd]/shared/config/theme/chartPalette';

<Line stroke={CHART_TYPE_COLORS.api} fill={CHART_TYPE_COLORS.api} />
```

For status-based chart colors that **do** belong to the theme (e.g., `palette.status.draft`, `palette.status.rejected`), use `useTheme()` and pass the token value:

```jsx
const { palette } = useTheme();
<Line stroke={palette.status.draft} fill={palette.status.draft} />
```

### Known SVG Hardcodes to Fix

| File | Attribute | Hardcoded | Fix |
|---|---|---|---|
| `[fsd]/features/settings/ui/analytics/AnalyticsOverview.jsx:179–180` | `stroke`, `fill` | `"#58A6FF"` | `CHART_TYPE_COLORS.api` (Pattern 4) |
| `components/Icons/BellIcon.jsx:24` | `fill` | `"#D71616"` | `palette.status.error` via `useTheme()` (Pattern 1) |
| `components/Icons/BigRocketIcon.jsx:14` | `fill` | `"#A9B7C1"` | accept `fill` prop with default from `theme.palette.icon.fill.secondary` (Pattern 1) |
| `components/Icons/CheckBoxSemiIcon.jsx:23` | `stroke` on inner `<path>` | `"#0E131D"` | `theme.palette.icon.fill.onPrimary` via `useTheme()` (Pattern 1) |
| `components/Icons/JetBrainsIcon.jsx:113,128,149,178` | `fill` | brand colors (`#231F20`, `#F9ED32`, `#F7941D`) | **do not change** — these are brand/logo colors, intentionally invariant |
| `components/Icons/EliteAIcon.jsx:31` | `fill` | `"#E9E9E9"` | verify with designer — likely a brand color; if invariant, leave in icon file |
| `hooks/application/useAgentPipelineAssociation.jsx:282,289` | `fill` | `"#FFFFFF"` | `palette.icon.fill.alwaysWhite` or `text.alwaysWhite` via `useTheme()` (Pattern 2) |

### `useTheme` Import Rule for SVG Components

Always import `useTheme` from `@mui/material`, not from `@emotion/react`. Several legacy icon files currently use `@emotion/react` — fix these as part of this task.

```js
// Correct
import { useTheme } from '@mui/material';

// Wrong — legacy only, do not use in new or updated code
import { useTheme } from '@emotion/react';
```

---

## Part 7 — Variable Rename Tables

### Naming Convention (Aligned with Figma Design System)

The Figma PDF uses this convention for token names:
- **Neutral scale**: `gray_60`, `gray_55`, `gray_53`, `gray_50`, `gray_40`, `gray_30`, `gray_20`, `gray_10`, `gray_00`
- **Light scale**: `light_53`, `light_40`, `light_30`, `light_20`, `light_10`, `light_00`, `white_01`
- **Brand colors**: `cyan_default` / `cyan_pressed` (DT primary), `magenta_default` / `magenta_pressed` (LT primary)
- **Named colors**: `iris_blue` (#6390FE — renamed from `blue_03`), `blue_02`
- **Opacity variants**: `cyan 30%`, `white 10%`, `magenta 20%`, `dark 10%` (base color + opacity suffix)
- **Special**: `cyan_gradient` (renamed from `turquoise_gradient`), `magenta_gradient`
- **Status**: `red`, `green_light`/#15A42A (DT) / `green_dark`/#108D22 (LT), `blue_light`/#29B8F5 (DT) / `blue_dark`/#006DD1 (LT), `orange`/#E97912

In the JS palette files, translate to camelCase: `gray_60` → `gray60`, `cyan_default` → `cyanDefault`, `iris_blue` → `irisBlue`, `cyan_gradient` → `cyanGradient`, `white_01` → `white01`.

Opacity variants are encoded inline in the palette values using `rgba()` or hex-with-alpha (e.g., `white 10%` = `rgba(255,255,255,0.10)`).

### `darkPalette.js` — Internal Constant Renames

| Old name | New name | Figma token | Value |
|---|---|---|---|
| `primaryDefault` | `cyanDefault` | `Cyan-500` / `cyan_default` | `#6AE8FA` |
| `primaryHover` | `cyanHover` | Changelog: DT hover = White | `#FFFFFF` (corrected) |
| `primaryPressed` | `cyanPressed` | `Cyan-600` / `cyan_pressed` | `#2ABDD2` |
| `primaryDisabled` | `cyanDisabled` | `cyan 10%` opacity variant | `rgba(106,232,250,0.10)` |
| `primaryText` | `onCyanText` | `gray_60` on cyan surface | `#0E131D` |
| `darkBlue` | remove export | n/a — was used only in MainTheme.js | n/a |
| `white` | remove export | Use `text.alwaysWhite` palette token | n/a |
| `warningStatus` | `orangeWarning` | `orange` | `#E97912` (keep) |
| `warning` | remove | Duplicate of `warningStatus` | — |
| `warningYellow` | `yellowWarning` | yellow_default | `#F1DB17` |
| `yellow` | `yellowDefault` | yellow_default | `#F1DB17` (corrected) |
| `orange40` | `orangeWarning40p` | `orange 40%` opacity | corrected hex |
| `green8` | `greenSuccess8p` | `green_light 8%` opacity | corrected hex |
| `skyBlue20` | `blueLight20p` | `blue_light 20%` (base `#29B8F5`) | `rgba(41,184,245,0.20)` |
| `blue03` / `blue_03` | `irisBlue` | `iris_blue` (renamed per Figma changelog) | `#6390FE` |
| `turquoiseGradient` | `cyanGradient` | `cyan_gradient` (renamed per Figma changelog) | gradient definition |

### `lightPalette.js` — Internal Constant Renames

| Old name | New name | Figma token | Value |
|---|---|---|---|
| `primaryDefault` | `magentaDefault` | `Magenta-500` / `magenta_default` | `#C428DD` |
| `primaryHover` | `magentaHover` | `Magenta-400` / `magenta_pressed` | `#F47CFF` |
| `primaryPressed` | `magentaPressed` | `magenta_pressed` | `#F47CFF` |
| `primaryDisabled` | `magentaDisabled` | `magenta 10%` opacity | `rgba(196,40,221,0.10)` |
| `primaryText` | `onMagentaText` | `white` on magenta surface | `#FFFFFF` |
| `yellow` | `yellowDefault` | yellow_default | `#F1DB17` (corrected) |
| `skyBlue20` | `blueDark20p` | `blue_dark 20%` (base `#006DD1`) | `rgba(0,109,209,0.20)` |
| `blue03` / `blue_03` | `irisBlue` | `iris_blue` (renamed per Figma changelog) | `#6390FE` |
| `turquoiseGradient` | `cyanGradient` | `cyan_gradient` (renamed per Figma changelog) | gradient definition |

### Figma Token → Palette Key Mapping Reference

This table maps the Figma PDF token names to the corresponding palette structure keys used in code.

**Backgrounds (DT)**

| Figma token | Palette key | Value |
|---|---|---|
| `gray_60` | `background.default.primary` | `#0E131D` |
| `gray_55` | `background.default.secondary` | `#101721` |
| `gray_53` | `background.surfacePrimary` | `#151C25` |
| `gray_50` | `background.surfaceSecondary` | `#181F2A` |
| `Cyan-500` / `cyan_default` | `background.button.primary.default` | `#6AE8FA` |
| `Cyan-600` / `cyan_pressed` | `background.button.primary.pressed` | `#2ABDD2` |
| `white` | `background.tooltip.default` | `#FFFFFF` |
| `red` | `background.button.danger.default` | `#D71616` |
| `green_light` | `background.button.success.default` | `#15A42A` |
| `blue_light` | `background.button.info.default` | `#29B8F5` |
| `orange` | `background.button.warning.default` | `#E97912` |
| `iris_blue` | `background.folder.irisBlue` | `#6390FE` |

**Backgrounds (LT)**

| Figma token | Palette key | Value |
|---|---|---|
| `white` | `background.default.primary` | `#FFFFFF` |
| `white_01` | `background.default.secondary` | `#FAFAFA` |
| `light_53` | `background.surfacePrimary` | `#F4F5F5` |
| `Magenta-500` / `magenta_default` | `background.button.primary.default` | `#C428DD` |
| `Magenta-400` / `magenta_hover` | `background.button.primary.hover` | `#F47CFF` |
| `gray_60` | `background.tooltip.default` | `#0E131D` |
| `red` | `background.button.danger.default` | `#D71616` |
| `green_dark` | `background.button.success.default` | `#108D22` |
| `blue_dark` | `background.button.info.default` | `#006DD1` |
| `orange` | `background.button.warning.default` | `#E97912` |
| `iris_blue` (renamed from `blue_03`) | `background.folder.irisBlue` | `#6390FE` |
| `iris_blue_40%` | `background.chatStarter.strong` | `rgba(99,144,254,0.40)` |
| `iris_blue_20%` | `background.chatStarter.subtle` | `rgba(99,144,254,0.20)` |

**Borders (DT)**

| Figma token | Palette key | Value |
|---|---|---|
| `gray_30` | `border.lines` | `#3B3E46` |
| `gray_40` | `border.subtle` | `#262B34` |
| `gray_20` | `border.medium` | `#686C76` |
| `gray_10` | `border.strong` | `#A9B7C1` |
| `cyan_default` | `border.primary` | `#6AE8FA` |
| `cyan_pressed` | `border.primaryPressed` | `#2ABDD2` |
| `red` | `border.error` | `#D71616` |
| `cyan_gradient` (renamed) | `border.primaryGradient` | gradient |

**Borders (LT)**

| Figma token | Palette key | Value |
|---|---|---|
| `light_40` | `border.lines` | `#E1E5E9` |
| `light_30` | `border.subtle` | `#CBCED6` |
| `light_20` | `border.medium` | `#ADAFB7` |
| `light_10` | `border.strong` | `#777A83` |
| `magenta_default` | `border.primary` | `#C428DD` |
| `red` | `border.error` | `#D71616` |
| `magenta_gradient` | `border.primaryGradient` | gradient |

**Text (DT)**

| Figma token | Palette key | Value |
|---|---|---|
| `white` | `text.primary` | `#FFFFFF` |
| `gray_10` | `text.secondary` | `#A9B7C1` |
| `gray_00` | `text.labeled` | `#CAD0D8` |
| `gray_20` | `text.tertiary` | `#686C76` |
| `cyan_default` | `text.accent` | `#6AE8FA` |
| `cyan_pressed` | `text.accentHover` | `#2ABDD2` |
| `blue_light` | `text.progressStatus` | `#29B8F5` |

**Text (LT)**

| Figma token | Palette key | Value |
|---|---|---|
| `gray_60` | `text.primary` | `#0E131D` |
| `light_10` | `text.secondary` | `#777A83` |
| `light_00` | `text.labeled` | `#5B5E69` |
| `light_20` | `text.tertiary` | `#ADAFB7` |
| `magenta_default` | `text.accent` | `#C428DD` |
| `magenta_pressed` | `text.accentHover` | `#F47CFF` |
| `blue_dark` | `text.progressStatus` | `#006DD1` |

---

## Part 8 — Generate Design Token JSON Files

After palette files are finalized, generate `darkTheme.json` and `lightTheme.json`.

**Script:** `scripts/exportThemeTokens.js`

```js
import darkPalette from '../src/darkPalette.js';
import lightPalette from '../src/lightPalette.js';
import { writeFileSync } from 'fs';

function flattenTokens(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(acc, flattenTokens(v, path));
    else acc[path] = { value: v, type: inferType(path) };
    return acc;
  }, {});
}

function inferType(path) {
  if (path.startsWith('boxShadow.')) return 'shadow';
  return 'color';
}

writeFileSync('darkTheme.json',  JSON.stringify(flattenTokens(darkPalette),  null, 2));
writeFileSync('lightTheme.json', JSON.stringify(flattenTokens(lightPalette), null, 2));
console.log('✓ Theme token files written');
```

Add to `package.json`:
```json
"theme:check":  "node scripts/checkPaletteParity.js",
"theme:export": "node scripts/exportThemeTokens.js"
```

---

## Execution Order

1. **Part 2** — Fix value typos (non-breaking)
2. **Part 3** — Flatten palette files (pure refactor, no key changes)
3. **Part 4** — Add missing keys for parity; run `npm run theme:check` until clean
4. **Part 5 — Add new tokens** — Add all new semantic tokens to both palettes
5. **Part 7** — Rename internal constants (rename only; palette key structure unchanged)
6. **Part 1** — Fix `MainTheme.js` hardcodes using new tokens
7. **Part 5 — Fix misuse** — Replace misused tokens in component files (each file independently)
8. **Part 6** — Replace all hardcoded hex/rgba in component files; create `chartPalette.js`
9. **Part 8** — Generate `darkTheme.json` and `lightTheme.json`
10. **Verify zero hardcodes remain:**
    ```bash
    grep -rn --include="*.jsx" --include="*.js" \
      -E "(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))" \
      src/ \
      | grep -v "src/darkPalette\|src/lightPalette\|src/MainTheme\|chartPalette\|\.test\.\|\.stories\."
    ```
    Expected: zero results.

---

## Summary of New Palette Keys Added

Both palettes gain (same structure, values differ between themes):

```
background.codePreview
background.meterTrack
background.divider
background.flowEditor
background.tableRow.default
background.tableRow.hover
background.slider.track
background.contextHighlight      ← renamed from text.contextHighLight
background.surfaceOverlay
background.surfaceSubtle
background.dropTarget
background.errorHighlight
background.toolCardGradient      ← moved from border.toolCardGradient
background.listItem.default
background.button.split.default
background.button.split.hover
background.button.split.pressed
background.chatStarter.strong    ← new from changelog (iris_blue_40% LT / magenta 20% DT)
background.chatStarter.subtle    ← new from changelog (iris_blue_20% LT / magenta 10% DT)
text.accent                      ← new (cyan_default DT / magenta_default LT)
text.accentHover                 ← new (cyan_pressed DT / magenta_pressed LT)
text.progressStatus              ← new (blue_light DT / blue_dark LT)
text.labeled                     ← new (gray_00 DT / light_00 LT)
icon.fill.onPrimary
icon.fill.warning
text.alwaysWhite
text.disabled
text.interactiveTourCounter
boxShadow.dialog                 ← moved from hardcoded string in MainTheme.js
```

Keys removed from both palettes:

```
text.contextHighLight            → background.contextHighlight
border.toolCardGradient          → background.toolCardGradient
```

---

## Out of Scope

- Typography, spacing, or layout changes
- Any backend or SDK files
- Storybook story files (update after palette stabilizes)
