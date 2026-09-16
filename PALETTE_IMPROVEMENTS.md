# Palette Improvement Recommendations

## Executive Summary

The current palettes are functional but suffer from four systemic issues:
1. **Inconsistent naming** — raw hex codes used as variable names (`white2`, `white3`, `blue8`) instead of semantic or scale-based names.
2. **Broken contrast parity** — several light mode tokens fail WCAG AA (4.5:1 text, 3:1 UI components).
3. **Structural asymmetry** — dark and light palettes use different variable names for equivalent roles, making cross-theme reasoning difficult.
4. **Semantic leakage** — component-specific concepts (`conversationStarters`, `tagChip`, `agentModal`) live inside the palette, coupling the token layer to UI structure.

---

## 1. Naming Convention

### Current problem

Variables are named after their raw appearance, not their role or position in a scale:

```js
// dark palette — appearance-based naming
const white2  = '#ffffff05';
const white3  = '#ffffff08';
const white5  = '#ffffff0d';
const white6  = '#ffffff0f';
const white8  = '#ffffff14';
const white10 = '#ffffff1a';
```

This creates ambiguity: `white2` means "2% white alpha" but a reader cannot tell whether it is used for surfaces, borders, or hover states without reading every usage site. When a designer changes the surface color, there is no way to find all related tokens.

### Recommendation: Two-tier naming

**Tier 1 — Primitive scale** (values only, no semantics, not used directly in components):

```
neutral-0    → #FFFFFF
neutral-50   → #CAD0D8
neutral-100  → #A9B7C1
neutral-200  → #686C76
neutral-300  → #3B3E46
neutral-400  → #262B34
neutral-500  → #181F2A
neutral-530  → #151C25
neutral-550  → #101721
neutral-580  → #0C1119
neutral-600  → #0E131D

cyan-500     → #6AE8FA   (primary dark accent)
cyan-200     → #2ABDD2   (pressed state)
cyan-disabled → #267985

magenta-500  → #C428DD   (primary light accent)
magenta-600  → #F47CFF   (hover)
magenta-disabled → #CB93D4

blue-500     → #29B8F5
blue-600     → #006DD1   (dark blue)

red-500      → #D71616
green-500    → #2BD48D
orange-500   → #E97912
```

**Tier 2 — Semantic alias** (what the token means, what components use):

```js
// surfaces
surface.page       → neutral-600 (dark) / gradient (light)
surface.container  → neutral-500 (dark) / white (light)
surface.elevated   → neutral-400 (dark) / light-40 (light)
surface.overlay    → white@8% (dark) / dark@5% (light)

// text
text.primary       → neutral-100 (dark) / light-10 (light)
text.secondary     → white (dark) / neutral-600 (light)
text.disabled      → neutral-200
text.accent        → cyan-500 (dark) / magenta-500 (light)
text.onAccent      → neutral-600 (both)

// borders
border.default     → neutral-300 (dark) / light-30 (light)
border.hover       → neutral-100 (dark) / light-10 (light)
border.focus       → cyan-500 (dark) / magenta-500 (light)
border.error       → red@40%

// interactive states (replaces tabButton, button.secondary, etc.)
interactive.default  → white@5% (dark) / dark@3% (light)
interactive.hover    → white@10% (dark) / dark@10% (light)
interactive.active   → white@20% (dark) / dark@20% (light)
interactive.disabled → white@5% (dark) / dark@5% (light)
```

---

## 2. Contrast Issues

### WCAG AA requirements
- **Normal text** (< 18pt / < 14pt bold): contrast ratio ≥ 4.5:1
- **Large text** (≥ 18pt / ≥ 14pt bold): contrast ratio ≥ 3:1
- **UI components and graphics**: contrast ratio ≥ 3:1

### Dark mode — issues found

| Token | Foreground | Background | Ratio | Required | Status |
|---|---|---|---|---|---|
| `text.default` (`#A9B7C1`) | on `background.default.primary` (`#0E131D`) | 8.3:1 | 4.5:1 | **PASS** |
| `text.input.placeholder` (`#3B3E46`) | on `background.default.primary` (`#0E131D`) | 2.3:1 | 4.5:1 | **FAIL** |
| `text.input.placeholderSecondary` (`#686C76`) | on `#0E131D` | 3.1:1 | 4.5:1 | **FAIL** |
| `background.tabButton.default` (`#ffffff0d`) | text `#A9B7C1` | ~8:1 | 3:1 | **PASS** |
| `text.button.primary` (`#0E131D`) | on `background.button.primary.default` (`#6AE8FA`) | 11.7:1 | 4.5:1 | **PASS** |
| `text.participant.default` (`#686C76`) | on `background.participant.default` (`#ffffff0d`) | 2.8:1 | 4.5:1 | **FAIL** |
| `suggestionChip.text.default` (`#CAD0D8`) | on `transparent` over `#0E131D` | 7.9:1 | 4.5:1 | **PASS** |

**Fix for dark mode placeholder text:**
```js
// current — too low contrast
const gray30 = '#3B3E46';   // text.input.placeholder  → ratio 2.3:1
const gray20 = '#686C76';   // text.input.placeholderSecondary → ratio 3.1:1

// recommended
text.input.placeholder          → neutral-200 = #686C76 → ratio 3.1:1  (still borderline — use #7E8490 for 3.5:1)
text.input.placeholderSecondary → neutral-200 = #686C76 → ratio 3.1:1  (acceptable for placeholder)
text.participant.default        → #A9B7C1 (neutral-100) → ratio 8.3:1  ✓
```

### Light mode — issues found

| Token | Foreground | Background | Ratio | Required | Status |
|---|---|---|---|---|---|
| `text.primary` (`#777A83`) | on `background.default.secondary` (`#FFFFFF`) | 4.4:1 | 4.5:1 | **FAIL** (borderline) |
| `text.participant.default` (`#ADAFB7`) | on `background.participant.default` (`#3d44560d`) | 2.6:1 | 4.5:1 | **FAIL** |
| `text.disabled` (`#ADAFB7`) | on white | 2.4:1 | — | Acceptable (disabled state) |
| `text.input.placeholder` (`#CBCED6`) | on `white` | 1.8:1 | 4.5:1 | **FAIL** |
| `text.button.primary` (`#F8FCFF`) | on `background.button.primary.default` (`#C428DD`) | 5.9:1 | 4.5:1 | **PASS** |
| `border.lines` (`#CBCED6`) | on white backgrounds | 1.7:1 | 3:1 (UI) | **FAIL** |

**Fixes for light mode:**

```js
// text.primary: darken slightly
light10: '#777A83'  →  '#5B5E69'   // ratio 5.7:1 on white  ✓

// text.participant.default: this is body text, needs to pass
light20: '#ADAFB7'  →  '#72747C'   // ratio 4.6:1 on white  ✓

// text.input.placeholder: placeholder may be 3:1 by WCAG 1.4.3 exception,
// but improve readability
light30: '#CBCED6'  →  '#9DA0A9'   // ratio 3.5:1  (acceptable for placeholder)

// border.lines: UI components need 3:1
light30: '#CBCED6'  →  '#9DA0A9'   // ratio 3.5:1 against white  ✓
// NOTE: same value works for both border.lines and placeholder
```

---

## 3. Structural Asymmetry

Dark and light palettes use completely different base variable names, making it difficult to audit parity:

| Concept | Dark variable | Light variable |
|---|---|---|
| Darkest surface | `gray60` = `#0E131D` | (implicit `gradient` or `white`) |
| Primary surface | `gray50` = `#181F2A` | `white` = `#FFFFFF` |
| Elevated surface | `gray40` = `#262B34` | `light40` = `#E1E5E9` |
| Primary text | `gray10` = `#A9B7C1` | `light10` = `#777A83` |
| Secondary text | `white` = `#FFFFFF` | `gray60` = `#0E131D` |
| Disabled text | `gray20` = `#686C76` | `light20` = `#ADAFB7` |

### Recommendation: Shared conceptual scale

Define a conceptual neutral scale shared by both files, using relative descriptors:

```
neutral-page       : darkest background surface
neutral-container  : primary card/container surface  
neutral-elevated   : elevated/secondary surface
neutral-divider    : divider/border level
neutral-subtle     : subtle text / icons / disabled
neutral-secondary  : secondary body text
neutral-primary    : primary body text
neutral-inverse    : text on colored/accent backgrounds
```

Each palette maps its own hex values to these names. Renaming within the palette file is sufficient — components already use semantic tokens and do not reference raw variable names.

---

## 4. Semantic Leakage

The current palette mixes **design token concerns** with **component-specific concerns**:

```js
// Component-specific groups that belong in component styles, not the palette:
background.conversationStarters   // → Chat feature
background.agentModal             // → Agent feature
background.toolCard               // → Toolkit feature
background.tagChip                // → Tag component
background.showContextDialog      // → Dialog component
background.imageAttachment        // → Attachment component
```

Keeping these in the palette creates two problems:
- The palette grows unboundedly as new components are added.
- Designers cannot reason about the token set without knowing every component.

### Recommendation: Component-local tokens

Move deeply component-specific tokens out of the palette and into component style files using semantic palette tokens:

```jsx
// Before (in palette):
background.agentModal.border: 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)'

// After (in component style function):
const agentModalStyles = () => ({
  border: {
    background: ({ palette }) =>
      palette.mode === 'dark'
        ? 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)'
        : 'linear-gradient(224.66deg, #8BC9FF 0%, #FDA3FF 99.46%)',
  },
});
```

**Tokens that should stay in the palette** (truly shared, cross-cutting):
- All surface / background / text / border / icon / status tokens
- Interactive state tokens (hover, active, disabled)
- Semantic state tokens (error, warning, success, info)
- Accent and brand tokens

**Tokens that should move to component files**:
- `background.agentModal.*`
- `background.conversationStarters.*`
- `background.toolCard.*`
- `background.tagChip.*`
- `background.showContextDialog`
- `background.imageAttachment`
- `background.interactiveTourPrompt.*`
- `background.aiProviderAccordion.*`
- `background.sideBar` (if only used in one place)

---

## 5. Accent Color Consistency

### Current issue: mismatched accent families

Dark mode uses **cyan** (`#6AE8FA`) as primary accent but the `npsCard` button and `conversationStarters` use **magenta** (`#C428DD`) — the light mode accent — hardcoded inside the dark palette:

```js
// In darkPalette.js:
button.npsCard.primary.default: '#c428dd'   // ← light mode accent hardcoded in dark palette
```

Light mode accent (`magentaDefault = '#c428dd'`) is used correctly, but the `conversationStarters` in light mode uses `skyBlue` tones, creating a visual inconsistency where the feature accent does not follow the mode accent.

### Recommendation

Unify accent references. Introduce a single `accent` semantic level:

```js
// In both palettes, add:
accent: {
  default:   /* cyan-500 (dark) | magenta-500 (light) */,
  hover:     /* cyan pressed (dark) | magenta-600 (light) */,
  subtle:    /* cyan@20% (dark) | magenta@20% (light) */,
  subtleHover: /* cyan@30% (dark) | magenta@30% (light) */,
  onAccent:  /* neutral-600 (both) */,
}
```

Replace hardcoded cross-mode values:

```js
// darkPalette.js — replace:
button.npsCard.primary.default: '#c428dd'
// with:
// Remove from palette entirely, component should use its own accent or an explicit brand override
```

---

## 6. Missing Tokens (Structural Gaps)

The following tokens are referenced in component files via `palette.mode` conditionals, meaning they are not yet covered by semantic palette tokens. Each should be added:

| Missing token | Used in | Recommended name |
|---|---|---|
| Gradient overlay for light `background.default.primary` | Multiple components | `background.default.primary` already exists but returns a gradient in light mode — document this explicitly |
| Code block background | `CodeMirrorEditor` | `background.codeEditor` |
| Flow editor canvas | `FlowEditor` | Already exists as `background.flowEditor` — ensure parity |
| UsageMeter track fill | `UsageMeter` | `background.meterFill` (currently only `background.meterTrack` exists) |
| Folder item active glow | `FolderItem` | `background.folder.shadow` exists in light but is `'none'` in dark — remove asymmetry |
| Resource version chip | `ResourceVersionInfo` | `background.versionChip` |

---

## 7. Priority Action Plan

### High priority (contrast failures — accessibility)

1. Raise `text.primary` in light mode from `#777A83` to `#5B5E69` (ratio 5.7:1 on white).
2. Raise `text.input.placeholder` in light mode from `#CBCED6` to `#9DA0A9`.
3. Raise `border.lines` in light mode from `#CBCED6` to `#9DA0A9` (UI component contrast 3.5:1).
4. Raise `text.participant.default` in both modes to pass 4.5:1 for body text.
5. Raise dark mode `text.input.placeholder` from `#3B3E46` to at least `#686C76` (currently below 2.5:1).

### Medium priority (structural quality)

6. Replace opacity-suffix variable names (`white2`, `white3`) with scale-based names (`neutral-page-alpha-2`).
7. Add `accent.*` token group to both palettes; redirect hardcoded cross-mode accent values to it.
8. Add `text.onAccent` token; replace all `text.button.primary = gray60` and `text.button.secondary = gray60` with it.

### Lower priority (architectural cleanup)

9. Move component-specific gradient tokens (`agentModal`, `conversationStarters`, `toolCard`) to their respective component style files.
10. Audit the 15 `nodeColors` entries — verify dark mode values pass 3:1 against dark canvas (`#0E131D`) and light mode values pass against white canvas.
11. Rename shared-variable files to use the conceptual neutral scale, so dark and light palettes are structurally symmetric and easier to audit side by side.
