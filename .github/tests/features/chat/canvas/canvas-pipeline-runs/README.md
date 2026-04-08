# Canvas Pipeline Runs Test Cases

This folder contains test cases for the **Canvas Flow Editor Pipeline Runs** feature when pipelines are
executed from Chat → Conversation.

## Overview

The test cases validate the ability to view and interact with pipeline run information in the Canvas Flow
Editor when a pipeline is executed from Chat while the same pipeline is open in Canvas.

## Feature Coverage

### Key Functionality

- **Canvas Context Awareness**: Pipeline runs appear in Canvas only when the executed pipeline matches the
  opened pipeline
- **Run Display**: Show run chipsets with status icons and run numbers in Canvas Flow Editor
- **Multiple Runs Support**: Display current run separately with History Icon for grouped completed runs
- **Tab Navigation**: Preserve runs when switching between Flow ↔ YAML tabs
- **Cleanup Behavior**: Clear runs when navigating to Configuration tab or closing Canvas
- **Run Details**: View comprehensive run information via popup
- **Run Deletion**: Remove completed runs (except in-progress runs)

## Test Case Files

### 1. run-display-canvas.md

**Scenario ID:** CANVAS-PIPE-RUN-001  
**Test Cases:** CPR-001, CPR-002  
**Priority:** High

Validates that pipeline runs executed from chat appear in Canvas Flow Editor when the same pipeline is open,
with proper chipset display, History Icon grouping, and tab persistence.

**Coverage:**

- Run display in Canvas when pipeline executed from chat
- Redesigned chipset with status icon and run number
- History Icon appearance for 2+ runs
- Current run display separate from history
- Run persistence during Flow ↔ YAML tab switching

---

### 2. cleanup-operations.md

**Scenario ID:** CANVAS-PIPE-RUN-003  
**Test Cases:** CPR-004  
**Priority:** High

Validates that run information is properly cleaned when Canvas is closed or when navigating to Configuration
tab.

**Coverage:**

- Run cleanup on Canvas close
- Run cleanup when navigating to Configuration tab
- No run data persists after cleanup

---

### 3. status-icons.md

**Scenario ID:** CANVAS-PIPE-RUN-004  
**Test Cases:** CPR-005  
**Priority:** High

Validates status indicator icons for different pipeline run states in Canvas Flow Editor.

**Coverage:**

- Blue loading icon (in-progress runs)
- Green checkmark icon (successful runs)
- Red info icon (failed runs)
- Orange stop icon (manually stopped runs)
- Icon animations and visual distinctiveness

---

### 4. run-deletion.md

**Scenario ID:** CANVAS-PIPE-RUN-005  
**Test Cases:** CPR-006, CPR-007  
**Priority:** High

Validates run deletion functionality from Canvas Flow Editor, including deletion from history list, current
view, and in-progress run deletion restrictions.

**Coverage:**

- Run deletion from history list
- Run deletion from current view
- Run promotion when current run is deleted
- In-progress run deletion restrictions (CPR-007)
- Deletion availability after run completion

---

### 5. run-details-canvas.md

**Scenario ID:** CANVAS-PIPE-RUN-006  
**Test Cases:** CPR-008  
**Priority:** Medium

Validates the run details popup functionality when accessed from Canvas Flow Editor.

**Coverage:**

- Run details popup opens from current run in Canvas
- Run details popup opens from history list in Canvas
- Popup displays input/output data, status, timestamps

---

## Test Case Summary

| File                  | Scenario ID         | Test Case IDs    | Total Cases | Priority |
| --------------------- | ------------------- | ---------------- | ----------- | -------- |
| run-display-canvas.md | CANVAS-PIPE-RUN-001 | CPR-001, CPR-002 | 2           | High     |
| cleanup-operations.md | CANVAS-PIPE-RUN-003 | CPR-004          | 1           | High     |
| status-icons.md       | CANVAS-PIPE-RUN-004 | CPR-005          | 1           | High     |
| run-deletion.md       | CANVAS-PIPE-RUN-005 | CPR-006, CPR-007 | 2           | High     |
| run-details-canvas.md | CANVAS-PIPE-RUN-006 | CPR-008          | 1           | Medium   |
| **TOTAL**             | **5 Scenarios**     | **7 Test Cases** | **7**       | -        |

---

## Acceptance Criteria Coverage

| Acceptance Criteria                                     | Test Cases       | Status     |
| ------------------------------------------------------- | ---------------- | ---------- |
| AC1. Run Display in Canvas Flow Editor                  | CPR-001, CPR-002 | ✅ Covered |
| AC2. Redesigned Chipset with Status Icon and Run Number | CPR-001, CPR-005 | ✅ Covered |
| AC3. History Icon for 2+ Runs                           | CPR-002          | ✅ Covered |
| AC4. Current Run Displays Separately from History       | CPR-002          | ✅ Covered |
| AC5. Run Persistence Between Flow and YAML Tabs         | CPR-002          | ✅ Covered |
| AC6. Run Cleanup (Canvas Close & Config Tab)            | CPR-004          | ✅ Covered |
| AC7. Status Indicators (Loading, Success, Error, Stop)  | CPR-005          | ✅ Covered |
| AC8. Run Details Popup                                  | CPR-008          | ✅ Covered |
| AC9. Run Deletion                                       | CPR-006, CPR-007 | ✅ Covered |

---

## Canvas Workflow Overview

### Opening Pipeline in Canvas from Chat

1. Navigate to **Chat** page
2. Create a conversation or open existing one
3. In the right panel, locate **PIPELINES** section
4. Click **Add pipeline** button
5. Select the desired pipeline from the list
6. Hover over the pipeline block (do NOT click)
7. Click the **Edit pipeline** button (pencil icon) that appears on hover
8. Canvas opens with the pipeline in Flow Editor

### Executing Pipeline from Chat

1. With Canvas still open (do not close)
2. In the left panel (chat interface), type a message
3. Click **Run** button to execute the pipeline
4. Pipeline runs appear in the Canvas Flow Editor (right side)

### Key Points

- Pipeline must be added to chat participants before execution
- Canvas must remain open to see run information
- Runs only appear if executed pipeline matches opened pipeline in Canvas
- Flow Editor tab (not Configuration tab) shows run information

---

## Test Execution Order

### Smoke Test Suite (Essential Functionality)

Execute these test cases first to validate core functionality:

1. CPR-001 - Basic run display in Canvas from chat execution
2. CPR-002 - Multiple runs with History Icon

### Regression Test Suite (Complete Coverage)

Execute all 7 test cases in sequence for full regression testing.

---

## Test Data Requirements

### Pipelines

- Simple LLM pipelines for basic execution tests
- Pipelines that generate errors for error state testing
- Pipelines with longer execution for in-progress state testing

### Conversations

- Test conversations created in preconditions
- Conversations with pipeline participants added

### User Permissions Required

- `conversations.create` - Create test conversations
- `conversations.read` - View conversations
- `conversations.delete` - Delete test data
- `pipelines.list` - View pipelines
- `pipelines.create` - Create test pipelines
- `pipelines.read` - View pipeline details in Canvas
- `pipelines.execute` - Run pipelines from chat
- `pipelines.delete` - Delete test pipelines
- `pipelines.stop` - Stop running pipelines

### Test Environment

- URL: `{URL}` (e.g., https://dev.elitea.ai)
- Valid user credentials: `{Username}` / `{Password}`
- Project context: `{Project}`

---

## Important Testing Notes

### Canvas Specifics

- **Canvas opens from Chat**: Must add pipeline to conversation participants, then hover and click edit
  (pencil icon)
- **Execution from Chat**: Pipeline must be executed from chat interface (left panel), NOT from Canvas
- **Flow Editor tab**: Run information appears in Flow Editor tab, NOT Configuration tab
- **Context matching**: Runs only appear if executed pipeline ID matches opened pipeline in Canvas

### Known Considerations

- Multiple pipelines can be added to chat, but only matching pipeline shows runs in Canvas
- Canvas must remain open during execution to see runs appear
- Closing Canvas or navigating to Configuration tab clears all run information
- Run persistence only applies to Flow ↔ YAML tab switching, not Configuration tab

---
