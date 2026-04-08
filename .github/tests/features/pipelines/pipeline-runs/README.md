# Pipeline Runs Test Cases

This folder contains comprehensive test cases for the **Pipeline Runs Flow View Redesign** feature.

## Overview

The test cases in this folder validate the enhancement and redesign of showing Pipeline Runs on the Flow View,
including:

- Redesigned run chipset with status icons and run numbers
- History Icon for grouping multiple runs
- Status indicators for different run states (in-progress, success, error, stopped)
- Run deletion operations with proper restrictions
- Run details popup for viewing comprehensive run information
- Page refresh behavior and run persistence

## Test Case Files

### 1. chipset-and-history.md

**Scenario ID:** PIPE-RUN-001  
**Test Cases:** PR-001  
**Priority:** High

Validates the redesigned run chipset display, History Icon grouping functionality, and history list
interaction, ensuring proper visualization, separation of current runs from history, and history list content.

**Coverage:**

- Redesigned chipset with status icon and run number
- History Icon visibility (appears when 2+ runs exist)
- Current run display separate from history group
- History list display with run numbers and status icons
- History Icon click interaction

---

### 2. status-indicators.md

**Scenario ID:** PIPE-RUN-002  
**Test Cases:** PR-002, PR-003, PR-004, PR-005  
**Priority:** High

Validates all status indicator icons across different pipeline run states.

**Coverage:**

- Blue loading icon for in-progress runs
- Green checkmark icon for successful runs
- Red info icon for runs with errors
- Orange stop icon for manually stopped runs

---

### 3. run-deletion.md

**Scenario ID:** PIPE-RUN-003  
**Test Cases:** PR-006, PR-007  
**Priority:** High

Validates run deletion functionality with proper restrictions and permissions.

**Coverage:**

- Successful deletion from both current view and history list (consolidated)
- Restriction on deleting in-progress runs (must stop first)

---

### 4. run-details-popup.md

**Scenario ID:** PIPE-RUN-004  
**Test Cases:** PR-008, PR-009  
**Priority:** High

Validates the run details popup functionality for viewing comprehensive run information.

**Coverage:**

- Popup opens from both current run chipset and history list (consolidated)
- Error information display in popup

---

### 5. tab-switching.md

**Scenario ID:** PIPE-RUN-005  
**Test Cases:** PR-010  
**Priority:** High

Validates run persistence when switching between Flow View and YAML View tabs.

**Coverage:**

- Run chipsets persist during tab switching
- History Icon remains visible in both views
- Run data integrity maintained across views

---

## Test Case Summary

| File                   | Scenario ID     | Test Case IDs                  | Total Cases | Priority |
| ---------------------- | --------------- | ------------------------------ | ----------- | -------- |
| chipset-and-history.md | PIPE-RUN-001    | PR-001                         | 1           | High     |
| status-indicators.md   | PIPE-RUN-002    | PR-002, PR-003, PR-004, PR-005 | 4           | High     |
| run-deletion.md        | PIPE-RUN-003    | PR-006, PR-007                 | 2           | High     |
| run-details-popup.md   | PIPE-RUN-004    | PR-008, PR-009                 | 2           | High     |
| tab-switching.md       | PIPE-RUN-005    | PR-010                         | 1           | High     |
| **TOTAL**              | **5 Scenarios** | **10 Test Cases**              | **10**      | -        |

---

## Feature Coverage

### Acceptance Criteria Mapped to Test Cases

| Acceptance Criteria            | Test Cases                     | Status     |
| ------------------------------ | ------------------------------ | ---------- |
| 1. Redesigned Run Chipset      | PR-001                         | ✅ Covered |
| 2. Grouping under History Icon | PR-001                         | ✅ Covered |
| 3. Current Run Display         | PR-001                         | ✅ Covered |
| 4. History Icon Behavior       | PR-001                         | ✅ Covered |
| 5. Page Refresh Behavior       | Not currently tested           | ⚠️ Gap     |
| 6. Status Indicators           | PR-002, PR-003, PR-004, PR-005 | ✅ Covered |
| 7. Deletion of Runs            | PR-006, PR-007                 | ✅ Covered |
| 8. Run Details Popup           | PR-008, PR-009                 | ✅ Covered |

---

## Test Execution Order

### Smoke Test Suite (Essential Functionality)

Execute these test cases first to validate core functionality:

1. PR-001 - Redesigned chipset display, History Icon grouping, and history list interaction
2. PR-006 - Run deletion functionality
3. PR-008 - Run details popup from current run

### Regression Test Suite (Complete Coverage)

Execute all 10 test cases in sequence for full regression testing.

## Test Data Requirements

### Pipelines

Each test case creates its own pipeline with specific configurations:

- Simple pipelines (Input → Output) for basic tests
- Pipelines with delays for in-progress state testing
- Pipelines with errors for error state testing
- Pipelines with complex output for data display testing

### User Permissions Required

- `pipelines.list` - View pipelines
- `pipelines.create` - Create test pipelines
- `pipelines.read` - View pipeline details
- `pipelines.execute` - Run pipelines
- `pipelines.delete` - Delete test data
- `pipelines.stop` - Stop running pipelines (for stop tests)

### Test Environment

- URL: `{URL}` (e.g., https://dev.elitea.ai)
- Valid user credentials: `{Username}` / `{Password}`
- Project context: `{Project}`

---

## Design References

- [Figma Design - Run Chipset](https://www.figma.com/design/5vWxC85QBhqbzPU30RP7LH/EliteA.-Prompt-Library?node-id=13557-172934)
- [Figma Design - History Icon](https://www.figma.com/design/5vWxC85QBhqbzPU30RP7LH/EliteA.-Prompt-Library?node-id=17953-251789)

---

## Notes for QA

### Key Test Areas

1. **Visual Verification**: All status icons must match the design specifications (colors, shapes)
2. **Interaction Testing**: Clicks, hovers, and UI responsiveness
3. **Data Integrity**: Run details must be accurate and complete
4. **Edge Cases**: Refresh timing, rapid execution, complex data
5. **Performance**: Large history lists, complex output data

### Known Considerations

- Run numbering continues sequentially even after refresh
- Only active runs persist through page refresh
- Delete restrictions prevent accidental removal of active runs
- History Icon only appears when 2+ total runs exist
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality

---

## Automation Readiness

These test cases are designed to be **Playwright-ready** with:

- Detailed step-by-step instructions
- Explicit UI element selectors
- Clear verification points
- Complete setup and teardown procedures
- Self-contained test data creation

### Automation Priority

1. **High Priority** (Smoke tests): PR-001, PR-002, PR-003, PR-006, PR-008
2. **Medium Priority** (Core functionality): PR-004, PR-005, PR-007, PR-009
3. **Lower Priority** (Edge cases): PR-010

---

**Last Updated:** November 21, 2025  
**Version:** 4.0 (Optimized with PR-XXX Naming Convention)  
**Pattern:** Enhanced Test Case Pattern with Detailed Preconditions/Postconditions  
**Optimization:** Reduced from 21 to 10 tests (52% reduction) while maintaining core AC coverage  
**Naming Convention:** Scenario IDs use PIPE-RUN-XXX format, Test IDs use PR-XXX format
