# Components Token Misuse Fixes

Total violations: ~158 usages across ~55 files.

## Resolution Strategies

- **A** — Reroute to an already-existing general palette token (no palette change needed)
- **B** — Add a new general palette token then reroute (token's value is semantically general)
- **C** — Create a dedicated component token for the actual consuming component
- **D** — Move token out of `components.*` into general palette (it was never single-component)
- **Keep** — Violation is acceptable by design; no change needed

---

## Groups by Action

---

### Group A — Reroute to existing general tokens

#### A1: `button.text.disabled` → `palette.text.disabled`
Files (4):
- `src/MainTheme.js:190`
- `src/[fsd]/shared/ui/input/textFieldVariants.js:52,106`
- `src/components/ConversationStarters.jsx:351`

#### A2: `button.text.create` → `palette.text.accent`
Files (2):
- `src/components/CredentialWarningBanner.jsx:109,110,112`
- `src/components/MermaidDiagramOutput/DiagramOutput.jsx:628`

#### A3: `select.hover` (non-select files) → `palette.background.interactiveItem.hover`
Files (5):
- `src/[fsd]/features/chat/ui/chat-button/PlusChatButton.jsx:580`
- `src/[fsd]/features/chat/conversation-list/ui/conversations/ConversationItem.jsx:671,687`
- `src/[fsd]/features/chat/conversation-list/ui/folders/FolderItem.jsx:388,403`
- `src/components/TreeItem.jsx:8,45`
- `src/components/SearchBar.jsx:237`

#### A4: `toolCard.background.hover` in SkillCard → `palette.background.interactiveItem.hover`
Files (1):
- `src/[fsd]/features/skill/ui/SkillCard.jsx:168`

#### A5: `dataGrid.background.row.selected` in MarkdownTableEditor → `palette.background.selectedItem.default`
Files (1):
- `src/components/MarkdownTableEditor.jsx:838,841`

#### A6: `folder.border.gradient` in AttachedDatasetCard → `palette.border.lines`
Files (1):
- `src/[fsd]/widgets/evaluation/ui/suite/dataset/AttachedDatasetCard.jsx:254`

#### A7: `oauthStatus.text.logout` in ImportWizardModal → `palette.text.secondary`
Files (2):
- `src/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalContent.jsx:194`
- `src/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalSucceedContent.jsx:214`

#### A8: `userMessageEditor.border` in NewParticipantCard → `palette.border.hover`
Files (1):
- `src/[fsd]/features/chat/ui/recommendations/NewParticipantCard.jsx:138`

#### A9: `contextDialog.background` in PipelineStateViewModal → `palette.background.default.secondary`
Files (1):
- `src/components/PipelineStateViewModal.jsx:79`

#### A10: `split.background.default` in AnalyticsContainer → `palette.background.default.secondary`
Files (6 occurrences in 1 file):
- `src/[fsd]/features/settings/ui/analytics/AnalyticsContainer.jsx:623,627,644,647,674,678`

#### A11: `tag.text.selected` in PublishWizardModal → `palette.text.primary`
Files (1):
- `src/[fsd]/entities/version/ui/PublishWizardModal.jsx:404,415`

#### A12: `input.text.label` in SingleGroupSelect → `palette.text.secondary`
Files (1):
- `src/components/SingleGroupSelect.jsx:19`

#### A13: `split.*` in applicationActionButton.styles.js and DiagramOutput.jsx → existing tokens
- `split.text.*` → `palette.text.*` equivalents
- `split.background.*` → `palette.background.interactiveItem.*` equivalents
Files (2):
- `src/[fsd]/features/apps/ui/catalog/applicationActionButton.styles.js:28–42`
- `src/components/MermaidDiagramOutput/DiagramOutput.jsx:608–621`

#### A14: `tabButton.background.*` in ToggleButton and GroupedButton → `palette.background.interactiveItem.*`
These components use tab-button styling for non-tab contexts:
- `src/components/ToggleButton.jsx:6,22` — `tabButton.background.default/active`
- `src/components/GroupedButton.jsx:17,25` — `tabButton.background.default/active`
- `src/MainTheme.js:261` — `tabButton.background.active`

#### A15: `conversation.background.highlightUserMessage` / `.border.highlightUserMessage` in UserMessage → these tokens describe the state of a highlighted user message in the chat body, not a conversation list item. Reroute to new `components.userMessage.*` tokens (see C2 below).

---

### Group B — Add new general palette tokens then reroute

#### B1: `button.text.showMore` → add `palette.text.showMore`
This is a standalone "show more" link color (cyan-ish accent) used as text in 11 non-button files.
Add to both palettes:
```js
text: {
  ...
  showMore: <value from button.text.showMore>,
}
```
Files (11):
- `src/[fsd]/features/skill-hub/ui/SkillCategorySection.jsx:182`
- `src/[fsd]/features/toolkits/ui/form/ToolBase/ToolBase.jsx:694`
- `src/[fsd]/features/agent-hub/ui/AgentModal.jsx:399`
- `src/[fsd]/features/agent-hub/ui/AgentCategorySection.jsx:184`
- `src/[fsd]/shared/ui/input/textFieldVariants.js:98,101`
- `src/[fsd]/widgets/sidebar-root/ui/NotificationList.jsx:243,255`
- `src/[fsd]/widgets/evaluation/ui/results/CaseResultItem.jsx:189,191,195`
- `src/[fsd]/widgets/context-budget/ui/ExpandableText.jsx:95`
- `src/components/Chat/ActionView.jsx:730`
- `src/pages/Artifacts/component/DuplicateDialogContent.jsx:173`
- `src/pages/Applications/Components/Applications/ApplicationInformation.jsx:224`

#### B2: `tooltip.background.default` / `tooltip.text.default` → add `palette.background.tooltip` + `palette.text.tooltip`
Used in non-tooltip badge/chip contexts in 5 locations.
Files (5):
- `src/MainTheme.js:268,269,272`
- `src/[fsd]/widgets/evaluation/ui/datasets/DatasetItem.jsx:248,261,267,273`
- `src/[fsd]/widgets/context-budget/ui/ContextBudgetCollapsed.jsx:66,67`
- `src/[fsd]/widgets/context-budget/ui/ContextBudgetCompact.jsx:122,123`
- `src/[fsd]/widgets/context-budget/ui/ContextBudgetProgress.jsx:122,123`

#### B3: `aiAnswer.background` in non-answer files → add `palette.background.aiMessage`
Used as the general AI message background in 4 non-ApplicationAnswer files.
Files (4):
- `src/[fsd]/features/chat/ui/chat-box/UserMessage.jsx:380`
- `src/[fsd]/pages/shared-conversation/index.jsx:350`
- `src/components/Chat/StyledComponents.jsx:195`
- `src/components/Chat/EditingPlaceholder.jsx:14`

Note: `aiAnswer.actionsGradient` in `UserMessage.jsx:442` and `StyledComponents.jsx:195` — reroute to `components.userMessage.actionsGradient` (see C2).

---

### Group C — Create new component tokens

#### C1: `usageMeter.trackBackground` in ContextBudgetProgress → add `components.contextBudget.trackBackground`
File (1):
- `src/[fsd]/widgets/context-budget/ui/ContextBudgetProgress.jsx:85`

#### C2: `aiAnswer.actionsGradient` used in UserMessage and StyledComponents → add `components.userMessage.actionsGradient`
Also covers A15: add `components.userMessage.highlightBackground` and `components.userMessage.highlightBorder`
to replace `conversation.background.highlightUserMessage` and `conversation.border.highlightUserMessage`.
Files:
- `src/[fsd]/features/chat/ui/chat-box/UserMessage.jsx:376,379,442`
- `src/components/Chat/StyledComponents.jsx:195`

#### C3: `tagChip.*` in AutoCompleteDropDown and SingleSelect → add `components.autocompleteChip.*`
These select-chip contexts are not TagChip but display tags similarly. Create dedicated tokens with same values.
Files (3):
- `src/ComponentsLib/AutoCompleteDropDown.jsx:462,464,468`
- `src/[fsd]/shared/ui/select/SingleSelect.jsx:834,840,843`
- `src/[fsd]/features/chat/conversation-list/ui/folders/FolderAccordionItem.jsx:35` → `palette.text.disabled` instead

#### C4: `aiParticipantIcon.background` in ModalMessage → add `components.messageAvatar.background` or reroute to `components.aiParticipantIcon.background` directly (ModalMessage renders an AI participant icon — close enough, accept as canonical).
Decision: accept both `ModalMessage.jsx` and `ParticipantAvatar.jsx` as canonical for `aiParticipantIcon`. Mark as **Keep**.

---

### Group D — Move out of `components.*` into general palette

#### D1: `components.alertBox.*` → move to `palette.alert.*`
`alertBox` is consumed by 10+ unrelated components as a shared severity-color system (info/warning/error).
It is not "a component" — it is a semantic color system and belongs in the general palette.
Add to both palettes at top level:
```js
alert: {
  info:    { background: ..., border: ..., text: ... },
  warning: { background: ..., border: ..., text: ... },
  error:   { background: ..., border: ..., text: ... },
  secondary: { background: ... },
}
```
Then update all 10 consumer files from `palette.components.alertBox.*` → `palette.alert.*`.
Files (10):
- `src/[fsd]/features/settings/ui/project-general/backup-restore/RestoreProjectDialog.jsx`
- `src/[fsd]/features/settings/ui/analytics/components/InfoBanner.jsx`
- `src/[fsd]/features/toolkits/ui/form/ToolBase/EmptyMcpTools.jsx`
- `src/[fsd]/shared/ui/banner-message/BannerMessage.jsx`
- `src/[fsd]/shared/ui/schedule/ScheduleModal.jsx`
- `src/[fsd]/widgets/evaluation/ui/results-history/EvaluationRunRow.jsx`
- `src/[fsd]/widgets/evaluation/ui/dimensions/DimensionForm.jsx`
- `src/[fsd]/widgets/evaluation/ui/results/DimensionResultCard.jsx`
- `src/[fsd]/entities/version/ui/VersionReplacementModal.jsx`
- `src/pages/Common/Components/InputVersionDialog.jsx`

---

### Keep — Accept as intentionally shared / canonically close enough

| Token | File | Reason |
|-------|------|--------|
| `button.background.agentHub.*` | AgentHubButton.jsx | IS a button in agent hub context |
| `accordion.*` | DimensionCard, BuildDimensionWithAiModal, ManageDimensionCard | All use `<Accordion>` MUI component |
| `entityIcon.*` | GradientIconWrapper, ProjectIconItem, SelectIconDialog, TrophyIcon | All render or configure entity icons |
| `notificationItem.border` | NotificationList.jsx | List directly renders and styles notification items |
| `scrollbar.*` | CodePreviewContent, PreviewContent, MdxPreview | All apply custom scrollbar CSS |
| `aiParticipantIcon.background` | ModalMessage, ParticipantAvatar | Both render AI participant avatar circles |
| `button.background.npsCard.*` | NpsSurveyCard.jsx | NPS survey IS the npsCard component context |
| `conversation.*` in FolderItem | Already canonical (FolderItem IS part of conversation list) |
| `button.background.iconLabelButton.*` | ImageGenerationModelSelect, AgentSelect | These render labeled icon buttons |

---

## Execution Order

1. **Group B** — Add palette tokens first (B1: `text.showMore`, B2: `background/text.tooltip`, B3: `background.aiMessage`) — consumers depend on these existing
2. **Group D** — Add `palette.alert.*`, update 10 consumers, remove `components.alertBox`
3. **Group C** — Add component tokens (C1: contextBudget, C2: userMessage, C3: autocompleteChip)
4. **Group A** — Reroute all remaining (pure consumer file changes, no palette edits)
5. **Verification** — `npm run theme:check`, `npm run lint`, grep for residual violations
