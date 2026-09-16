# Palette Refactor Plan: Two-Layer Architecture

## Overview

Migrate `darkPalette.js` / `lightPalette.js` from a flat, component-entangled palette to a clean two-layer
design:

- **Layer 1 `palette.*`** — semantic, purpose-based, reusable tokens. Anything used across more than one
  component context stays here.
- **Layer 2 `palette.components.*`** — per-entity bundles, scoped strictly to one UI component. A component
  gets a block here only when it needs more than the palette already provides.

**Rule**: `palette.components.button.background.primary.default` can only be used in the button component. A
generic hover tint used everywhere stays in `palette.action` or `palette.background.*`, not duplicated
per-component.

After each section migration: run `npm run theme:check` to verify parity.

---

## Status Legend

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done

---

## Section 1 — `icon.fill.button` and `icon.fill.stateButton` → `components.button.icon`

These two keys are scoped to button rendering only. They already live under `icon.fill.*` but reference a
specific component.

### Keys to move

| Current path                    | New path                                     | Dark value | Light value |
| ------------------------------- | -------------------------------------------- | ---------- | ----------- |
| `icon.fill.button`              | `components.button.icon.default`             | `white`    | `white`     |
| `icon.fill.stateButton.default` | `components.button.icon.stateButton.default` | `gray10`   | `light10`   |
| `icon.fill.stateButton.hover`   | `components.button.icon.stateButton.hover`   | `gray00`   | `light00`   |

### Consumer files to update

- `src/[fsd]/features/settings/ui/settings-drawer/SettingsDrawer.jsx` — `palette.icon.fill.stateButton.hover`
  and `palette.icon.fill.stateButton.default` → `palette.components.button.icon.stateButton.*`
- Run grep to find all usages of `icon\.fill\.button` and `icon\.fill\.stateButton`

### Migration steps

1. Add `components.button.icon` block in both palettes
2. Keep old keys temporarily (with `// DEPRECATED — use components.button.icon`) for smooth consumer migration
3. Update all consumers
4. Remove old keys
5. `npm run theme:check`

---

## Section 2 — `background.button.*` → `components.button.background`

The entire `background.button` subtree is exclusively consumed by button components.

### Keys to move

| Current path                          | New path                                         |
| ------------------------------------- | ------------------------------------------------ |
| `background.button.default`           | `components.button.background.default`           |
| `background.button.normal`            | `components.button.background.normal`            |
| `background.button.danger`            | `components.button.background.danger`            |
| `background.button.primary.*`         | `components.button.background.primary.*`         |
| `background.button.secondary.*`       | `components.button.background.secondary.*`       |
| `background.button.tertiary.*`        | `components.button.background.tertiary.*`        |
| `background.button.alarm.*`           | `components.button.background.alarm.*`           |
| `background.button.drawerMenu.*`      | `components.button.background.drawerMenu.*`      |
| `background.button.agentHub.*`        | `components.button.background.agentHub.*`        |
| `background.button.iconLabelButton.*` | `components.button.background.iconLabelButton.*` |
| `background.button.neutral.*`         | `components.button.background.neutral.*`         |
| `background.button.positive.*`        | `components.button.background.positive.*`        |
| `background.button.magicAssistant`    | `components.button.background.magicAssistant`    |
| `background.button.split.*`           | `components.button.background.split.*`           |
| `background.button.npsCard.*`         | `components.button.background.npsCard.*`         |

### Migration steps

1. Add `components.button.background` block in both palettes (copy structure from `background.button`)
2. Grep for all `palette.background.button` usages and update
3. Remove `background.button` from both palettes
4. `npm run theme:check`

---

## Section 3 — `text.button.*` → `components.button.text`

All `text.button.*` keys are button-scoped text colors.

### Keys to move

| Current path            | New path                           |
| ----------------------- | ---------------------------------- |
| `text.button.primary`   | `components.button.text.primary`   |
| `text.button.secondary` | `components.button.text.secondary` |
| `text.button.disabled`  | `components.button.text.disabled`  |
| `text.button.showMore`  | `components.button.text.showMore`  |
| `text.button.auxiliary` | `components.button.text.auxiliary` |

### Migration steps

1. Add `components.button.text` block in both palettes
2. Grep for `palette\.text\.button` usages and update
3. Remove `text.button` from both palettes
4. `npm run theme:check`

---

## Section 4 — `background.tabButton.*` + `text.tabButton.*` → `components.tabButton`

Tab button backgrounds and texts are scoped to a single tab-button component family.

### Keys to move

| Current path                    | New path                                   |
| ------------------------------- | ------------------------------------------ |
| `background.tabButton.default`  | `components.tabButton.background.default`  |
| `background.tabButton.hover`    | `components.tabButton.background.hover`    |
| `background.tabButton.active`   | `components.tabButton.background.active`   |
| `background.tabButton.disabled` | `components.tabButton.background.disabled` |
| `text.tabButton.default`        | `components.tabButton.text.default`        |
| `text.tabButton.hover`          | `components.tabButton.text.hover`          |
| `text.tabButton.active`         | `components.tabButton.text.active`         |
| `text.tabButton.disabled`       | `components.tabButton.text.disabled`       |

### Migration steps

1. Add `components.tabButton` block in both palettes
2. Grep for `palette\.background\.tabButton` and `palette\.text\.tabButton` usages and update
3. Remove old keys
4. `npm run theme:check`

---

## Section 5 — `background.tooltip.*` → `components.tooltip.background`

| Current path                 | New path                                |
| ---------------------------- | --------------------------------------- |
| `background.tooltip.default` | `components.tooltip.background.default` |
| `background.tooltip.code`    | `components.tooltip.background.code`    |

### Migration steps

1. Add `components.tooltip.background` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 6 — `background.tag.*` + `text.tag.*` → `components.tag`

| Current path              | New path                             |
| ------------------------- | ------------------------------------ |
| `background.tag.default`  | `components.tag.background.default`  |
| `background.tag.selected` | `components.tag.background.selected` |
| `text.tag.default`        | `components.tag.text.default`        |
| `text.tag.selected`       | `components.tag.text.selected`       |

### Migration steps

1. Add `components.tag` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 7 — `background.tagChip.*` + `text.tagChip.*` + `icon.tagChip.*` → `components.tagChip`

| Current path                        | New path                                       |
| ----------------------------------- | ---------------------------------------------- |
| `background.tagChip.default`        | `components.tagChip.background.default`        |
| `background.tagChip.hover`          | `components.tagChip.background.hover`          |
| `background.tagChip.active.default` | `components.tagChip.background.active.default` |
| `background.tagChip.active.hover`   | `components.tagChip.background.active.hover`   |
| `background.tagChip.disabled`       | `components.tagChip.background.disabled`       |
| `text.tagChip.default`              | `components.tagChip.text.default`              |
| `text.tagChip.active`               | `components.tagChip.text.active`               |
| `text.tagChip.disabled`             | `components.tagChip.text.disabled`             |
| `icon.tagChip.default`              | `components.tagChip.icon.default`              |
| `icon.tagChip.hover`                | `components.tagChip.icon.hover`                |
| `icon.tagChip.active`               | `components.tagChip.icon.active`               |
| `icon.tagChip.disabled`             | `components.tagChip.icon.disabled`             |

### Migration steps

1. Add `components.tagChip` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 8 — `background.participant.*` + `text.participant.*` → `components.participant`

| Current path                     | New path                                    |
| -------------------------------- | ------------------------------------------- |
| `background.participant.default` | `components.participant.background.default` |
| `background.participant.hover`   | `components.participant.background.hover`   |
| `background.participant.active`  | `components.participant.background.active`  |
| `background.participant.cover`   | `components.participant.background.cover`   |
| `text.participant.default`       | `components.participant.text.default`       |

### Migration steps

1. Add `components.participant` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 9 — `background.conversation.*` → `components.conversation.background`

| Current path                       | New path                                      |
| ---------------------------------- | --------------------------------------------- |
| `background.conversation.normal`   | `components.conversation.background.normal`   |
| `background.conversation.hover`    | `components.conversation.background.hover`    |
| `background.conversation.selected` | `components.conversation.background.selected` |

**Note:** `background.conversation.normal` is used in SettingsDrawer as a generic "transparent" background for
inactive menu items — audit carefully whether it's truly conversation-scoped or a shared concept.

### Migration steps

1. Audit all usages of `background.conversation.*`
2. If only used in conversation-list and settings-drawer with identical intent, move to
   `components.conversation.background`
3. Update consumers
4. Remove old keys
5. `npm run theme:check`

---

## Section 10 — `background.folder.*` → `components.folder.background`

| Current path                       | New path                               |
| ---------------------------------- | -------------------------------------- |
| `background.folder.default`        | `components.folder.background.default` |
| `background.folder.active`         | `components.folder.background.active`  |
| `background.folder.borderGradient` | `components.folder.border.gradient`    |
| `background.folder.borderHover`    | `components.folder.border.hover`       |
| `background.folder.borderActive`   | `components.folder.border.active`      |
| `background.folder.shadow`         | `components.folder.shadow`             |

### Migration steps

1. Add `components.folder` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 11 — `background.switch.*` → `components.switch.background`

| Current path                           | New path                                          |
| -------------------------------------- | ------------------------------------------------- |
| `background.switch.default.on.thumb`   | `components.switch.background.default.on.thumb`   |
| `background.switch.default.on.track`   | `components.switch.background.default.on.track`   |
| `background.switch.default.off.thumb`  | `components.switch.background.default.off.thumb`  |
| `background.switch.default.off.track`  | `components.switch.background.default.off.track`  |
| `background.switch.disabled.on.thumb`  | `components.switch.background.disabled.on.thumb`  |
| `background.switch.disabled.on.track`  | `components.switch.background.disabled.on.track`  |
| `background.switch.disabled.off.thumb` | `components.switch.background.disabled.off.thumb` |
| `background.switch.disabled.off.track` | `components.switch.background.disabled.off.track` |

### Migration steps

1. Add `components.switch.background` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 12 — `background.tab.*` → `components.tab.background`

| Current path              | New path                             |
| ------------------------- | ------------------------------------ |
| `background.tab.default`  | `components.tab.background.default`  |
| `background.tab.hover`    | `components.tab.background.hover`    |
| `background.tab.active`   | `components.tab.background.active`   |
| `background.tab.disabled` | `components.tab.background.disabled` |

### Migration steps

1. Add `components.tab.background` block
2. Update consumers (note: `background.tabs.default` is a different key — do not confuse with
   `background.tab`)
3. Remove old keys
4. `npm run theme:check`

---

## Section 13 — `background.dataGrid.*` → `components.dataGrid.background`

| Current path                       | New path                                      |
| ---------------------------------- | --------------------------------------------- |
| `background.dataGrid.main`         | `components.dataGrid.background.main`         |
| `background.dataGrid.secondary`    | `components.dataGrid.background.secondary`    |
| `background.dataGrid.row.selected` | `components.dataGrid.background.row.selected` |

### Migration steps

1. Add `components.dataGrid.background` block
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 14 — `text.input.*` + `text.select.*` → `components.input` / `components.select`

| Current path                      | New path                                     |
| --------------------------------- | -------------------------------------------- |
| `text.input.label`                | `components.input.text.label`                |
| `text.input.primary`              | `components.input.text.primary`              |
| `text.input.placeholder`          | `components.input.text.placeholder`          |
| `text.input.placeholderSecondary` | `components.input.text.placeholderSecondary` |
| `text.input.disabled`             | `components.input.text.disabled`             |
| `text.select.selected.primary`    | `components.select.text.selected.primary`    |
| `text.select.selected.secondary`  | `components.select.text.selected.secondary`  |

### Migration steps

1. Add `components.input.text` and `components.select.text` blocks
2. Update consumers
3. Remove old keys
4. `npm run theme:check`

---

## Section 15 — `step.*` → `components.step`

The `step` block is used exclusively in stepper/wizard UI components.

| Current path                | New path                               |
| --------------------------- | -------------------------------------- |
| `step.default.background`   | `components.step.default.background`   |
| `step.default.border`       | `components.step.default.border`       |
| `step.default.icon`         | `components.step.default.icon`         |
| `step.active.background`    | `components.step.active.background`    |
| `step.active.border`        | `components.step.active.border`        |
| `step.active.icon`          | `components.step.active.icon`          |
| `step.completed.background` | `components.step.completed.background` |
| `step.completed.border`     | `components.step.completed.border`     |
| `step.completed.icon`       | `components.step.completed.icon`       |

### Migration steps

1. Move `step` object into `components.step` in both palettes
2. Grep for `palette\.step` usages and update
3. Remove top-level `step` key
4. `npm run theme:check`

---

## Section 16 — `checkbox.*` → `components.checkbox`

| Current path         | New path                        |
| -------------------- | ------------------------------- |
| `checkbox.default`   | `components.checkbox.default`   |
| `checkbox.hover.on`  | `components.checkbox.hover.on`  |
| `checkbox.hover.off` | `components.checkbox.hover.off` |
| `checkbox.active`    | `components.checkbox.active`    |
| `checkbox.mark`      | `components.checkbox.mark`      |
| `checkbox.disabled`  | `components.checkbox.disabled`  |

### Migration steps

1. Move `checkbox` into `components.checkbox`
2. Update consumers
3. Remove top-level `checkbox` key
4. `npm run theme:check`

---

## Section 17 — `radio.*` → `components.radio`

| Current path      | New path                     |
| ----------------- | ---------------------------- |
| `radio.default`   | `components.radio.default`   |
| `radio.hover.off` | `components.radio.hover.off` |
| `radio.active`    | `components.radio.active`    |
| `radio.disabled`  | `components.radio.disabled`  |

### Migration steps

1. Move `radio` into `components.radio`
2. Update consumers
3. Remove top-level `radio` key
4. `npm run theme:check`

---

## Section 18 — `split.*` → `components.split`

| Current path          | New path                               |
| --------------------- | -------------------------------------- |
| `split.default`       | `components.split.background.default`  |
| `split.hover`         | `components.split.background.hover`    |
| `split.pressed`       | `components.split.background.pressed`  |
| `split.disabled`      | `components.split.background.disabled` |
| `split.text.default`  | `components.split.text.default`        |
| `split.text.pressed`  | `components.split.text.pressed`        |
| `split.text.disabled` | `components.split.text.disabled`       |

### Migration steps

1. Move `split` into `components.split`
2. Update consumers
3. Remove top-level `split` key
4. `npm run theme:check`

---

## Section 19 — `capability.*` → `components.capability`

| Current path                      | New path                                     |
| --------------------------------- | -------------------------------------------- |
| `capability.vision.background`    | `components.capability.vision.background`    |
| `capability.vision.icon`          | `components.capability.vision.icon`          |
| `capability.reasoning.background` | `components.capability.reasoning.background` |
| `capability.reasoning.icon`       | `components.capability.reasoning.icon`       |

### Migration steps

1. Move `capability` into `components.capability`
2. Update consumers
3. Remove top-level `capability` key
4. `npm run theme:check`

---

## Section 20 — `suggestionChip.*` → `components.suggestionChip`

| Current path                        | New path                                       |
| ----------------------------------- | ---------------------------------------------- |
| `suggestionChip.border`             | `components.suggestionChip.border`             |
| `suggestionChip.background.default` | `components.suggestionChip.background.default` |
| `suggestionChip.background.hover`   | `components.suggestionChip.background.hover`   |
| `suggestionChip.text.default`       | `components.suggestionChip.text.default`       |
| `suggestionChip.text.hover`         | `components.suggestionChip.text.hover`         |

### Migration steps

1. Move `suggestionChip` into `components.suggestionChip`
2. Update consumers
3. Remove top-level `suggestionChip` key
4. `npm run theme:check`

---

## Section 21 — `scrollbar.*` → `components.scrollbar`

| Current path           | New path                          |
| ---------------------- | --------------------------------- |
| `scrollbar.thumb`      | `components.scrollbar.thumb`      |
| `scrollbar.thumbHover` | `components.scrollbar.thumbHover` |

### Migration steps

1. Move `scrollbar` into `components.scrollbar`
2. Update consumers (likely global scrollbar style)
3. Remove top-level `scrollbar` key
4. `npm run theme:check`

---

## Keys That Stay in `palette.*` (No Move)

These are semantic, cross-component, or truly global tokens. They do NOT move to `components`.

| Key                                                | Reason                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| `mode`                                             | MUI required                                            |
| `primary.*`                                        | MUI required, used cross-component                      |
| `secondary.*`                                      | MUI required, used cross-component                      |
| `background.default.*`                             | Page/surface backgrounds — reused everywhere            |
| `background.card.*`                                | Generic card shell — used by many card variants         |
| `background.interactiveTourPrompt.*`               | One-off but cross-component tour overlay                |
| `background.resourceCard.*`                        | Themed card slots — multi-use                           |
| `background.categoriesButton.*`                    | Could be considered component-scoped, low priority      |
| `background.icon.*`                                | Background for icon container elements (generic)        |
| `background.select.*`                              | Dropdown/select state backgrounds — generic interactive |
| `background.tabs.default`                          | Active tab indicator — MUI Tabs integration             |
| `background.attention`                             | Semantic warning fill                                   |
| `background.text.highlight`                        | Text highlight                                          |
| `background.aiAnswerBkg`                           | Semantic AI chat surface                                |
| `background.aiParticipantIcon`                     | Semantic AI icon background                             |
| `background.aiAnswerActions`                       | Semantic AI gradient                                    |
| `background.userMessageActions`                    | Semantic user message gradient                          |
| `background.conversationStarters.*`                | Semantic conversation feature background                |
| `background.conversationEditor`                    | Semantic editing area                                   |
| `background.avatar`                                | Generic avatar fill                                     |
| `background.categoryHeader`                        | Semantic section header                                 |
| `background.notificationList`                      | Semantic notification panel                             |
| `background.highlightUserMessage`                  | Semantic message highlight                              |
| `background.tagEditor.*`                           | Could be component-scoped but low priority              |
| `background.showContextDialog`                     | Dialog background variant                               |
| `background.sideBar`                               | App-level sidebar gradient                              |
| `background.imageAttachment`                       | Semantic image overlay                                  |
| `background.agentModal.*`                          | Semantic themed dialog                                  |
| `background.toolCard.*`                            | Semantic tool card hover                                |
| `background.deprecated`                            | Semantic deprecation warning                            |
| `background.mcp.*`                                 | Semantic MCP state backgrounds                          |
| `background.onboarding`                            | Semantic onboarding surface                             |
| `background.welcome.*`                             | Semantic welcome gradient                               |
| `background.banner.*`                              | Semantic banner surface                                 |
| `background.settingsPage`                          | Semantic settings page fill                             |
| `background.chatContinueBackground`                | Semantic chat continue area                             |
| `background.aiProviderAccordion.*`                 | Semantic AI provider surface                            |
| `background.toolkitDetailLeftPanel` / `RightPanel` | Semantic panel fills                                    |
| `background.indexResult.*`                         | Semantic status backgrounds                             |
| `background.codePreview`                           | Semantic code surface                                   |
| `background.meterTrack`                            | Semantic progress track                                 |
| `background.divider`                               | Semantic divider (could become `border.divider`)        |
| `background.flowEditor`                            | Semantic canvas fill                                    |
| `background.tableRow.*`                            | Semantic table row states                               |
| `background.slider.track`                          | Semantic slider track                                   |
| `background.contextHighlight`                      | Semantic highlight                                      |
| `background.surfaceOverlay`                        | Semantic overlay                                        |
| `background.surfaceSubtle`                         | Semantic subtle surface                                 |
| `background.dropTarget`                            | Semantic drop target                                    |
| `background.errorHighlight`                        | Semantic error highlight                                |
| `background.toolCardGradient`                      | Semantic gradient                                       |
| `background.listItem.*`                            | Semantic list item                                      |
| `background.chatStarter.*`                         | Semantic chat feature                                   |
| `background.surface.*`                             | Generic MUI surface layers                              |
| `background.npsCard`                               | One-off NPS surface                                     |
| `background.tips.*`                                | Semantic tips background                                |
| `border.*`                                         | All border tokens — semantic, cross-component           |
| `boxShadow.*`                                      | All shadow tokens — semantic, cross-component           |
| `text.default` / `text.primary` / `text.secondary` | Core typography                                         |
| `text.tooltip`                                     | Semantic tooltip text                                   |
| `text.error`                                       | Semantic error text                                     |
| `text.groupedTitle.*`                              | Semantic section title                                  |
| `text.info`                                        | Semantic info text                                      |
| `text.tips`                                        | Semantic tips text                                      |
| `text.attention`                                   | Semantic attention text                                 |
| `text.metrics`                                     | Semantic metrics label                                  |
| `text.warningText`                                 | Semantic warning text                                   |
| `text.accent` / `text.accentHover`                 | Semantic accent text                                    |
| `text.progressStatus`                              | Semantic progress text                                  |
| `text.labeled`                                     | Semantic labeled text                                   |
| `text.disabled`                                    | Semantic disabled text                                  |
| `text.interactiveTourCounter`                      | One-off tour counter                                    |
| `text.deleteAlertEntityName` / `deleteAlertText`   | Semantic alert dialog text                              |
| `text.createButton`                                | Arguably component-scoped (low priority)                |
| `text.deprecated`                                  | Semantic deprecated text                                |
| `text.mcp.*`                                       | Semantic MCP state text                                 |
| `text.link` / `text.visitedLink`                   | Semantic link colors                                    |
| `text.highlighted`                                 | Semantic highlighted text                               |
| `text.indexResult.*`                               | Semantic status text                                    |
| `text.alwaysWhite` / `text.alwaysDark`             | Invariant tokens                                        |
| `text.npsCard.*`                                   | One-off NPS text                                        |
| `alert.*`                                          | Semantic alert tokens                                   |
| `icon.fill.default` through `icon.fill.onPrimary`  | Semantic icon fills — keep here                         |
| `icon.indexResult.*`                               | Semantic status icon fills                              |
| `status.*`                                         | Semantic entity status system                           |
| `warning.*`                                        | Semantic warning levels                                 |
| `nodeColors.*`                                     | Semantic pipeline node colors                           |
| `diff.*`                                           | Semantic diff colors                                    |
| `aiAssistant.*`                                    | Semantic AI assistant branding                          |

---

## Execution Order

Work through sections in order of impact (most consumers first, fewest last) to minimize mid-refactor broken
states:

1. **Section 1** — `icon.fill.button` / `stateButton` (few consumers, already found)
2. **Section 2** — `background.button.*` (many consumers, high value)
3. **Section 3** — `text.button.*` (related to buttons, do with Section 2)
4. **Section 4** — `background.tabButton.*` + `text.tabButton.*`
5. **Section 15** — `step.*` (top-level key removal)
6. **Section 16** — `checkbox.*`
7. **Section 17** — `radio.*`
8. **Section 5** — `background.tooltip.*`
9. **Section 6** — `background.tag.*` + `text.tag.*`
10. **Section 7** — `background.tagChip.*` + `text.tagChip.*` + `icon.tagChip.*`
11. **Section 8** — `background.participant.*` + `text.participant.*`
12. **Section 9** — `background.conversation.*`
13. **Section 10** — `background.folder.*`
14. **Section 11** — `background.switch.*`
15. **Section 12** — `background.tab.*`
16. **Section 13** — `background.dataGrid.*`
17. **Section 14** — `text.input.*` + `text.select.*`
18. **Section 18** — `split.*`
19. **Section 19** — `capability.*`
20. **Section 20** — `suggestionChip.*`
21. **Section 21** — `scrollbar.*`
22. **Section 22** — `background.categoriesButton.*` → `components.categoriesButton`
23. **Section 23** — `background.conversation{Editor,TopCover,BottomCover,Starters}` → extend
    `components.conversation`
24. **Section 24** — `background.tagEditor.*` → `components.tagEditor`
25. **Section 25** — `background.toolCard.*` + `background.toolCardGradient` → `components.toolCard`
26. **Section 26** — `background.chatContinueBackground` + `border.chatContinue` → `components.chatContinue`
27. **Section 27** — `background.aiProviderAccordion.*` + `border.aiProviderAccordion` →
    `components.aiProviderAccordion`
28. **Section 28** — `background.listItem.*` → `components.listItem`
29. **Section 29** — `background.chatStarter.*` → `components.chatStarter`
30. **Section 30** — `background.npsCard` + `border.npsCard` + `text.npsCard.*` → `components.npsCard`
31. **Section 31** — `border.userMessageEditor` → `components.userMessageEditor`
32. **Section 32** — `border.notificationItem` → `components.notificationItem`
33. **Section 33** — `border.cardsOutlines` + `border.cardsOutlinesGradient` → `components.cardsOutlines`
34. **Section 34** — `border.conversationItemDivider` + `border.highlightUserMessage` → extend
    `components.conversation`
35. **Section 35** — `border.flowNode` → `components.flowNode`
36. **Section 36** — `border.sidebarDivider` → `components.sidebar`
37. **Section 37** — `border.chatEditPlaceholderBorder` → `components.chatEditPlaceholder`
38. **Section 38** — `border.edit` → `components.editInline`
39. **Section 39** — `border.input` → extend `components.input`
40. **Section 40** — `border.chatInput.*` + `boxShadow.chatInput.*` → `components.chatInput`
41. **Section 41** — `boxShadow.tagEditorPaper` + `boxShadow.tag` → extend `components.tagEditor` /
    `components.tag`
42. **Section 42** — `text.createButton` → extend `components.button`
43. **Section 43** — `background.highlightUserMessage` + `border.highlightUserMessage` → extend
    `components.userMessage`

---

## Sections 22–43 Detail

### Section 22 — `background.categoriesButton.*` → `components.categoriesButton`

| Current path                                  | New path                                                 |
| --------------------------------------------- | -------------------------------------------------------- |
| `background.categoriesButton.selected.active` | `components.categoriesButton.background.selected.active` |
| `background.categoriesButton.selected.hover`  | `components.categoriesButton.background.selected.hover`  |

### Section 23 — conversation surface tokens → extend `components.conversation`

| Current path                              | New path                                                  |
| ----------------------------------------- | --------------------------------------------------------- |
| `background.conversationEditor`           | `components.conversation.background.editor`               |
| `background.conversationTopCover`         | `components.conversation.background.topCover`             |
| `background.conversationBottomCover`      | `components.conversation.background.bottomCover`          |
| `background.conversationStarters.default` | `components.conversation.background.starter.default`      |
| `background.conversationStarters.hover`   | `components.conversation.background.starter.hover`        |
| `background.highlightUserMessage`         | `components.conversation.background.highlightUserMessage` |
| `border.conversationItemDivider`          | `components.conversation.border.itemDivider`              |
| `border.highlightUserMessage`             | `components.conversation.border.highlightUserMessage`     |

### Section 24 — `background.tagEditor.*` + `boxShadow.tagEditorPaper` → `components.tagEditor`

| Current path               | New path                              |
| -------------------------- | ------------------------------------- |
| `background.tagEditor.tag` | `components.tagEditor.background.tag` |
| `boxShadow.tagEditorPaper` | `components.tagEditor.shadow`         |

### Section 25 — `background.toolCard.*` + `background.toolCardGradient` → `components.toolCard`

| Current path                  | New path                                  |
| ----------------------------- | ----------------------------------------- |
| `background.toolCard.hover`   | `components.toolCard.background.hover`    |
| `background.toolCardGradient` | `components.toolCard.background.gradient` |

### Section 26 — chat continue tokens → `components.chatContinue`

| Current path                        | New path                             |
| ----------------------------------- | ------------------------------------ |
| `background.chatContinueBackground` | `components.chatContinue.background` |
| `border.chatContinue`               | `components.chatContinue.border`     |

### Section 27 — AI provider accordion tokens → `components.aiProviderAccordion`

| Current path                             | New path                                            |
| ---------------------------------------- | --------------------------------------------------- |
| `background.aiProviderAccordion.default` | `components.aiProviderAccordion.background.default` |
| `background.aiProviderAccordion.hover`   | `components.aiProviderAccordion.background.hover`   |
| `border.aiProviderAccordion`             | `components.aiProviderAccordion.border`             |

### Section 28 — `background.listItem.*` → `components.listItem`

| Current path                  | New path                                 |
| ----------------------------- | ---------------------------------------- |
| `background.listItem.default` | `components.listItem.background.default` |

### Section 29 — `background.chatStarter.*` → `components.chatStarter`

| Current path                    | New path                                   |
| ------------------------------- | ------------------------------------------ |
| `background.chatStarter.strong` | `components.chatStarter.background.strong` |
| `background.chatStarter.subtle` | `components.chatStarter.background.subtle` |

### Section 30 — NPS card tokens → `components.npsCard`

| Current path               | New path                              |
| -------------------------- | ------------------------------------- |
| `background.npsCard`       | `components.npsCard.background`       |
| `border.npsCard`           | `components.npsCard.border`           |
| `text.npsCard.label`       | `components.npsCard.text.label`       |
| `text.npsCard.placeholder` | `components.npsCard.text.placeholder` |

### Section 31 — `border.userMessageEditor` → `components.userMessageEditor`

| Current path               | New path                              |
| -------------------------- | ------------------------------------- |
| `border.userMessageEditor` | `components.userMessageEditor.border` |

### Section 32 — `border.notificationItem` → `components.notificationItem`

| Current path              | New path                             |
| ------------------------- | ------------------------------------ |
| `border.notificationItem` | `components.notificationItem.border` |

### Section 33 — `border.cardsOutlines.*` → `components.cardsOutlines`

| Current path                   | New path                                  |
| ------------------------------ | ----------------------------------------- |
| `border.cardsOutlines`         | `components.cardsOutlines.border`         |
| `border.cardsOutlinesGradient` | `components.cardsOutlines.borderGradient` |

### Section 34 — Already merged into Section 23 above.

### Section 35 — `border.flowNode` → `components.flowNode`

| Current path      | New path                     |
| ----------------- | ---------------------------- |
| `border.flowNode` | `components.flowNode.border` |

### Section 36 — `border.sidebarDivider` → `components.sidebar`

| Current path            | New path                     |
| ----------------------- | ---------------------------- |
| `border.sidebarDivider` | `components.sidebar.divider` |

### Section 37 — `border.chatEditPlaceholderBorder` → `components.chatEditPlaceholder`

| Current path                       | New path                                |
| ---------------------------------- | --------------------------------------- |
| `border.chatEditPlaceholderBorder` | `components.chatEditPlaceholder.border` |

### Section 38 — `border.edit` → `components.editInline`

| Current path  | New path                       |
| ------------- | ------------------------------ |
| `border.edit` | `components.editInline.border` |

### Section 39 — `border.input` → extend `components.input`

| Current path   | New path                  |
| -------------- | ------------------------- |
| `border.input` | `components.input.border` |

### Section 40 — chat input tokens → `components.chatInput`

| Current path                    | New path                                |
| ------------------------------- | --------------------------------------- |
| `border.chatInput.base`         | `components.chatInput.border.base`      |
| `border.chatInput.glow`         | `components.chatInput.border.glow`      |
| `boxShadow.chatInput.default`   | `components.chatInput.shadow.default`   |
| `boxShadow.chatInput.recording` | `components.chatInput.shadow.recording` |

### Section 41 — `boxShadow.tag` → extend `components.tag`

| Current path    | New path                |
| --------------- | ----------------------- |
| `boxShadow.tag` | `components.tag.shadow` |

### Section 42 — `text.createButton` → extend `components.button`

| Current path        | New path                        |
| ------------------- | ------------------------------- |
| `text.createButton` | `components.button.text.create` |

---

## Palette Structure After Migration

```js
export default {
  mode: '...',
  primary: {...},
  secondary: {...},

  // Semantic, reusable tokens
  background: { /* page & surface backgrounds, semantic states */ },
  border: { /* all border tokens */ },
  boxShadow: { /* all shadow tokens */ },
  text: { /* semantic text colors: default, primary, secondary, error, accent... */ },
  alert: { /* semantic alert tokens */ },
  icon: {
    main: '...',
    fill: { /* semantic fills: default, disabled, success, error, attention... */ },
    indexResult: { /* semantic status fills */ },
  },
  status: { /* entity publish/moderation status */ },
  warning: { /* semantic warning levels */ },
  nodeColors: { /* pipeline node type colors */ },
  diff: { /* code diff colors */ },
  aiAssistant: { /* AI assistant branding */ },

  // Per-component bundles
  components: {
    button: {
      background: { primary, secondary, tertiary, alarm, neutral, positive, ... },
      text: { primary, secondary, disabled, showMore, auxiliary },
      icon: { default, stateButton: { default, hover } },
    },
    tabButton: {
      background: { default, hover, active, disabled },
      text: { default, hover, active, disabled },
    },
    tab: {
      background: { default, hover, active, disabled },
    },
    tooltip: {
      background: { default, code },
    },
    tag: {
      background: { default, selected },
      text: { default, selected },
    },
    tagChip: {
      background: { default, hover, active, disabled },
      text: { default, active, disabled },
      icon: { default, hover, active, disabled },
    },
    participant: {
      background: { default, hover, active, cover },
      text: { default },
    },
    conversation: {
      background: { normal, hover, selected },
    },
    folder: {
      background: { default, active },
      border: { gradient, hover, active },
      shadow: '...',
    },
    switch: {
      background: { default: { on, off }, disabled: { on, off } },
    },
    dataGrid: {
      background: { main, secondary, row },
    },
    input: {
      text: { label, primary, placeholder, placeholderSecondary, disabled },
    },
    select: {
      text: { selected: { primary, secondary } },
    },
    step: {
      default: { background, border, icon },
      active: { background, border, icon },
      completed: { background, border, icon },
    },
    checkbox: { default, hover, active, mark, disabled },
    radio: { default, hover, active, disabled },
    split: {
      background: { default, hover, pressed, disabled },
      text: { default, pressed, disabled },
    },
    capability: {
      vision: { background, icon },
      reasoning: { background, icon },
    },
    suggestionChip: {
      border: '...',
      background: { default, hover },
      text: { default, hover },
    },
    scrollbar: { thumb, thumbHover },
  },
};
```
