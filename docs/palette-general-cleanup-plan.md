# Palette General Section Cleanup Plan

## Goal

Move component-specific keys out of the general palette sections (`background`, `border`, `text`) into
`palette.components.*`. General sections should only contain truly semantic/reusable tokens.

## Also Remove (zero usages — dead keys)

| Key                           | Section    |
| ----------------------------- | ---------- |
| `background.categoryHeader`   | background |
| `background.surfaceOverlay`   | background |
| `background.surfaceSubtle`    | background |
| `background.dropTarget`       | background |
| `background.errorHighlight`   | background |
| `border.reindexInfoContainer` | border     |
| `text.accentHover`            | text       |
| `text.progressStatus`         | text       |
| `text.labeled`                | text       |

## Section 1: background → components

| Old path                             | New path                                    | Consumer count |
| ------------------------------------ | ------------------------------------------- | -------------- |
| `background.select`                  | `components.select`                         | 10+            |
| `background.tabs`                    | `components.tabs`                           | 2              |
| `background.tableRow.default`        | `components.tableRow.background.default`    | 5              |
| `background.tableRow.hover`          | `components.tableRow.background.hover`      | 2              |
| `background.slider.track`            | `components.slider.track`                   | 2              |
| `background.aiAnswerBkg`             | `components.aiAnswer.background`            | 5              |
| `background.aiAnswerActions`         | `components.aiAnswer.actionsGradient`       | 2              |
| `background.userMessageActions`      | `components.userMessage.actionsGradient`    | 2              |
| `background.meterTrack`              | `components.usageMeter.trackBackground`     | 2              |
| `background.notificationList`        | `components.notificationList.background`    | 2              |
| `background.sideBar`                 | `components.sidebar.background`             | 1              |
| `background.imageAttachment`         | `components.imageAttachment.background`     | 1              |
| `background.showContextDialog`       | `components.contextDialog.background`       | 2              |
| `background.agentModal`              | `components.agentModal`                     | 4+             |
| `background.deprecated`              | `components.deprecated.background`          | 1              |
| `background.settingsPage`            | `components.settingsPage.background`        | 2              |
| `background.toolkitDetailLeftPanel`  | `components.toolkitDetail.background.left`  | 2              |
| `background.toolkitDetailRightPanel` | `components.toolkitDetail.background.right` | 4              |
| `background.codePreview`             | `components.codePreview.background`         | 5              |
| `background.flowEditor`              | `components.flowEditor.background`          | 1              |
| `background.contextHighlight`        | `components.contextHighlight.background`    | 2              |
| `background.aiParticipantIcon`       | `components.aiParticipantIcon.background`   | 3              |
| `background.divider`                 | `components.chatSubmenu.dividerBackground`  | 1              |
| `background.mcp`                     | `components.mcp.background`                 | 3              |
| `background.onboardingBody`          | `components.onboarding.bodyBackground`      | 3              |
| `background.onboarding`              | `components.onboarding.background`          | 1              |
| `background.welcome`                 | `components.welcome.background`             | 5              |
| `background.banner`                  | `components.banner`                         | 2              |
| `background.interactiveTourPrompt`   | `components.interactiveTour`                | 7              |
| `background.resourceCard`            | `components.resourceCard.background`        | 3              |
| `background.icon`                    | `components.entityIcon.background`          | 5              |
| `background.text.highlight`          | `components.highlightQuery.background`      | 1              |
| `background.indexResult`             | `components.indexResult.background`         | 5              |
| `background.tips`                    | `components.tips.background`                | 5              |

## Section 2: border → components

| Old path                   | New path                                   | Consumer count |
| -------------------------- | ------------------------------------------ | -------------- |
| `border.table`             | `components.table.border`                  | 15+            |
| `border.mcp`               | `components.mcp.border`                    | 3              |
| `border.indexResult`       | `components.indexResult.border`            | 5              |
| `border.category.selected` | `components.split.border.categorySelected` | 2              |

## Section 3: text → components

| Old path                      | New path                                 | Consumer count |
| ----------------------------- | ---------------------------------------- | -------------- |
| `text.tooltip`                | `components.tooltip.text.default`        | 5              |
| `text.groupedTitle.default`   | `components.categorySection.text.title`  | 1              |
| `text.mcp`                    | `components.mcp.text`                    | 5              |
| `text.indexResult`            | `components.indexResult.text`            | 5              |
| `text.deprecated`             | `components.deprecated.text`             | 1              |
| `text.interactiveTourCounter` | `components.interactiveTour.text`        | 1              |
| `text.deleteAlertEntityName`  | `components.deleteAlert.text.entityName` | 2              |
| `text.deleteAlertText`        | `components.deleteAlert.text.body`       | 1              |

## Keys That Stay in General Sections

### background (stays)

- `warningBkg`, `wrongBkg`, `errorBkg` — semantic error/status states
- `warning`, `warning40`, `warning8` — semantic warning colors
- `card.*` — generic card primitive
- `surface.*` — layout/surface tokens
- `default.*` — page-level background variants
- `attention` — semantic alert state
- `avatar` — used by MUI Avatar theme override
- `aiParticipantIcon` → moved
- `indexResult.*` → moved to components
- `tips.*` → moved to components
- `icon.*` (background.icon group) → moved to components.entityIcon.background

### border (stays)

- `lines`, `hover`, `inputHover` — generic semantic tokens
- `tips`, `attention`, `error` — semantic status tokens

### text (stays)

- `default`, `primary`, `secondary`, `error`, `info`, `tips`, `attention`
- `metrics`, `warningText`, `accent`, `disabled`, `highlighted`
- `link`, `visitedLink`, `alwaysWhite`, `alwaysDark`

## Implementation Steps

1. Run Python script to rename all consumer files (all sections at once)
2. Update `darkPalette.js` — remove old keys, add new `components.*` entries
3. Update `lightPalette.js` — same
4. Run `npm run theme:check` to verify parity
5. Run `npm run test` to verify no regressions
