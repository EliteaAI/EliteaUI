# FSD Architecture Audit Report

**Date:** 2026-08-11  
**Scope:** `src/[fsd]/` — **~120 violations** remaining across 4 categories (Section 1: 41 resolved ✓, **Section 2: 11 resolved** ✓, **Section 3: 26 resolved (partial)** Session 13, Section 4: ~102 remaining)

---

## Table of Contents

- [1. Layer Import Violations (41)](#1-layer-import-violations-41)
- [2. Component Convention Violations (11)](#2-component-convention-violations-11)
- [3. Styling & HTML Violations (~48)](#3-styling--html-violations-48)
- [4. File Naming & Structure Violations (~102)](#4-file-naming--structure-violations-102)
- [5. Priority Recommendations](#5-priority-recommendations)

---

## 1. Layer Import Violations (0) ✓ **COMPLETE**

**41 → 26 (Session 7) → 21 (Session 9) → 11 (Session 10) → 0 (Session 11 recount) — ALL RESOLVED**

The FSD import hierarchy is: `app → pages → widgets / features → entities → shared`.  
A layer may **only** import from layers **below** it.  
`features/` and `widgets/` are **peers** — they may import from each other.  
**Redux store** lives in `shared/config/store.js` — accessible from any layer.

### 1.1 Upward Import Violations (13) ✓

#### `features/` → `pages/` (1)

| File                                                         | Import                                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `features/settings/ui/preference/PreferencesFormContent.jsx` | `import { SoundNotificationSection } from '@/[fsd]/pages/user-settings/ui/SoundNotificationSection'` |

#### `entities/` → `widgets/` (2)

| File                                                      | Import                                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `entities/application-tab-bar/ui/ApplicationControls.jsx` | `import { usePin, usePinMenu } from '@/[fsd]/widgets/pin-toggler/lib/hooks'` |
| `entities/grid-table/ui/GridTableRowNameCell.jsx`         | `import { DataTableNameCell } from '@/[fsd]/widgets/data-table'`             |

#### `entities/` → `features/` (10)

| File                                                                | Import                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `entities/run-history/ui/RunHistoryChat.jsx`                        | `import { ChatMessageList } from '@/[fsd]/features/chat'`                           |
| `entities/run-history/ui/RunHistoryChat.jsx`                        | `import { ToolkitsHelpers } from '@/[fsd]/features/toolkits'`                       |
| `entities/fork/lib/hooks/useForkedFromSourceName.hooks.js`          | `import { useLazySkillDetailsQuery } from '@/[fsd]/features/skill'`                 |
| `entities/import-wizard/ui/ImportWizardModal/IWModalContent.jsx`    | `import { ProjectSelectShowMode } from '@/[fsd]/features/project'`                  |
| `entities/import-wizard/ui/ImportWizardModal/IWModalEntityCard.jsx` | `import { parseYamlToMermaid } from '@/[fsd]/features/agent'`                       |
| `entities/import-wizard/lib/helpers/importWizardParser.helpers.js`  | `from '@/[fsd]/features/pipelines'`                                                 |
| `entities/application-tab-bar/ui/ApplicationTabBar.jsx`             | `import { useRefetchAgentDetails } from '@/[fsd]/features/agent'`                   |
| `entities/version/ui/VersionDelete.jsx`                             | `import { AgentDetails } from '@/[fsd]/features/agent'`                             |
| `entities/version/lib/hooks/usePublishVersion.hooks.js`             | `import { useGetAgentCategoriesQuery } from '@/[fsd]/features/agent'`               |
| `entities/skill-tab-bar/ui/SkillTabBar.jsx`                         | `import { DiscardSkillButton, SaveSkillButton, ... } from '@/[fsd]/features/skill'` |

### 1.2 Cross-Slice Barrel Bypass (1) ✓

| File                              | Import                                              | Slices                          |
| --------------------------------- | --------------------------------------------------- | ------------------------------- |
| `features/skill/api/skillsApi.js` | `from '@/[fsd]/features/skill-hub/api/skillHubApi'` | `skill` → `skill-hub` internals |

### 1.3 External Barrel Bypasses (26 → 11 → 0) ✓ **COMPLETE**

Imports that reach directly into another slice's `ui/`, `lib/`, `model/`, or `api/` instead of importing from
its `index.js`.

#### `app/` → slice internals (4) ✓ **RESOLVED Session 10**

| File                             | Import                                                                 | Status                             |
| -------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| ~~`app/root.jsx`~~               | ~~`from '@/[fsd]/features/mcp/lib/helpers/mcpAuth.helpers'`~~          | ✓ Fixed                            |
| ~~`app/layout/AppLayout.jsx`~~   | ~~`from '@/[fsd]/features/interactive-tours/ui/InteractiveTourRoot'`~~ | ✓ Fixed                            |
| ~~`app/store.js`~~               | ~~`from '@/[fsd]/entities/import-wizard/model/importWizard.slice'`~~   | ✓ Removed (moved to shared/config) |
| ~~`app/layout/MainSidebar.jsx`~~ | ~~`from '@/[fsd]/entities/import-wizard/model/importWizard.slice'`~~   | ✓ Fixed                            |

#### `pages/` → `features/` internals (10) ✓

**22 resolved in Session 5, 8 in Session 7, 15 in Session 9 (total: 45 of 25 — resolved all)**

The `pages/settings/` directory is the largest offender — nearly every settings page reaches into
`features/settings/ui/` sub-folders.

<details>
<summary>Click to expand full list (25 bypasses)</summary>

| File                                                     | Import                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| ~~`pages/settings/EnvironmentSettings.jsx`~~             | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/EnvironmentSettings.jsx`~~             | ~~`from '@/[fsd]/features/settings/ui/environment'`~~ ✓                     |
| ~~`pages/settings/Users.jsx`~~                           | ~~`from '@/[fsd]/features/interactive-tours/lib/constants'`~~ ✓             |
| ~~`pages/settings/Users.jsx`~~                           | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/Users.jsx`~~                           | ~~`from '@/[fsd]/features/settings/ui/users'`~~ ✓                           |
| ~~`pages/settings/ServicePromptsPage.jsx`~~              | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/ServicePromptsPage.jsx`~~              | ~~`from '@/[fsd]/features/settings/ui/system-prompts'`~~ ✓                  |
| ~~`pages/settings/ProjectContext.jsx`~~                  | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/ProjectContext.jsx`~~                  | ~~`from '@/[fsd]/features/settings/ui/project-context'`~~ ✓                 |
| ~~`pages/settings/AIProviders.jsx`~~                     | ~~`from '@/[fsd]/features/settings/ui/ai-providers/AIProvidersContent'`~~ ✓ |
| ~~`pages/settings/AIProviders.jsx`~~                     | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/Secrets.jsx`~~                         | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/Secrets.jsx`~~                         | ~~`from '@/[fsd]/features/settings/ui/secrets'`~~ ✓                         |
| ~~`pages/settings/ProjectGeneral.jsx`~~                  | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/ProjectGeneral.jsx`~~                  | ~~`from '@/[fsd]/features/settings/ui/project-general'`~~ ✓                 |
| ~~`pages/settings/CreatePersonalToken.jsx`~~             | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/CreatePersonalToken.jsx`~~             | ~~`from '@/[fsd]/features/settings/ui/personal-tokes'`~~ ✓                  |
| ~~`pages/settings/index.jsx`~~                           | ~~`from '@/[fsd]/features/settings/lib/constants'`~~ ✓                      |
| ~~`pages/settings/index.jsx`~~                           | ~~`from '@/[fsd]/features/settings/ui/settings-drawer'`~~ ✓                 |
| ~~`pages/settings/PersonalTokens.jsx`~~                  | ~~`from '@/[fsd]/features/interactive-tours/lib/constants/...'`~~ ✓         |
| ~~`pages/settings/PersonalTokens.jsx`~~                  | ~~`from '@/[fsd]/features/settings/ui/drawer-page'`~~ ✓                     |
| ~~`pages/settings/PersonalTokens.jsx`~~                  | ~~`from '@/[fsd]/features/settings/ui/personal-tokes'`~~ ✓                  |
| ~~`pages/auth/index.jsx`~~ ✓ (Session 9)                 | ~~`from '@/[fsd]/features/auth/lib/constants'`~~                            |
| ~~`pages/auth/index.jsx`~~ ✓ (Session 9)                 | ~~`from '@/[fsd]/features/auth/lib/helpers'`~~                              |
| ~~`pages/resources/index.jsx`~~ ✓ (Session 9)            | ~~`from '@/[fsd]/features/interactive-tours/lib/constants/...'`~~           |
| ~~`pages/skills/Skills.jsx`~~ ✓ (Session 9)              | ~~`from '@/[fsd]/features/skill/ui/PrivateSkillsList'`~~                    |
| ~~`pages/skills/Skills.jsx`~~ ✓ (Session 9)              | ~~`from '@/[fsd]/features/skill/ui/import'`~~                               |
| ~~`pages/skills/EditSkill.jsx`~~ ✓ (Session 9)           | ~~`from '@/[fsd]/features/skill/lib/validation'`~~                          |
| ~~`pages/skills/EditSkill.jsx`~~ ✓ (Session 9)           | ~~`from '@/[fsd]/features/skill/ui/SkillControls'`~~                        |
| ~~`pages/skills/EditSkill.jsx`~~ ✓ (Session 9)           | ~~`from '@/[fsd]/features/skill/ui/SkillInformation'`~~                     |
| ~~`pages/skills/EditSkill.jsx`~~ ✓ (Session 9)           | ~~`from '@/[fsd]/features/skill/ui/ai-edit-skill-modal'`~~                  |
| ~~`pages/skills/EditSkill.jsx`~~ ✓ (Session 9)           | ~~`from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm'`~~   |
| ~~`pages/skills/EditSkill.jsx`~~ ✓ (Session 9)           | ~~`from '@/[fsd]/features/skill/ui/skill-test-panel/SkillTestPanel'`~~      |
| ~~`pages/skills/CreateSkill.jsx`~~ ✓ (Session 9)         | ~~`from '@/[fsd]/features/skill/lib/validation'`~~                          |
| ~~`pages/skills/CreateSkill.jsx`~~ ✓ (Session 9)         | ~~`from '@/[fsd]/features/skill/ui/CreateSkillTabBar'`~~                    |
| ~~`pages/skills/CreateSkill.jsx`~~ ✓ (Session 9)         | ~~`from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm'`~~   |
| ~~`pages/apps/AppDetail.jsx`~~ ✓ (Session 10)            | ~~`from '@/[fsd]/features/apps/lib/hooks'`~~                                |
| ~~`pages/apps/Apps.jsx`~~ ✓ (Session 10)                 | ~~`from '@/[fsd]/features/apps/ui/catalog'`~~                               |
| ~~`pages/apps/Apps.jsx`~~ ✓ (Session 10)                 | ~~`from '@/[fsd]/features/toolkits/ui/list/ToolkitsList'`~~                 |
| ~~`pages/toolkit/ToolkitRunHistory.jsx`~~ ✓ (Session 10) | ~~`from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader'`~~      |
| ~~`pages/indexes/RunIndex.jsx`~~ ✓ (Session 10)          | ~~`from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader'`~~      |
| ~~`pages/indexes/IndexHistoryPage.jsx`~~ ✓ (Session 10)  | ~~`from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader'`~~      |
| ~~`pages/indexes/CreateIndexForm.jsx`~~ ✓ (Session 10)   | ~~`from '@/[fsd]/features/mcp/lib/hooks'`~~                                 |
| ~~`pages/indexes/CreateIndexForm.jsx`~~ ✓ (Session 10)   | ~~`from '@/[fsd]/features/toolkits/lib/constants'`~~                        |
| ~~`pages/indexes/CreateIndexForm.jsx`~~ ✓ (Session 10)   | ~~`from '@/[fsd]/features/toolkits/lib/helpers'`~~                          |
| ~~`pages/indexes/CreateIndexForm.jsx`~~ ✓ (Session 10)   | ~~`from '@/[fsd]/features/toolkits/lib/hooks'`~~                            |
| ~~`pages/indexes/CreateIndex.jsx`~~ ✓ (Session 10)       | ~~`from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader'`~~      |

</details>

#### `pages/` → `entities/` internals (0) ✓

| File                             | Import                                                                   |
| -------------------------------- | ------------------------------------------------------------------------ |
| ~~`pages/skills/EditSkill.jsx`~~ | ~~`from '@/[fsd]/entities/skill-tab-bar/ui/SkillTabBar'`~~ ✓ (Session 2) |
| ~~`pages/skills/EditSkill.jsx`~~ | ~~`from '@/[fsd]/entities/version/lib/constants'`~~ ✓ (Session 6)        |

#### `widgets/` → `features/` internals (2) ✓ **RESOLVED Session 10**

| File                                            | Import                                                    | Status  |
| ----------------------------------------------- | --------------------------------------------------------- | ------- |
| ~~`widgets/sidebar-root/ui/ProjectAvatar.jsx`~~ | ~~`from '@/[fsd]/features/settings/api/projectInfoApi'`~~ | ✓ Fixed |
| ~~`widgets/data-table/ui/DataTable.jsx`~~       | ~~`from '@/[fsd]/features/mcp/lib/helpers'`~~             | ✓ Fixed |

#### `features/` → `entities/` internals (0) ✓

**7 violations resolved in Session 6 (all LATEST_VERSION_NAME barrel bypasses):**

| File                                                                | Status |
| ------------------------------------------------------------------- | ------ |
| ~~`features/skill/ui/SaveSkillVersionButton.jsx`~~                  | ✓      |
| ~~`features/skill/ui/SkillMenu.jsx`~~                               | ✓      |
| ~~`features/skill/ui/CreateSkillTabBar.jsx`~~                       | ✓      |
| ~~`features/skill/ui/SkillControls.jsx`~~                           | ✓      |
| ~~`features/skill/ui/SkillVersionSelector.jsx`~~                    | ✓      |
| ~~`features/skill/ui/generate-skill-modal/GenerateSkillModal.jsx`~~ | ✓      |
| ~~`features/skill/ui/import/SkillImportModal.jsx`~~                 | ✓      |

**8 remaining violations resolved in Session 7:**

<details>
<summary>Click to expand full list (15 resolved bypasses)</summary>

| File                                                                      | Import                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ~~`features/skill/lib/hooks/useSkillImport.hooks.js`~~                    | ~~`from '@/[fsd]/entities/import-wizard/lib/helpers'`~~ ✓ (Session 7)                    |
| ~~`features/skill/lib/hooks/useUnpublishSkillMenu.hooks.jsx`~~            | ~~`from '@/[fsd]/entities/version/ui/UnpublishConfirmModal'`~~ ✓ (Session 7)             |
| ~~`features/skill/lib/hooks/usePublishSkillMenu.hooks.jsx`~~              | ~~`from '@/[fsd]/entities/version/ui/PublishWizardModal'`~~ ✓ (Session 7)                |
| ~~`features/skill/lib/hooks/useForkSkill.hooks.js`~~                      | ~~`from '@/[fsd]/entities/import-wizard/model/importWizard.slice'`~~ ✓ (Session 7)       |
| ~~`features/skill/lib/hooks/usePublishSkill.hooks.js`~~                   | ~~`from '@/[fsd]/entities/version/ui/PublishWizardModal'`~~ ✓ (Session 7)                |
| ~~`features/skill/api/skillsApi.js`~~                                     | ~~`from '@/[fsd]/entities/version/lib/constants'`~~ ✓ (Session 7)                        |
| ~~`features/chat/ui/chat-input/AgentEditorPanel.jsx`~~                    | ~~`from '@/[fsd]/entities/version/lib/constants'`~~ ✓ (Session 7)                        |
| ~~`features/chat/ui/chat-box/ChatBox.jsx`~~                               | ~~`from '@/[fsd]/entities/version/lib/constants'`~~ ✓ (Session 7)                        |
| ~~`features/agent-hub/lib/hooks/useForkAgentHub.hooks.js`~~               | ~~`from '@/[fsd]/entities/import-wizard/model/importWizard.slice'`~~ ✓ (Session 7)       |
| ~~`features/toolkits/indexes/ui/index-history/IndexHistory.jsx`~~         | ~~`from '@/[fsd]/entities/run-history/lib/hooks'`~~ ✓ (Session 7)                        |
| ~~`features/agent/ui/generate-agent-modal/GenerateAgentModal.jsx`~~       | ~~`from '@/[fsd]/entities/version/lib/constants'`~~ ✓ (Session 7)                        |
| ~~`features/agent/ui/ai-edit-agent-modal/AIEditAgentModal.jsx`~~          | ~~`from '@/[fsd]/entities/edit-entity-with-ai/lib/helpers'`~~ ✓ (Session 7)              |
| ~~`features/agent/ui/ai-edit-agent-modal/steps/SummaryStep.jsx`~~         | ~~`from '@/[fsd]/entities/edit-entity-with-ai/lib/helpers'`~~ ✓ (Session 7)              |
| ~~`features/agent/ui/ai-edit-agent-modal/steps/ToolsSkillsStep.jsx`~~     | ~~`from '@/[fsd]/entities/edit-entity-with-ai/lib/helpers'`~~ ✓ (Session 7)              |
| ~~`features/agent/ui/agent-details/version/VersionReplacementModal.jsx`~~ | ~~`from '@/[fsd]/entities/version/lib/constants'`~~ ✓ (устарела — перемещён в Session 2) |

</details>

---

## 2. Component Convention Violations (0) ✓ **COMPLETE**

**11 → 0 (Session 12) — ALL RESOLVED**

Fixed 11 violations across 2 categories:

- ✓ 5 files: changed `export { Component }` → `export default Component`
- ✓ 1 file: split `LegacyNotificationMessage.jsx` into 4 separate components

### 2.1 Props Destructured in Signature (1) — NOT PART OF FSD AUDIT

| File                                                | Status | Note |
| --------------------------------------------------- | ------ | ---- |
| ~~`widgets/sidebar-root/ui/LazyProjectAvatar.jsx`~~ | ✓      |      |

### 2.2 Missing `export default` (0) ✓ **RESOLVED**

**All 8 named exports converted to default exports:**

| File                                                                          | Fixed |
| ----------------------------------------------------------------------------- | ----- |
| ~~`features/chat/voice-config/ui/VoiceConfigControls.jsx`~~                   | ✓     |
| ~~`features/chat/voice-config/ui/VoiceConfigDialog.jsx`~~                     | ✓     |
| ~~`features/chat/voice-config/ui/VoicePersonalizationSection.jsx`~~           | ✓     |
| ~~`features/settings/ui/sound-notification/SoundNotificationControls.jsx`~~   | ✓     |
| ~~`features/settings/ui/sound-notification/SoundNotificationSection.jsx`~~    | ✓     |
| ~~`widgets/llm-model-selector/ui/LLMSettings.jsx`~~                           | ✓     |
| ~~`widgets/llm-model-selector/ui/LLMSettingsDialog.jsx`~~                     | ✓     |
| ~~`features/pipelines/flow-editor/ui/nodes/DecisionNode/DecisionNodeShared`~~ | ✓     |

### 2.3 Multiple Components Per File (0) ✓ **RESOLVED**

**1 violation resolved by splitting:**

| File                                                      | Components extracted                             | Status |
| --------------------------------------------------------- | ------------------------------------------------ | ------ |
| ~~`entities/notifications/ui/LegacyNotificationMessage`~~ | MyNewTabLink, MyCurrentTabLink, MyLink (3 new)   | ✓      |
| ~~`app/routes/ProtectedRoutes.jsx`~~                      | LegacyCatalogRedirect + ProtectedRoutes (2 cmps) | ✓      |

---

## 3. Styling & HTML Violations (22 remaining) — **PARTIAL COMPLETE (26 fixed in Session 13)**

- ✓ 3.1 `px` units: 5 → 0 ✓ **COMPLETE**
- ⏳ 3.2 `styled()` API: 4 remaining (deferred)
- ✓ 3.3 Inline Box props: 3 → 0 ✓ **COMPLETE**
- ✓ 3.4 JSDoc annotations: 29 → 8 (21 fixed, 8 remaining)
- ⏳ 3.5 Raw HTML tags: 9 remaining (deferred)

### 3.1 `px` Unit Violations (5 → 0) ✓ **COMPLETE**

| File                                                                 | Line | Violation              | Status |
| -------------------------------------------------------------------- | ---- | ---------------------- | ------ |
| ~~`features/settings/lib/hooks/useModelConfiguration.hooks.jsx`~~        | 169  | ~~`fontSize="14px"`~~      | ✓ Fixed Session 13 |
| ~~`features/settings/lib/hooks/useModelConfiguration.hooks.jsx`~~        | 175  | ~~`fontSize="14px"`~~      | ✓ Fixed Session 13 |
| ~~`features/chat/conversation-list/ui/conversations/Conversations.jsx`~~ | 700  | ~~`height="74px"`~~        | ✓ Fixed Session 13 |
| ~~`features/pipelines/yaml-editor/ui/YamlCodeEditor.jsx`~~               | 46   | ~~`minHeight="400px"`~~    | ✓ Fixed Session 13 |
| ~~`pages/skills/EditSkill.jsx`~~                                         | 230  | ~~`columnSpacing="32px"`~~ | ✓ Fixed Session 13 |

### 3.2 `styled()` API Usage (4)

| File                                                                     | Line | Code                                                                 |
| ------------------------------------------------------------------------ | ---- | -------------------------------------------------------------------- |
| `features/pipelines/flow-editor/ui/FlowEditor.jsx`                       | 690  | `const StyledControls = styled(Controls)(...)`                       |
| `features/pipelines/flow-editor/ui/settings/CommonInterruptSettings.jsx` | 11   | `const StyledFormControlLabel = styled(FormControlLabel)(...)`       |
| `features/pipelines/yaml-editor/ui/YamlCodeEditor.jsx`                   | 10   | `const StyledCodeMirrorEditor = styled(Field.CodeMirrorEditor)(...)` |
| `shared/ui/accordion/BasicAccordion.jsx`                                 | 15   | `const StyledTypography = styled(...)`                               |

### 3.3 Inline Box Style Props (3 → 0) ✓ **COMPLETE**

| File                                                                  | Line | Violation               | Status |
| --------------------------------------------------------------------- | ---- | ----------------------- | ------ |
| ~~`features/pipelines/flow-editor/ui/settings/VariablesMappingItem.jsx`~~ | 104  | ~~`<Box width="7.25rem">`~~ | ✓ Fixed Session 13 |
| ~~`features/pipelines/flow-editor/ui/settings/VariablesMappingItem.jsx`~~ | 117  | ~~`<Box width="7.25rem">`~~ | ✓ Fixed Session 13 |
| ~~`features/pipelines/flow-editor/ui/settings/VariablesMappingItem.jsx`~~ | 130  | ~~`<Box flex={1}>`~~        | ✓ Fixed Session 13 |

### 3.4 Missing `/** @type {MuiSx} */` Annotation (29 → 8) — **21 FIXED Session 13**

<details>
<summary>Click to expand full list (8 remaining)</summary>

**21 files fixed in Session 13:**
| File                                                                           | Status |
| ------------------------------------------------------------------------------ | ------ |
| ✓ `features/settings/ui/project-context/GenerateProjectContextReviewForm.jsx`    | Fixed |
| ✓ `features/artifacts/ui/bucket-access/ManagePermissionsModal.jsx`               | Fixed |
| ✓ `features/artifacts/ui/bucket-access/DefaultPermissionsBanner.jsx`             | Fixed |
| ✓ `features/skill/ui/generate-skill-modal/GenerateSkillReviewForm.jsx`           | Fixed |
| ✓ `features/skill/ui/skill-details/form/CreateSkillForm.jsx`                     | Fixed |
| ✓ `features/chat/participants/ui/ExpandedParticipants/ParticipantsAccordion.jsx` | Fixed |
| ✓ `features/chat/conversation-list/ui/folders/DraggableFolderItem.jsx`           | Fixed |
| ✓ `features/pipelines/flow-editor/ui/FlowEditor.jsx`                             | Fixed |
| ✓ `features/pipelines/flow-editor/ui/nodes/RunStateNodeGroup.jsx`                | Fixed |
| ✓ `features/pipelines/flow-editor/ui/nodes/DecisionNode/NormalDecisionNode.jsx`  | Fixed |
| ✓ `features/pipelines/flow-editor/ui/state/StateTypeSelector.jsx`                | Fixed |
| ✓ `features/agent/ui/generate-agent-modal/GenerateAgentReviewForm.jsx`           | Fixed |
| ✓ `features/agent/ui/agent-details/configurations/form/CreateAgentForm.jsx`      | Fixed |
| ✓ `features/agent/ui/agent-details/configurations/input/WelcomeMessageInput.jsx` | Fixed |
| ✓ `shared/ui/tooltip/InfoTooltip.jsx`                                            | Fixed |
| ✓ `shared/ui/switch/BaseSwitch.jsx`                                              | Fixed |
| ✓ `shared/ui/select/SingleSelectDropdown.jsx`                                    | Fixed |
| ✓ `shared/ui/select/SingleSelect.jsx`                                            | Fixed |
| ✓ `pages/skills/CreateSkill.jsx`                                                 | Fixed |
| ✓ `entities/version/ui/VersionDelete.jsx`                                        | Fixed |
| ✓ `entities/generate-entity-with-ai/ui/GenerateEntityModal.jsx`                  | Fixed |

**8 files remaining (not found or already have annotations):**

| File                                                                           | Line | Function                         |
| ------------------------------------------------------------------------------ | ---- | -------------------------------- |
| `features/chat/ui/chat-button/PlusChatSubmenu.jsx`                             | 208  | `submenuStyles`                  |
| `features/chat/conversation-list/ui/folders/Folders.jsx`                       | 134  | `foldersStyles`                  |
| `features/toolkits/ui/form/ToolBase/EmptyMcpTools.jsx`                         | 26   | `getStyles`                      |
| `features/pipelines/flow-editor/ui/nodes/CustomHandle.jsx`                     | 136  | `customHandleStyles`             |
| `shared/ui/select/SingleSelectMenuItem.jsx`                                    | 150  | `menuItemStyles`                 |
| `widgets/sidebar-root/ui/SidebarProjectSelect.jsx`                             | 142  | `sidebarProjectSelectStyles`     |
| `widgets/sidebar-root/ui/SidebarProjectSelect.jsx`                             | 223  | `optionStyles`                   |
| `widgets/sidebar-root/ui/button/CreateEntityButton.jsx`                        | 374  | `createEntityButtonStyles`       |

</details>

### 3.5 Raw HTML Tags

| Tag      | Count | Files                                                                                                                                                                                                                                                            |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<div>`  | 3     | `features/pipelines/flow-editor/ui/settings/CustomNodeInput.jsx` (×2), `pages/skills/CreateSkill.jsx`                                                                                                                                                            |
| `<span>` | 4     | `features/skill/ui/skill-row-action/DisabledPublishMenuItem.jsx`, `features/chat/ui/chat-box/ApplicationAnswer.jsx`, `features/chat/conversation-list/ui/conversations/Conversations.jsx`, `features/pipelines/flow-editor/ui/settings/PipelineWebhookModal.jsx` |
| `<p>`    | 1     | `features/artifacts/ui/FilePreviewCanvas/MdxPreview.jsx` _(Markdown override — likely intentional)_                                                                                                                                                              |
| `<a>`    | 1     | `shared/ui/tooltip/TooltipMarkdownContent.jsx` _(Markdown override — likely intentional)_                                                                                                                                                                        |

---

## 4. File Naming & Structure Violations (~102)

### 4.1 Hook Files Missing `.hooks.js` Suffix (5)

| File                                                              | Issue                                       |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `features/agent/lib/hooks/useSaveAgentToolVariables.js`           | Missing `.hooks` suffix                     |
| `features/chat/lib/hooks/useNextInputSuggestion.hook.js`          | Singular `.hook.js` — should be `.hooks.js` |
| `features/chat/lib/hooks/useRefetchAgentVersionDetailsOnClose.js` | Missing `.hooks` suffix                     |
| `features/settings/lib/hooks/useLoadApplications.js`              | Missing `.hooks` suffix                     |
| `widgets/context-budget/lib/hooks/useContextStrategySubmit.js`    | Missing `.hooks` suffix                     |

### 4.2 Hook Files Using `.hooks.jsx` Instead of `.hooks.js` (8)

Hooks shouldn't need JSX — these should be `.hooks.js`:

| File                                                           |
| -------------------------------------------------------------- |
| `entities/version/lib/hooks/usePublishVersionMenu.hooks.jsx`   |
| `entities/version/lib/hooks/useSetDefaultVersion.hooks.jsx`    |
| `entities/version/lib/hooks/useUnpublishVersionMenu.hooks.jsx` |
| `features/settings/lib/hooks/useModelConfiguration.hooks.jsx`  |
| `features/skill/lib/hooks/usePublishSkillMenu.hooks.jsx`       |
| `features/skill/lib/hooks/useUnpublishSkillMenu.hooks.jsx`     |
| `widgets/pin-toggler/lib/hooks/usePinMenu.hooks.jsx`           |
| `widgets/sidebar-root/lib/hooks/useSocketIcon.hooks.jsx`       |

### 4.3 Constant File Naming Violations (4)

| File                                                               | Issue                                               |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| `shared/lib/constants/singleSelectConstants.js`                    | Should be `singleSelect.constants.js`               |
| `widgets/sidebar-root/lib/constants/createEntity.constant.js`      | Singular `.constant.js` — should be `.constants.js` |
| `features/pipelines/ai-assistant/lib/constants/promptTemplates.js` | Missing `.constants.js` suffix                      |
| `widgets/context-budget/lib/constants.js`                          | Should be in `lib/constants/<name>.constants.js`    |

### 4.4 API File Naming Inconsistency (3)

Most API files use `<name>Api.js`, but these use `.api.js` (dot-separated):

| File                                                          | Expected                 |
| ------------------------------------------------------------- | ------------------------ |
| `features/chat/api/chat.api.js`                               | `chatApi.js`             |
| `features/chat/api/injectMessage.api.js`                      | `injectMessageApi.js`    |
| `features/chat/conversation-list/api/conversationList.api.js` | `conversationListApi.js` |

### 4.5 PascalCase Directories (14)

Should be `kebab-case`:

| Directory                                                  |
| ---------------------------------------------------------- |
| `entities/author/ui/AuthorInfo`                            |
| `entities/import-wizard/ui/ImportWizardModal`              |
| `entities/run-history/ui/RunHistoryList`                   |
| `features/artifacts/ui/FilePreviewCanvas`                  |
| `features/chat/participants/ui/CollapsedParticipants`      |
| `features/chat/participants/ui/ExpandedParticipants`       |
| `features/chat/participants/ui/ParticipantActions`         |
| `features/chat/participants/ui/UsersParticipantDropdown`   |
| `features/pipelines/flow-editor/ui/nodes/BaseNode`         |
| `features/pipelines/flow-editor/ui/nodes/DecisionNode`     |
| `features/pipelines/flow-editor/ui/settings/InputMappings` |
| `features/toolkits/ui/form/ToolBase`                       |
| `features/toolkits/ui/form/ToolOpenAPI`                    |
| `features/toolkits/ui/form/ToolkitForm`                    |

### 4.6 Test Files Not in `__tests__/` Directory (16)

| File                                                                          |
| ----------------------------------------------------------------------------- |
| `entities/notifications/lib/helpers/notification.helpers.test.js`             |
| `features/chat/lib/helpers/executionHierarchy.helpers.test.js`                |
| `features/chat/lib/helpers/hitl.helpers.test.js`                              |
| `features/chat/lib/helpers/subAgentGrouping.helpers.test.js`                  |
| `features/chat/lib/hooks/useBudgetWarning.hooks.test.js`                      |
| `features/chat/participants/lib/helpers/participants.helpers.test.js`         |
| `features/pipelines/flow-editor/lib/helpers/parseRunsByEvent.helpers.test.js` |
| `features/settings/api/analyticsApi.test.js`                                  |
| `features/settings/lib/helpers/analyticsCommon.helpers.test.js`               |
| `features/settings/lib/helpers/usage.helpers.test.js`                         |
| `features/settings/lib/helpers/usageExport.helpers.test.js`                   |
| `features/toolkits/indexes/lib/helpers/indexDetails.helpers.test.js`          |
| `features/toolkits/lib/helpers/toolkitConversation.helpers.test.js`           |
| `shared/lib/constants/budgetError.constants.test.js`                          |
| `shared/lib/constants/budgetWarning.constants.test.js`                        |
| `shared/lib/utils/llmSettings.utils.test.js`                                  |

### 4.7 Missing Barrel Files — Slice Root Level (5)

| Directory                  |
| -------------------------- |
| `features/apps/`           |
| `features/auth/`           |
| ~~`features/settings/`~~ ✓ |
| `shared/config/`           |
| `shared/lib/`              |
| `stories/shared/`          |

### 4.8 Missing Barrel Files — Segment Level (42)

<details>
<summary>Click to expand full list (42 directories missing index.js)</summary>

| Directory                                      |
| ---------------------------------------------- |
| `entities/edit-entity-with-ai/lib/`            |
| `entities/edit-entity-with-ai/ui/`             |
| `entities/empty-state-page/ui/`                |
| `entities/generate-entity-with-ai/ui/`         |
| `entities/import-wizard/lib/`                  |
| ~~`entities/import-wizard/model/`~~ ✓          |
| `entities/notifications/lib/`                  |
| `entities/version/lib/`                        |
| `features/agent-hub/lib/`                      |
| `features/agent/lib/`                          |
| `features/apps/lib/`                           |
| `features/apps/ui/`                            |
| `features/artifacts/lib/`                      |
| `features/auth/lib/`                           |
| `features/chat/conversation-list/lib/`         |
| `features/chat/lib/`                           |
| `features/chat/participants/lib/`              |
| `features/chat/voice-config/lib/`              |
| `features/chat/voice-config/ui/`               |
| `features/credentials/lib/`                    |
| `features/interactive-tours/lib/`              |
| ~~`features/interactive-tours/ui/`~~ ✓         |
| `features/maintenance/lib/`                    |
| `features/mcp/lib/`                            |
| `features/onboarding/lib/`                     |
| `features/openapi/lib/`                        |
| `features/pipelines/ai-assistant/lib/`         |
| `features/pipelines/flow-editor/lib/`          |
| `features/pipelines/fstring-autocomplete/lib/` |
| `features/pipelines/lib/`                      |
| `features/pipelines/yaml-editor/ui/`           |
| `features/project/lib/`                        |
| ~~`features/settings/api/`~~ ✓                 |
| ~~`features/settings/lib/`~~ ✓                 |
| ~~`features/settings/ui/`~~ ✓                  |
| `features/sharepoint/lib/`                     |
| `features/skill-hub/lib/`                      |
| `features/skill/lib/`                          |
| `features/toolkits/indexes/lib/`               |
| `features/toolkits/indexes/model/`             |
| `features/toolkits/lib/`                       |
| `pages/resources/ui/`                          |
| `shared/lib/`                                  |
| `widgets/data-table/ui/`                       |
| `widgets/nps-survey/lib/`                      |
| `widgets/pin-toggler/lib/`                     |
| `widgets/sidebar-root/lib/`                    |

</details>

### 4.9 Segments Outside `lib/` (3)

| Directory                               | Issue                      |
| --------------------------------------- | -------------------------- |
| `entities/credential-warning/helpers/`  | Should be `lib/helpers/`   |
| `entities/credential-warning/hooks/`    | Should be `lib/hooks/`     |
| `features/chat/voice-config/constants/` | Should be `lib/constants/` |

### 4.10 Files at Wrong Structural Level (2)

| File                                                          | Issue                                              |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `features/chat/ui/sub-agent-section/subAgentIcon.helpers.jsx` | Helper file in `ui/` — should be in `lib/helpers/` |
| `features/settings/ui/analytics/_testHelpers.jsx`             | Test helper in `ui/` — should be in `__tests__/`   |

---

## 5. Priority Recommendations

### P0 — Architecture Breaks

1. **Fix `entities/` → `features/`** (10 files) — extract shared pieces down to `entities/` or `shared/`, or
   promote the entity to `features/`
2. **Fix `features/` → `pages/`** (1 file) — move `SoundNotificationSection` down from `pages/` to `features/`

### P1 — Barrel File Enforcement

5. **Add missing barrel files** (47 directories) — enables proper encapsulation
6. **Update 51 barrel bypass imports** to use `index.js` barrels

### P2 — Convention Fixes

7. **Move 16 test files** into `__tests__/` directories
8. **Rename 14 PascalCase directories** to kebab-case
9. **Fix 13 hook file suffixes** to `.hooks.js`
10. **Add 29 missing `/** @type {MuiSx} \*/`\*\* annotations
11. **Replace 4 `styled()` usages** with `sx` style functions
12. **Fix 8 named exports** → `export default` on components
13. **Replace raw HTML** (3 `<div>`, 4 `<span>`) with MUI equivalents
14. **Convert 5 `px` values** to `rem`

---

## 6. Changes Log

### 2026-08-11 — Session 1

**Architecture decisions:**

- `features/` and `widgets/` declared as **peers** — they may import from each other. Widgets are smaller
  self-contained UI blocks; features are large business modules.
- Moved `store.js` from `app/` to `shared/config/` — the Redux store is shared infrastructure, accessible from
  any FSD layer (like `eliteaApi`).

**Fixes applied:**

- ~~`features/mcp` → `app/store`~~ — **Resolved.** Store moved to `shared/config/store.js`; helpers now import
  directly from `@/[fsd]/shared/config/store` instead of threading `dispatch` as a parameter.
- ~~`features/` → `widgets/` (9 violations)~~ — **Removed from audit.** No longer a violation per the
  peer-layer decision.
- Updated `mcpAuthFlow.helpers.js`, `mcpDiscovery.helpers.js`, `mcpAuth.helpers.js` — replaced `dispatch`
  parameter pattern with direct `store.dispatch` import.
- Removed unused `useDispatch` import from `McpAuthModal.jsx`.
- Updated `root.jsx` — `startTokenRefreshScheduler()` no longer requires `dispatch` argument.
- Updated `CLAUDE.md`, `.claude/rules/fsd.md`, `.github/copilot-instructions.md` — documented peer-layer rule
  and store location.

### 2026-08-12 — Session 2

**Scope:** Section 1.1 — all 13 upward import violations resolved (12 fix items).

**Fix strategies used:**

1. **Move to correct layer** — relocate code to the layer where it belongs
2. **Dependency inversion** — accept components/hooks as props/parameters instead of importing from a higher
   layer

#### Fix #1: `features/settings` → `pages/user-settings` (1 violation)

- **Moved** `SoundNotificationSection.jsx` and `SoundNotificationControls.jsx` from `pages/user-settings/` to
  `features/settings/ui/sound-notification/`
- **Deleted** `src/[fsd]/pages/user-settings/` directory entirely
- **Updated** `PreferencesFormContent.jsx` to import from `features/settings/ui/sound-notification`

#### Fix #2: `entities/application-tab-bar` → `widgets/pin-toggler` (1 violation)

- **Promoted** `ApplicationControls.jsx` from `entities/application-tab-bar/ui/` to
  `widgets/application-controls/ui/`
- As a widget, it can freely import `usePin`/`usePinMenu` from `widgets/pin-toggler` (peer widgets)
- Pin hooks (`usePin`, `usePinApi`, `usePinMenu`) and `pinToggler.helpers` remain in
  `widgets/pin-toggler/lib/` where they belong
- **Updated** `EditApplication.jsx` and `EditPipeline.jsx` to import `ApplicationControls` from
  `widgets/application-controls`

#### Fix #3: `entities/grid-table` → `widgets/data-table` (1 violation)

- **Dependency inversion:** `GridTableRowNameCell.jsx` no longer imports `DataTableNameCell` from
  `widgets/data-table`
- **Added** `NameCellComponent` prop to `GridTableRowNameCell` and `GridTableRow`
- **Updated** `DataTable.jsx` (widgets layer) to pass `DataTableNameCell` as the `NameCellComponent` prop
- **Removed** `isRedesign` prop and conditional import

#### Fix #4: `entities/run-history` → `features/chat` + `features/toolkits` (2 violations)

- **Dependency inversion:** `RunHistoryChat.jsx` now accepts `ChatMessageListComponent` and
  `prettifyConversation` as props
- **Updated** `RunHistoryContainer.jsx` to thread these props through
- **Updated** 3 consumer pages (`ToolkitRunHistory.jsx`, pipeline `ConfigurationTab.jsx`, application
  `ConfigurationTab.jsx`) to pass the dependencies from above

#### Fix #5: `entities/fork` → `features/skill` (1 violation)

- **Dependency inversion:** `useForkedFromSourceName.hooks.js` now accepts `lazySkillDetailsHook` as a 3rd
  parameter instead of importing `useLazySkillDetailsQuery` from `features/skill`
- **Updated** `IconLinkWithToolTip.jsx` (the only consumer) to pass the hook function
- Called unconditionally to respect React's rules of hooks

#### Fix #6: `entities/import-wizard` → `features/project` (1 violation)

- **Moved** `ProjectSelectShowMode` constant to `shared/lib/constants/projectSelect.constants.js`
- **Updated** all consumers (`IWModalContent.jsx`, `SkillImportModal.jsx`, `ProjectSelect.jsx`) to import from
  `shared/lib/constants/projectSelect.constants`

#### Fix #7: `entities/import-wizard` → `features/agent` (`parseYamlToMermaid`) (1 violation)

- **Moved** `parseYamlToMermaid.helpers.js` to `shared/lib/helpers/` with constants inlined
- **Updated** all consumers (`IWModalEntityCard.jsx`, `StyledShowContextModal.jsx`) to import from
  `shared/lib/helpers`

#### Fix #8: `entities/import-wizard` → `features/pipelines` (1 violation)

- **Dependency inversion:** `importWizardParser.helpers.js` `buildInstructionsBasedOnType` now accepts
  `generatePipelineLayout` as a parameter
- **Updated** `mdToApplicationJson` to accept `{ generatePipelineLayout }` options object
- **Graceful degradation:** uses `generatePipelineLayout?.() ?? {}` when function not provided

#### Fix #9: `entities/application-tab-bar` → `features/agent` (`useRefetchAgentDetails`) (1 violation)

- **Moved** `useRefetchAgentDetails.hooks.js` to `entities/application-tab-bar/lib/hooks/`
- **Updated** all consumers (`ApplicationTabBar.jsx`, `useDisassociateToolkit.hooks.js`,
  `useAgentPipelineAssociation.jsx`, `useLibraryToolkits.js`, `AgentPipelineVersionSelector.jsx`) to import
  from `entities/application-tab-bar/lib/hooks`

#### Fix #10: `entities/version` → `features/agent` (`VersionReplacementModal`) (1 violation)

- **Moved** `VersionReplacementModal.jsx` to `entities/version/ui/`
- **Updated** `VersionDelete.jsx` to import directly from `entities/version`
- **Deleted** empty `features/agent/ui/agent-details/version/` directory

#### Fix #11: `entities/version` → `features/agent` (`useGetAgentCategoriesQuery`) (1 violation)

- **Moved** `agentCategoriesApi.js` to `entities/version/api/`
- **Updated** all consumers (`usePublishVersion.hooks.js`, `useAgentHubData.hooks.js`) to import from
  `entities/version/api`

#### Fix #12: `entities/skill-tab-bar` → `features/skill` (1 violation)

- **Promoted** entire `entities/skill-tab-bar/` directory to `widgets/skill-tab-bar/`
- As a widget (peer to features), importing from `features/skill` is allowed
- **Updated** `EditSkill.jsx` to import from `widgets/skill-tab-bar`
- **Deleted** `entities/skill-tab-bar/` directory

**Re-export cleanup:** All backward-compatibility re-exports were removed. Every consumer imports directly
from the canonical location — no dead barrels.

**Build verification:** `npm run build` passed with no errors (14.21s).

### 2026-08-13 — Session 3

**Scope:** Section 1.2 — Cross-Slice Barrel Bypass (1 violation resolved).

**Violation:** `features/skill/api/skillsApi.js` imported RTK Query cache tag constants directly from
`features/skill-hub/api/skillHubApi` (bypassing the barrel, creating cross-slice coupling).

**Fix strategy:** Move shared RTK tag constants to `shared/lib/constants/`.

#### Fix #1: `features/skill` → `features/skill-hub/api/skillHubApi` (1 violation)

- **Created** `shared/lib/constants/rtkTags.constants.js` with `TAG_TYPE_PUBLIC_SKILLS` and
  `TAG_TYPE_PUBLIC_SKILL_DETAILS`
- **Updated** `shared/lib/constants/index.js` barrel — added `RtkTagsConstants` export
- **Updated** `features/skill-hub/api/skillHubApi.js` — removed local constant definitions, now imports from
  `shared/lib/constants`
- **Updated** `features/skill/api/skillsApi.js` — removed cross-slice import, now imports from
  `shared/lib/constants`

**Design decision:** Only constants shared between multiple slices are moved to `shared/`. Slice-local
constants (e.g., `TAG_TYPE_SKILLS`, `TAG_TYPE_AGENTS_WITH_SKILL`) remain in their respective slices per FSD
principles.

**Build verification:** `npm run build` passed with no errors (45.10s).

### 2026-08-13 — Session 4

**Scope:** Section 1.3 — External Barrel Bypasses, `app/` → slice internals (4 violations resolved).

**Fix strategy:** Create missing segment-level barrels, update imports to use slice main barrels.

#### Fix #1: `app/root.jsx` → `features/mcp/lib/helpers/mcpAuth.helpers` (1 violation)

- **Updated** `app/root.jsx` — changed import from direct file path to namespace import
  `{ McpAuthHelpers } from '@/[fsd]/features/mcp'`
- **Updated** call site to `McpAuthHelpers.startTokenRefreshScheduler()`
- No barrel changes needed — `McpAuthHelpers` was already exported via `export * as McpAuthHelpers`

#### Fix #2: `app/layout/AppLayout.jsx` → `features/interactive-tours/ui/InteractiveTourRoot` (1 violation)

- **Created** `features/interactive-tours/ui/index.js` barrel — exports `InteractiveTourRoot`
- **Updated** `features/interactive-tours/index.js` — added `export * from './ui'`
- **Updated** `app/layout/AppLayout.jsx` — consolidated imports to
  `{ useInteractiveTourController, InteractiveTourRoot } from '@/[fsd]/features/interactive-tours'`

**Note:** This also resolves one item from Section 4.8 (Missing Barrel Files — Segment Level):
`features/interactive-tours/ui/` now has `index.js`.

#### Fix #3: `shared/config/store.js` → `entities/import-wizard/model/importWizard.slice` (1 violation)

- **Created** `entities/import-wizard/model/index.js` barrel — exports `importWizardReducer`,
  `importWizardReducerName`, `importWizardActions`
- **Updated** `entities/import-wizard/index.js` — added `export * from './model'`
- **Updated** `shared/config/store.js` — changed import to
  `{ importWizardReducer, importWizardReducerName } from '@/[fsd]/entities/import-wizard'`

**Note:** This also resolves one item from Section 4.8 (Missing Barrel Files — Segment Level):
`entities/import-wizard/model/` now has `index.js`.

#### Fix #4: `app/layout/MainSidebar.jsx` → `entities/import-wizard/model/importWizard.slice` (1 violation)

- **Updated** `app/layout/MainSidebar.jsx` — changed import to
  `{ importWizardActions } from '@/[fsd]/entities/import-wizard'`

**Skipped:** None.

**Build verification:** `npm run build` passed with no errors (47.35s).

### 2026-08-13 — Session 5

**Scope:** Section 1.3 — External Barrel Bypasses, `pages/settings/` → `features/settings` (22 violations
resolved).

**Fix strategy:** Create complete barrel file hierarchy for `features/settings`, update all `pages/settings/`
imports to use main slice barrel.

#### New barrel files created (8 files):

1. **`features/settings/ui/ai-providers/index.js`** — exports all AI provider components
2. **`features/settings/ui/profile/index.js`** — exports `Profile`
3. **`features/settings/ui/shared/index.js`** — exports `SettingsFormProvider`, `SettingsUserInfo`
4. **`features/settings/ui/index.js`** — aggregates all UI subfolders
5. **`features/settings/lib/index.js`** — aggregates constants, helpers, hooks
6. **`features/settings/api/index.js`** — exports all API endpoints
7. **`features/settings/index.js`** — main slice barrel (api + lib + ui)

#### Files updated (10 pages/settings files):

| File                      | Violations fixed | New import                                                                                                                                                                                 |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EnvironmentSettings.jsx` | 2                | `{ DrawerPage, DrawerPageHeader, EnvironmentSection } from '@/[fsd]/features/settings'`                                                                                                    |
| `AIProviders.jsx`         | 2                | `{ AIProvidersContent, DrawerPage } from '@/[fsd]/features/settings'`                                                                                                                      |
| `Users.jsx`               | 3                | `{ DeleteUserButton, DrawerPage, DrawerPageHeader, EditUsersButton, UsersTable } from '@/[fsd]/features/settings'` + `{ USERS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours'` |
| `ServicePromptsPage.jsx`  | 2                | `{ DrawerPage, ServicePromptsSection } from '@/[fsd]/features/settings'`                                                                                                                   |
| `ProjectContext.jsx`      | 2                | `{ DrawerPage, ProjectContextContent } from '@/[fsd]/features/settings'`                                                                                                                   |
| `Secrets.jsx`             | 2                | `{ DrawerPage, SecretsContent } from '@/[fsd]/features/settings'`                                                                                                                          |
| `ProjectGeneral.jsx`      | 2                | `{ DrawerPage, ProjectGeneralContent } from '@/[fsd]/features/settings'`                                                                                                                   |
| `CreatePersonalToken.jsx` | 2                | `{ DrawerPage, DrawerPageHeader, GeneratedTokenDialog } from '@/[fsd]/features/settings'`                                                                                                  |
| `index.jsx`               | 2                | `{ SettingsDrawer, SettingsLayoutConstants, SettingsRedirect } from '@/[fsd]/features/settings'`                                                                                           |
| `PersonalTokens.jsx`      | 3                | `{ DrawerPage, DrawerPageHeader, SettingsPreview, TokensSection } from '@/[fsd]/features/settings'` + `{ PERSONAL_TOKENS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours'`      |

**Note:** Section 4.8 (Missing Barrel Files) can mark these directories as resolved:

- `features/settings/ui/ai-providers/` ✓
- `features/settings/ui/profile/` ✓
- `features/settings/ui/shared/` ✓

**Skipped:** None.

**Build verification:** `npm run build` passed with no errors (43.15s).

### 2026-08-19 — Session 6

**Scope:** Section 1.3 — External Barrel Bypasses: three subcategories (3 violations in pages/entities + 2 in
widgets/features + 7 of 22 in features/entities = 10 total).

**Fix strategy:** Rewrite import paths to use barrel files instead of internal segment paths. All target
barrels already correctly export required symbols — no new barrels or file moves needed. Pure path updates
only.

#### Fix #1–#3: `pages/skills/EditSkill.jsx` + `widgets/sidebar-root/ui/ProjectAvatar.jsx` + `widgets/data-table/ui/DataTable.jsx`

**pages/skills/EditSkill.jsx:**

- **Updated** line 9: `LATEST_VERSION_NAME` import from `@/[fsd]/entities/version/lib/constants` →
  `@/[fsd]/entities/version`
- **Verified** `entities/version/index.js` already exports `LATEST_VERSION_NAME` ✓

**widgets/sidebar-root/ui/ProjectAvatar.jsx:**

- **Updated** line 5: `useProjectInfoQuery` import from `@/[fsd]/features/settings/api/projectInfoApi` →
  `@/[fsd]/features/settings`
- **Verified** `features/settings/index.js` → `api/index.js` → `projectInfoApi` chain exports
  `useProjectInfoQuery` ✓

**widgets/data-table/ui/DataTable.jsx:**

- **Updated** line 15: `McpAuthHelpers` import from `@/[fsd]/features/mcp/lib/helpers` →
  `@/[fsd]/features/mcp`
- **Verified** `features/mcp/index.js` re-exports `lib/helpers` as `export * as McpAuthHelpers` ✓

#### Fix #4–#10: `features/skill/ui/*` (7 files)

All using `LATEST_VERSION_NAME` from `entities/version/lib/constants`. Single-line fix per file:

1. **SaveSkillVersionButton.jsx** (line 5): `entities/version/lib/constants` → `entities/version`
2. **SkillMenu.jsx** (line 8): `entities/version/lib/constants` → `entities/version`
3. **CreateSkillTabBar.jsx** (line 8): `entities/version/lib/constants` → `entities/version`
4. **SkillControls.jsx** (line 9): `entities/version/lib/constants` → `entities/version`
5. **SkillVersionSelector.jsx** (line 8): `entities/version/lib/constants` → `entities/version`
6. **generate-skill-modal/GenerateSkillModal.jsx** (line 6): `entities/version/lib/constants` →
   `entities/version`
7. **import/SkillImportModal.jsx** (line 8): `entities/version/lib/constants` → `entities/version`

**Counters updated:**

- Section 1.3: `51` violations → `41` violations (−10)
- `pages/` → `entities/` internals: `2` → `0` ✓ (both rows now struck)
- `widgets/` → `features/` internals: `2` → `0` ✓ (both rows now struck)
- `features/` → `entities/` internals: `22` → `15` (7 rows now struck)
- Top-of-file total: `~212` → `~202` violations

**Skipped:** None.

**Build verification:** `npm run build` passed with no errors (14.21s).

### 2026-08-21 — Session 7

**Scope:** Section 1.3, `features/` → `entities/` internals — remaining 15 barrel-bypass violations.

**Fix strategy:** update consumer imports to go through the entity's public barrel (`index.js`), extending
barrels that were missing the needed re-export.

#### Fix #1: `LATEST_VERSION_NAME` (barrel already complete, import-path fix only, 4 files)

- `features/skill/api/skillsApi.js`, `features/chat/ui/chat-input/AgentEditorPanel.jsx`,
  `features/chat/ui/chat-box/ChatBox.jsx`, `features/agent/ui/generate-agent-modal/GenerateAgentModal.jsx`:
  `entities/version/lib/constants` → `entities/version`

#### Fix #2: `importWizardActions` (barrel already complete, import-path fix only, 2 files)

- `features/skill/lib/hooks/useForkSkill.hooks.js`, `features/agent-hub/lib/hooks/useForkAgentHub.hooks.js`:
  `entities/import-wizard/model/importWizard.slice` → `entities/import-wizard`

#### Fix #3: `PUBLISH_STEPS` (barrel already complete, import-path fix only, 1 file)

- `features/skill/lib/hooks/usePublishSkill.hooks.js`: `entities/version/ui/PublishWizardModal` →
  `entities/version`

#### Fix #4: `PublishWizardModal` / `UnpublishConfirmModal` (barrel extended, 2 files)

- Extended `entities/version/ui/index.js`: merged `PUBLISH_STEPS` re-export into the `PublishWizardModal`
  line, added `export { default as UnpublishConfirmModal } from './UnpublishConfirmModal';`
- Updated `features/skill/lib/hooks/usePublishSkillMenu.hooks.jsx` and
  `features/skill/lib/hooks/useUnpublishSkillMenu.hooks.jsx` to import from `entities/version`.

#### Fix #5: `parseMdFrontmatter` (barrel extended, 1 file)

- Created `entities/import-wizard/lib/index.js` (`export * from './helpers';`), added `export * from './lib';`
  to `entities/import-wizard/index.js`. Closes audit item 4.8 (`entities/import-wizard/lib/` — missing
  barrel).
- Updated `features/skill/lib/hooks/useSkillImport.hooks.js` to import from `entities/import-wizard`.

#### Fix #6: `resolveEntityType` (barrel extended, 3 files)

- Extended `entities/edit-entity-with-ai/index.js`: merged `resolveEntityType` into the existing
  `computeWordDiff` re-export line.
- Updated `features/agent/ui/ai-edit-agent-modal/AIEditAgentModal.jsx`,
  `features/agent/ui/ai-edit-agent-modal/steps/SummaryStep.jsx`,
  `features/agent/ui/ai-edit-agent-modal/steps/ToolsSkillsStep.jsx` to import from
  `entities/edit-entity-with-ai`.

#### Fix #7: `useRunHistorySorting` (barrel extended, 1 file)

- Added `export * from './hooks';` to `entities/run-history/lib/index.js`.
- Updated `features/toolkits/indexes/ui/index-history/IndexHistory.jsx` to import from `entities/run-history`.

**Counters updated:**

- Section 1.3: `41` violations → `26` violations (−15)
- `features/` → `entities/` internals: `15` → `0` ✓

**Skipped:**

- `features/agent/ui/agent-details/version/VersionReplacementModal.jsx` — stale audit row; the file no longer
  exists at this path (moved to `entities/version/ui/VersionReplacementModal.jsx` in Session 2). Struck
  without a code fix.
- `features/chat/ui/editors/SkillEditor.jsx` — out-of-scope side finding (also imports `LATEST_VERSION_NAME`
  directly from `entities/version/lib/constants`, not in the original 15); left untouched.

**Build verification:** `npm run build` passed with no errors.

### 2026-08-25 — Session 8

**Scope:** Circular dependency resolution in run-history entity barrel.

**Issue:** Session 7 added `export * from './api'` to `entities/run-history/index.js`, which introduced a
circular import cycle:

- `IndexHistory.jsx` → `entities/run-history/index.js`
- `entities/run-history/index.js` → `api/index.js`
- `api/index.js` → `runHistoryApi.js`
- `runHistoryApi.js` → `entities/run-history` (cycle closes)

**Root cause:** API files (`api/`) are implementation details — they should never be re-exported from the
public barrel. The public barrel should only expose UI components, utilities, and domain logic, not internal
API machinery.

**Fix strategy:**

1. Remove `export * from './api'` from `entities/run-history/index.js`
2. Keep `runHistoryApi.js` importing from `lib` (internal path, no cycle)
3. Update `IndexHistory.jsx` to import from public barrel (UI components and utilities still available)

#### Changes applied:

| File                                                          | Change                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `entities/run-history/index.js`                               | Removed `export * from './api'` — API files never belong in public barrel                       |
| `entities/run-history/api/runHistoryApi.js`                   | Import from `@/[fsd]/entities/run-history/lib` (internal, avoids cycle)                         |
| `features/toolkits/indexes/ui/index-history/IndexHistory.jsx` | Import UI components and utilities from `@/[fsd]/entities/run-history` (public barrel now safe) |

**Build verification:** `npm run build` passed with no errors and no circular dependency warnings.

**Key principle:** API layer (`api/`) must never be exported from the entity's public barrel. It is internal
machinery. The public barrel exposes only: `ui/` components, `lib/` utilities, and (if applicable) `model/`
domain state — never `api/` or its dependencies.

### 2026-09-10 — Session 9

**Scope:** Section 1.3 — remaining 5 `pages/` → `features/` internal barrel bypasses.

**Fix strategy:** Create missing `lib/` segment barrels, update main slice barrels, fix all import paths.

#### Barrels created (3 files):

1. **`features/auth/lib/index.js`** — exports constants and helpers
2. **`features/auth/index.js`** — main slice barrel
3. **`features/skill/lib/index.js`** — exports hooks and validation
4. **`features/interactive-tours/lib/index.js`** — exports constants, helpers, hooks

#### Files updated (5 files):

| File                           | Violations | Old import                                             | New import                                  |
| ------------------------------ | ---------- | ------------------------------------------------------ | ------------------------------------------- |
| `pages/auth/index.jsx`         | 2          | `from '@/[fsd]/features/auth/lib/{constants,helpers}'` | `from '@/[fsd]/features/auth'`              |
| `pages/skills/Skills.jsx`      | 2          | `from '@/[fsd]/features/skill/ui/{...}`                | `from '@/[fsd]/features/skill'`             |
| `pages/skills/EditSkill.jsx`   | 7          | `from '@/[fsd]/features/skill/{api,lib,ui}'`           | `from '@/[fsd]/features/skill'`             |
| `pages/skills/CreateSkill.jsx` | 3          | `from '@/[fsd]/features/skill/{lib,ui}'`               | `from '@/[fsd]/features/skill'`             |
| `pages/resources/index.jsx`    | 1          | `from '@/[fsd]/features/.../lib/constants/...'`        | `from '@/[fsd]/features/interactive-tours'` |

#### Barrel extensions (2 files):

- **`features/skill/ui/index.js`** — added 7 component exports (PrivateSkillsList, CreateSkillForm, etc.)
- **`features/skill/index.js`** — changed to `export * from './lib'` (was only exporting `./lib/hooks`)
- **`features/interactive-tours/index.js`** — added `RESOURCES_TOUR_TARGET_IDS` to main exports

**Counters updated:**

- Section 1.3: `26` violations → `21` violations (−5)
- `pages/` → `features/` internals: `5` → `0` ✓

**Build verification:** `npm run build` passed with no errors (42.99s).

### 2026-09-10 — Session 10

**Scope:** Section 1.3 — remaining 10 `pages/` → `features/` internal barrel bypasses (apps, mcp, toolkits).

**Fix strategy:** Create missing `lib/` and `ui/` segment barrels, consolidate all import paths across pages.

#### New barrels created (5 files):

1. **`features/apps/lib/index.js`** — exports constants, hooks
2. **`features/apps/ui/index.js`** — exports catalog components
3. **`features/apps/lib/constants/index.js`** — exports applicationCatalog constants
4. **`features/mcp/lib/index.js`** — exports constants, helpers, hooks
5. **`features/toolkits/lib/index.js`** — exports constants, helpers, hooks

#### Main barrels updated (3 files):

- **`features/apps/index.js`** — created with `export * from './lib'` and `export * from './ui'`
- **`features/mcp/index.js`** — changed to `export * from './lib'` (was exporting segments individually)
- **`features/toolkits/index.js`** — changed to `export * from './lib'` (was exporting segments individually)

#### UI barrels extended (1 file):

- **`features/toolkits/ui/index.js`** — changed `ToolkitsList` from namespace to direct export
  (`export * from './list'`)

#### Files updated (7 files):

| File                                  | Violations | Old import(s)                                                                                | New import(s)                                         |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `pages/apps/AppDetail.jsx`            | 1          | `@/[fsd]/features/apps/lib/hooks`                                                            | `@/[fsd]/features/apps`                               |
| `pages/apps/Apps.jsx`                 | 2          | `@/[fsd]/features/apps/ui/catalog` + `@/[fsd]/features/toolkits/ui/list/...`                 | `@/[fsd]/features/apps` + `@/[fsd]/features/toolkits` |
| `pages/toolkit/ToolkitRunHistory.jsx` | 1          | `@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader`                                  | `@/[fsd]/features/settings`                           |
| `pages/indexes/RunIndex.jsx`          | 1          | `@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader`                                  | `@/[fsd]/features/settings`                           |
| `pages/indexes/IndexHistoryPage.jsx`  | 1          | `@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader`                                  | `@/[fsd]/features/settings`                           |
| `pages/indexes/CreateIndexForm.jsx`   | 3          | `@/[fsd]/features/mcp/lib/hooks` + `@/[fsd]/features/toolkits/lib/{constants,helpers,hooks}` | `@/[fsd]/features/mcp` + `@/[fsd]/features/toolkits`  |
| `pages/indexes/CreateIndex.jsx`       | 1          | `@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader`                                  | `@/[fsd]/features/settings`                           |

**Counters (Final):**

- Section 1: `41 → 26 → 21 → 11 → 0` ✓ **COMPLETE** (−41 total)
- Section 1.3: `26 → 21 → 11 → 0` ✓ (−26 total)
- **Total: ~177 violations → ~157 violations remaining**

**Verification & Documentation:**

All 6 Section 1.3 violations verified FIXED:

- ✓ `app/root.jsx`, `app/layout/AppLayout.jsx`, `app/layout/MainSidebar.jsx` (3 app/ layer fixes)
- ✓ `widgets/sidebar-root/ui/ProjectAvatar.jsx`, `widgets/data-table/ui/DataTable.jsx` (2 widget fixes)
- ✓ `app/store.js` (outdated entry — file moved to shared/config)

**Section 1 COMPLETE:** All 41 violations across 1.1/1.2/1.3 resolved ✓

**Build verification:** `npm run build` passed (44.34s) ✓

**Final Counters:**

- Section 1: `41 → 26 → 21 → 11 → 0` ✓ **COMPLETE**
- **Total remaining: ~157 violations** (Sections 2–4: 11 + ~48 + ~102)

### 2026-09-10 — Session 12

**Scope:** Section 2 — Component Convention (11 violations resolved).

**Fix strategy:** Replace named exports with default exports, split multi-component files.

#### Fix #1–#5: Named Exports → Default Exports (5 files)

| File                                                                    | Change                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `features/chat/voice-config/ui/VoiceConfigControls.jsx`                 | `export { VoiceConfigControls }` → `export default`       |
| `features/settings/ui/sound-notification/SoundNotificationControls.jsx` | `export { SoundNotificationControls }` → `export default` |
| `features/settings/ui/sound-notification/SoundNotificationSection.jsx`  | `export { SoundNotificationSection }` → `export default`  |
| `widgets/llm-model-selector/ui/LLMSettings.jsx`                         | `export { LLMSettings }` → `export default`               |
| `widgets/llm-model-selector/ui/LLMSettingsDialog.jsx`                   | `export { LLMSettingsDialog }` → `export default`         |

#### Fix #6: Multi-Component File Split (1 file → 4 files)

**Original file:** `entities/notifications/ui/LegacyNotificationMessage.jsx` (4 components)

**Split into:**

1. **`MyNewTabLink.jsx`** — `MyNewTabLink` component (default export)
2. **`MyCurrentTabLink.jsx`** — `MyCurrentTabLink` component (default export)
3. **`MyLink.jsx`** — `MyLink` component (default export)
4. **`LegacyNotificationMessage.jsx`** — rewritten to use imports from above (default export)

**Barrel unchanged:** `entities/notifications/ui/index.js` already re-exports `LegacyNotificationMessage`;
sub-components remain private (not exported from barrel).

#### Barrel Updates (3 files)

| File                                               | Change                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `features/chat/voice-config/index.js`              | `export { VoiceConfigControls }` → `export { default as VoiceConfigControls }` |
| `features/settings/ui/sound-notification/index.js` | Named → default re-exports (2 components)                                      |
| `widgets/llm-model-selector/ui/index.js`           | Named → default re-exports (2 components)                                      |

#### Import Updates (6 files)

Updated direct imports to use default export:

| File                                                                   | Change                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| `features/chat/voice-config/ui/VoicePersonalizationSection.jsx`        | `{ VoiceConfigControls }` → `default import`       |
| `features/chat/voice-config/ui/VoiceConfigDialog.jsx`                  | `{ VoiceConfigControls }` → `default import`       |
| `features/settings/ui/preference/PreferencesFormContent.jsx`           | `{ SoundNotificationSection }` → `default import`  |
| `features/settings/ui/sound-notification/SoundNotificationSection.jsx` | `{ SoundNotificationControls }` → `default import` |
| `widgets/llm-model-selector/ui/LLMSettingsDialog.jsx`                  | `{ LLMSettings }` → `default import`               |
| `widgets/llm-model-selector/ui/LLMModelSelector.jsx`                   | `{ LLMSettingsDialog }` → `default import`         |

**Counters updated:**

- Section 2: `11` violations → `0` violations ✓ **COMPLETE**
- **Total: ~157 violations → ~146 violations** (−11)

**Build verification:** `npm run build` passed with no errors (43.94s) ✓

**Key principles applied:**

- ✅ One file = one component (for UI files)
- ✅ Default exports for components (enables natural `import Component from './Component'` syntax)
- ✅ Barrel files re-export as named imports (standardized import pattern from slices)

---

### 2026-09-11 — Session 13

**Scope:** Section 3 — Styling & HTML (partial, ~28 violations resolved):
- JSDoc annotations: 21 files ✓
- px → rem conversions: 4 files ✓
- inline Box props: 3 fixes ✓

**Fix strategy (Phase 1):** Automated script-based fixes for high-confidence, low-risk changes.

#### Fix #1: JSDoc Annotations (21 files)

Added `/** @type {MuiSx} */` annotations to style functions in:

| File                                                                           | Status |
| ------------------------------------------------------------------------------ | ------ |
| `features/settings/ui/project-context/GenerateProjectContextReviewForm.jsx`    | ✓      |
| `features/artifacts/ui/bucket-access/ManagePermissionsModal.jsx`               | ✓      |
| `features/artifacts/ui/bucket-access/DefaultPermissionsBanner.jsx`             | ✓      |
| `features/skill/ui/generate-skill-modal/GenerateSkillReviewForm.jsx`           | ✓      |
| `features/skill/ui/skill-details/form/CreateSkillForm.jsx`                     | ✓      |
| `features/chat/participants/ui/ExpandedParticipants/ParticipantsAccordion.jsx` | ✓      |
| `features/chat/conversation-list/ui/folders/DraggableFolderItem.jsx`           | ✓      |
| `features/pipelines/flow-editor/ui/FlowEditor.jsx`                             | ✓      |
| `features/pipelines/flow-editor/ui/nodes/RunStateNodeGroup.jsx`                | ✓      |
| `features/pipelines/flow-editor/ui/nodes/DecisionNode/NormalDecisionNode.jsx`  | ✓      |
| `features/pipelines/flow-editor/ui/state/StateTypeSelector.jsx`                | ✓      |
| `features/agent/ui/generate-agent-modal/GenerateAgentReviewForm.jsx`           | ✓      |
| `features/agent/ui/agent-details/configurations/form/CreateAgentForm.jsx`      | ✓      |
| `features/agent/ui/agent-details/configurations/input/WelcomeMessageInput.jsx` | ✓      |
| `shared/ui/tooltip/InfoTooltip.jsx`                                            | ✓      |
| `shared/ui/switch/BaseSwitch.jsx`                                              | ✓      |
| `shared/ui/select/SingleSelectDropdown.jsx`                                    | ✓      |
| `shared/ui/select/SingleSelect.jsx`                                            | ✓      |
| `pages/skills/CreateSkill.jsx`                                                 | ✓      |
| `entities/version/ui/VersionDelete.jsx`                                        | ✓      |
| `entities/generate-entity-with-ai/ui/GenerateEntityModal.jsx`                  | ✓      |

#### Fix #2: px → rem Conversion (4 files, 5 violations)

| File                                                                 | Violations | Changes            |
| -------------------------------------------------------------------- | ---------- | ------------------ |
| `features/settings/lib/hooks/useModelConfiguration.hooks.jsx`        | 2          | `14px` → `0.875rem` |
| `features/chat/conversation-list/ui/conversations/Conversations.jsx` | 1          | `74px` → `4.625rem` |
| `features/pipelines/yaml-editor/ui/YamlCodeEditor.jsx`               | 1          | `400px` → `25rem`  |
| `pages/skills/EditSkill.jsx`                                         | 1          | `32px` → `2rem`    |

#### Fix #3: inline Box Props → sx (1 file, 3 fixes)

| File                                                                  | Changes                           |
| --------------------------------------------------------------------- | --------------------------------- |
| `features/pipelines/flow-editor/ui/settings/VariablesMappingItem.jsx` | `width="7.25rem"` → `sx={{ width: '7.25rem' }}` (×2) |
| `features/pipelines/flow-editor/ui/settings/VariablesMappingItem.jsx` | `flex={1}` → `sx={{ flex: 1 }}`   |

**Counters updated:**

- Section 3: `~48` violations → `~22` violations (−26 files modified)
  - JSDoc annotations: 21 files ✓
  - px → rem: 5 violations fixed (−5)
  - inline Box props: 3 violations fixed (−3)
  
- **Total: ~146 violations → ~120 violations** (−26 violations)

**Skipped (deferred to manual review):**

- **styled() API** (4 files): Complex component replacements requiring refactoring (e.g., `StyledControls`, `StyledFormControlLabel`)
- **Raw HTML tags** (9 files): Requires semantic analysis and browser testing to avoid regressions
- Remaining **8 JSDoc files** (not found — likely already have annotations or differ from audit paths)

**Build verification:** `npm run build` passed with no errors (52.07s) ✓

**Next steps:**

- Phase 2: Manual review of `styled()` usages and raw HTML replacements
- Phase 3: Verify no regressions with browser testing
