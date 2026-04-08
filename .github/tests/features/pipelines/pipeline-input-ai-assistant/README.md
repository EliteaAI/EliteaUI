# Input AI Assistant Test Suite

## Overview

This test suite validates the **Input AI Assistant** feature for pipeline nodes in EliteA UI. The AI Assistant
helps users generate and improve field content using AI-powered suggestions, streamlining pipeline
configuration and enhancing content quality.

### Feature Description

The Input AI Assistant provides:

- **AI-powered content generation** from user prompts
- **Content improvement** for existing field values
- **Iterative refinement** through multiple improvement cycles
- (not implemented) **Contextual awareness** based on node type and field purpose
- **Side-by-side comparison** of current vs improved content
- **User control** over content application
- **Model integration** using pipeline-configured LLM

### Supported Nodes and Fields

The AI Assistant is available for:

- **Decision node**: Description field
- **Router node**: Condition field
- **State Modifier node**: Jinja Template field
- **LLM node**: System and Task fields (only f-string/fixed types, NOT variable type)
- **Code node**: Code field (only f-string/fixed types, NOT variable type)

## Test Suite Structure

### Availability Tests (`availability/` folder)

Basic tests verifying AI Assistant icon appears, interface opens, and content can be generated for each
supported node type.

| Test Case ID | Test Case Name                                                               | File                                  | Node Type      | Field Tested   |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------------- | -------------- | -------------- |
| PAAN-001     | Verify AI Assistant availability on Decision node Description field          | `availability/decision-node.md`       | Decision       | Description    |
| PAAN-002     | Verify AI Assistant availability on Router node Condition field              | `availability/router-node.md`         | Router         | Condition      |
| PAAN-003     | Verify AI Assistant availability on State Modifier node Jinja Template field | `availability/state-modifier-node.md` | State Modifier | Jinja Template |
| PAAN-004     | Verify AI Assistant availability on LLM node System and Task fields          | `availability/llm-node.md`            | LLM            | System & Task  |
| PAAN-005     | Verify AI Assistant availability on Code node Code field                     | `availability/code-node.md`           | Code           | Code           |

### Functionality Tests (main folder)

Comprehensive tests focusing on LLM node, validating core functionality, and including pipeline execution to
verify AI-generated content works correctly.

| Test Case ID | Test Case Name                                              | File                                | Focus Area           |
| ------------ | ----------------------------------------------------------- | ----------------------------------- | -------------------- |
| PAAF-001     | Verify AI Assistant generates new content from user prompts | `content-generation-improvement.md` | Content generation   |
| PAAF-002     | Verify AI Assistant improves existing content               | `content-generation-improvement.md` | Content improvement  |
| PAAF-003     | Verify AI Assistant supports iterative improvements         | `iterative-improvements.md`         | Iterative refinement |
| PAAF-004     | Verify AI Assistant uses pipeline-configured LLM model      | `model-integration.md`              | Model integration    |
| PAAF-005     | Verify users can edit AI-generated content before applying  | `ux-error-handling.md`              | Content editing & UX |
| PAAF-006     | Verify AI Assistant processing indicators and user control  | `ux-error-handling.md`              | Error handling & UX  |

## Acceptance Criteria Coverage

### Story Acceptance Criteria Mapping

| AC#  | Acceptance Criteria                                                                          | Test Coverage                                       |
| ---- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| AC1  | AI Assistant icon appears on hover for Decision, Router, State Modifier, LLM, and Code nodes | PAAN-001 through PAAN-005                           |
| AC2  | Clicking AI icon opens input interface with placeholder text                                 | All availability tests + all functionality tests    |
| AC3  | Send button triggers AI content generation                                                   | All availability tests + all functionality tests    |
| AC4  | Side-by-side comparison: "Current Option" vs "Improved Option"                               | All functionality tests (PAAF-001 through PAAF-006) |
| AC5  | Apply button applies AI suggestion to field                                                  | All availability tests + all functionality tests    |
| AC6  | AI Assistant uses pipeline-configured LLM model                                              | PAAF-004                                            |
| AC7  | Appropriate error messaging when no model configured                                         | PAAF-004                                            |
| AC8  | Iterative improvements supported                                                             | PAAF-003                                            |
| AC9  | Contextual awareness based on node type and field                                            | not implemented                                     |
| AC10 | User control - no auto-application                                                           | PAAF-006                                            |
| AC11 | Processing indicators during generation                                                      | PAAF-006                                            |
| AC12 | Graceful error handling                                                                      | PAAF-006                                            |

### Feature Requirements Coverage

| Requirement                                   | Test Cases                |
| --------------------------------------------- | ------------------------- |
| Field type restrictions (f-string/fixed only) | PAAN-004, PAAN-005        |
| Generate content from empty fields            | PAAF-001                  |
| Improve existing content                      | PAAF-002                  |
| Multiple improvement cycles                   | PAAF-003                  |
| Model integration and configuration           | PAAF-004                  |
| Contextual appropriateness                    | PAAN-001 through PAAN-005 |
| Content editing before applying               | PAAF-005                  |
| Error handling and recovery                   | PAAF-006                  |
| User control and content preservation         | PAAF-006                  |

## Test Execution Guidelines

### Recommended Execution Order

1. **Smoke Tests**
   - PAAF-001: Verify AI Assistant generates new content from user prompts
   - PAAF-002: Verify AI Assistant improves existing content

2. **Regression Tests**
   - All smoke tests above
   - PAAN-001 through PAAN-005 (availability for all node/field types)
   - PAAF-003: Iterative improvements
   - PAAF-004: Model integration
   - PAAF-005: Edit AI-generated content before applying
   - PAAF-006: Processing indicators and user control

### Execution Strategies

**Quick Smoke Test** (≈10 minutes):

- Run PAAF-001 (basic generation)
- Run PAAF-002 (content improvement)

**Regression Suite** (≈45 minutes):

- Run all smoke tests
- Run all availability and advanced/UX tests
- Validates complete feature functionality

**Pre-Release Validation** (≈60 minutes):

- Run complete regression suite
- Execute tests with different LLM models
- Test with various prompt complexities
- Validate across different user permission levels

## Important Testing Notes

### Pipeline Configuration

- **All tests require valid LLM model configuration** except PAAF-004 (which tests missing model scenario)
- **Make entrypoint** is used in all test pipelines to enable Configuration tab execution
- **Path icon verification** confirms entrypoint is properly set
- Tests include pipeline execution steps to validate AI-generated content is functional

### Field Type Restrictions

- **LLM node** System and Task fields: AI Assistant only available for **f-string** or **fixed** type, NOT
  **variable** type
- **Code node** Code field: AI Assistant only available for **f-string** or **fixed** type, NOT **variable**
  type
- Tests PAAN-004 and PAAN-005 explicitly validate these restrictions

### AI Assistant Behavior: Auto-Apply vs Manual-Apply

**Critical behavior difference based on field state:**

- **Empty fields (no content):**
  - Generated content is **automatically applied** to the field
  - No side-by-side comparison is shown
  - No "Apply" button appears
  - Content appears directly in the field after generation completes
  - Behavior tested in: PAAF-001 (first generation)

- **Fields with existing content:**
  - Side-by-side comparison is displayed:
    - "Current Option" (left) shows existing field content
    - "Improved Option" (right) shows AI-generated content
  - **Apply button is required** to update the field
  - User has explicit control to review before applying
  - Original content is preserved until Apply is clicked
  - Behavior tested in: All availability tests, PAAF-001 (second generation), PAAF-002, PAAF-003, PAAF-005,
    PAAF-006
