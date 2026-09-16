# Palette Components Token Misuse — Round 2

Remaining cross-component violations from the full audit, grouped by resolution strategy.
Execute in order: Renames → Reroutes → Promotions → Keeps (no action).

---

## Strategy Legend

- **Rename** — rename the token namespace in both palettes + update all consumers so the namespace matches the canonical file
- **Reroute** — redirect consumers to an already-existing correct general token (no palette change)
- **Promote** — move token out of `components.*` into general `palette.*` (value is cross-cutting, not single-component)
- **Keep** — intentional cross-domain use; coupling is semantically justified

---

## Group 1 — Namespace Renames (palette edits + consumer updates)

### R1: `tabButton` → `tabGroupButton`
`TabGroupButton.jsx` lives in `tab-group-button/`; namespace should match.
Consumers (3 files, 3 with violations):
- `src/[fsd]/shared/ui/tab-group-button/TabGroupButton.jsx` (becomes canonical)
- `src/components/ToggleButton.jsx`
- `src/components/GroupedButton.jsx`
Also `src/MainTheme.js` references `tabButton` — update there too.

### R2: `npsCard` → `npsSurvey`
All 3 consumers are in `nps-survey/`; namespace should match the directory.
Consumers (3 files):
- `src/[fsd]/widgets/nps-survey/ui/NpsSurveyCard.jsx`
- `src/[fsd]/widgets/nps-survey/ui/NpsSurveyThankYou.jsx`
- `src/[fsd]/widgets/nps-survey/ui/TextQuestion.jsx`

### R3: `flowNode` → `flowEditor`
9 consumers all in `flow-editor/`; `FlowEditor.jsx` already has a `flowEditor` namespace making it canonical.
Consumers (9 files, all in `flow-editor/`):
- `FlowEditor.jsx`, `NodeCard.jsx`, `NodeCardHeader.jsx`, `CustomEdge.jsx`, `CustomHandle.jsx`,
  `EndNode.jsx`, `VariablesMappingItem.jsx`, `RunStateDialog.jsx`, `StateDrawer.jsx`

### R4: `chatInput` → `userInput`
Single consumer `UserInput.jsx` — namespace should match filename.
Consumer (1 file):
- `src/ComponentsLib/Chat/UserInput.jsx`

### R5: `chatEditPlaceholder` → `editingPlaceholder`
Single consumer `EditingPlaceholder.jsx`.
Consumer (1 file):
- `src/components/Chat/EditingPlaceholder.jsx`

### R6: `tagChip` → `styledChip`
Single consumer `StyledChip.jsx`.
Consumer (1 file):
- `src/components/DataDisplay/StyledChip.jsx`

### R7: `tag` → `categoryTag`
Both consumers are category UI; rename to match semantic usage.
Consumers (2 files):
- `src/[fsd]/shared/ui/category/CategoryRail.jsx`
- `src/[fsd]/shared/ui/filter/CategoryFilter.jsx`

### R8: `toolkitDetail` → `indexDetail`
6 consumers all in `toolkits/` feature; rename to match the index detail panel context.
Consumers (6 files):
- `IndexesPanel.jsx`, `IndexDetailsFooterBand.jsx`, `IndexDetailsLeftBand.jsx`,
  `IndexDetailsTabsBand.jsx`, `RunIndexPanel.jsx`, `ToolkitForm.jsx`

### R9: `indexResult` → `runIndexBanner`
Single consumer `RunIndexBanner.jsx`.
Consumer (1 file):
- `src/[fsd]/features/toolkits/indexes/ui/RunIndexBanner.jsx`

### R10: `step` → `publishWizardStep`
Single consumer `PublishWizardModal.jsx`; token describes the wizard step indicator.
Consumer (1 file):
- `src/[fsd]/entities/version/ui/PublishWizardModal.jsx`

### R11: `detailPanel` → `codePreview`
5 consumers all render code/content preview panels; rename to match.
Consumers (5 files):
- `MdxPreview.jsx`, `PreviewContent.jsx`, `PreviewDocument.jsx`,
  `CodePreviewContent.jsx`, `CasesPanel.jsx`

### R12: `cardsOutlines` → `card` (merge subkey)
Single consumer `cardStyles.js`; token belongs under the existing `card` namespace.
In palettes: rename `components.cardsOutlines.borderGradient` → `components.card.borderGradient`
Consumer (1 file):
- `src/utils/cardStyles.js`

### R13: `radio` → merge into `checkbox`
`BaseCheckbox.jsx` handles both checkbox and radio (MUI pattern); merge radio tokens under `checkbox`.
In palettes: rename `components.radio.*` keys to `components.checkbox.radio.*`
Consumer (1 file):
- `src/[fsd]/shared/ui/checkbox/BaseCheckbox.jsx`

---

## Group 2 — Reroutes to existing general tokens (consumer-only changes)

### V1: `accordion.background.*` in evaluation widgets → `background.interactiveItem.hover/active`
Files (3):
- `DimensionCard.jsx` — `accordion.background.hover` → `background.interactiveItem.hover`
- `ManageDimensionCard.jsx` — same
- `BuildDimensionWithAiModal.jsx` — same; `accordion.background.default` → `background.interactiveItem.default` or `background.default.secondary`

### V2: `banner.border` in MaintenaceTipsContainer → `border.lines`
File (1):
- `src/[fsd]/features/maintenance/ui/MaintenaceTipsContainer.jsx`

### V3: `button.background.default` in non-button files → `background.interactiveItem.hover`
Files (6):
- `src/components/Card.jsx`
- `src/components/CardPopover.jsx`
- `src/components/FilledAccordion.jsx`
- `src/components/SearchBar.jsx`
- `src/components/Chat/FileList.jsx`
- `src/components/Chat/NormalAttachment.jsx`

### V4: `button.background.secondary.default` in Card → `background.default.secondary`
File (1):
- `src/components/Card.jsx`

### V5: `button.background.iconLabelButton.hover` in AgentSelect, ImageGenerationModelSelect → `background.interactiveItem.hover`
Files (2):
- `src/components/AgentSelect.jsx`
- `src/components/ImageGenerationModelSelect.jsx`

### V6: `button.background.primary.disabled` in StyledComponents → `background.disabled` (check actual token path)
File (1):
- `src/components/Chat/StyledComponents.jsx`

### V7: `button.background.default` in SearchBarComponents → `background.interactiveItem.hover`; `button.text.disabled` → `text.disabled`
File (1):
- `src/components/SearchBarComponents.jsx`

### V8: `contextDialog.background` in StyledShowContextModal → `background.default.secondary`
File (1):
- `src/[fsd]/features/agent/ui/agent-details/configurations/modal/StyledShowContextModal.jsx`

### V9: `deleteAlert.text.entityName` in DeleteEntityModal → `text.primary`
File (1):
- `src/[fsd]/shared/ui/modal/DeleteEntityModal.jsx`

### V10: `listItem.background.default` in CollapsedParticipants → `background.interactiveItem.hover`
Files (2):
- `src/[fsd]/features/chat/participants/ui/CollapsedParticipants/CollapsedParticipantsDropdown.jsx`
- `src/[fsd]/features/chat/participants/ui/CollapsedParticipants/CollapsedPerticapantsList.jsx`

### V11: `select.hover` in SplitButton, UnifiedDropdown → `background.interactiveItem.hover`
Files (2):
- `src/components/SplitButton.jsx`
- `src/components/UnifiedDropdown.jsx`

### V12: `settingsPage.background` in ConfigurationsPanel, settings/index → `background.default.secondary`
Files (2):
- `src/[fsd]/features/settings/ui/ai-providers/ConfigurationsPanel.jsx`
- `src/[fsd]/pages/settings/index.jsx`

### V13: `userMessageEditor.border` in UserMessage.jsx → `border.hover`
File (1):
- `src/[fsd]/features/chat/ui/chat-box/UserMessage.jsx`

### V14: `welcome.background.*` in MaintenaceTipsContainer, WorkspaceIsReady → `background.default.*`
Files (2):
- `src/[fsd]/features/maintenance/ui/MaintenaceTipsContainer.jsx`
- `src/[fsd]/features/onboarding/ui/WorkspaceIsReady.jsx`

### V15: `userMessage.actionsGradient` in StyledComponents → already has `userMessage` canonical. Accept as cross-use of sibling component. **Keep** (see below).

---

## Group 3 — Promotions to general palette

### P1: `scrollbar.*` → `palette.scrollbar.*`
Move out of `components.scrollbar` into top-level `palette.scrollbar` since it's a global CSS utility.
Consumers (4 files):
- `ScrollableContainer.jsx`, `MdxPreview.jsx`, `PreviewContent.jsx`, `CodePreviewContent.jsx`

### P2: `deprecated.*` → `palette.deprecated.*`
Used to style "deprecated" state labels in the pipeline node header — cross-cutting semantic state.
Consumer (1 file):
- `NodeCardHeader.jsx`

---

## Group 4 — Keep (intentional / canonical-enough)

| Namespace | File | Reason |
|-----------|------|--------|
| `aiAnswer` | `ApplicationAnswer.jsx` | "Answer" is in filename; AI answer component |
| `aiParticipantIcon` | `ApplicationAnswer`, `ModalMessage`, `ParticipantAvatar` | All render AI participant avatar circles |
| `autocompleteChip` | `AutoCompleteDropDown`, `SingleSelect` | Created specifically for these two chip-in-select contexts |
| `entityIcon` | `GradientIconWrapper`, `ProjectIconItem`, `SelectIconDialog`, `TrophyIcon` | All configure/render entity icons |
| `interactiveTour` | `TourCard`, `TourCardHeader` | "Tour" is in both filenames |
| `notificationItem` | `NotificationListItem`, `NotificationList` | "notification" is in both filenames |
| `split` | `applicationActionButton.styles.js`, `DiagramOutput.jsx` | Marked Keep in prior audit |
| `userMessage` | `StyledComponents.jsx` | Sibling chat component reusing gradient — acceptable |

---

## Execution Order

1. **Group 1 (Renames)** — R1 through R13 — palette edits first, then consumer updates
2. **Group 3 (Promotions)** — P1, P2 — palette edits + consumer updates
3. **Group 2 (Reroutes)** — V1 through V14 — consumer-only, no palette changes
4. Run `npm run theme:check` and `npm run test` after each group

---

## Files Modified (palette)

- `src/darkPalette.js`
- `src/lightPalette.js`
