/**
 * Unit tests for mapAssociationError (FIX #5717)
 *
 * Tests the pure mapping function independently of the React hook.
 * Run with: npx vitest run src/hooks/application/useAgentPipelineAssociation.test.js
 *
 * The heavy transitive deps (Redux store, localStorage, SVG imports) are mocked out
 * so this runs in the default Node environment without jsdom.
 */
import { describe, expect, it, vi } from 'vitest';

import { mapAssociationError, wouldExceedAgentNestingDepth } from './useAgentPipelineAssociation';

// Mock transitive deps that pull in browser APIs or SVG loaders before importing the module
vi.mock('@/common/utils', () => ({
  buildErrorMessage: vi.fn(err => (typeof err === 'string' ? err : err?.message || '')),
}));
vi.mock('@/[fsd]/features/agent/lib/hooks', () => ({ useSetRefetchDetails: vi.fn() }));
vi.mock('@/api/applications', () => ({
  useLazyApplicationDetailsQuery: vi.fn(),
  useUpdateApplicationRelationMutation: vi.fn(),
}));
vi.mock('@/assets/flow-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/ApplicationsIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: vi.fn() }));
vi.mock('@/hooks/useToast', () => ({ default: vi.fn() }));
vi.mock('formik', () => ({ useFormikContext: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: vi.fn() }));

describe('mapAssociationError', () => {
  // Test plan item 4: Regression — add-path in useAgentPipelineAssociation
  // Verifies the export did not break the original add-path circular-ref message
  it('maps circular reference error to friendly add-path message', () => {
    const rawError =
      'Adding this agent would create a circular reference: application 801 is already reachable from application 804.';
    const result = mapAssociationError(rawError, 'MyAgent');
    expect(result).toContain('MyAgent');
    expect(result).toContain('circular agent reference');
    expect(result).toContain('Cannot add');
    // Must not expose raw integer IDs
    expect(result).not.toContain('801');
    expect(result).not.toContain('804');
  });

  it('maps cycle-keyword error to circular add-path message', () => {
    const rawError = 'cycle detected: agent 12 already references agent 9';
    const result = mapAssociationError(rawError, 'PipelineX');
    expect(result).toContain('PipelineX');
    expect(result).toContain('circular agent reference');
  });

  it('maps sub-agent nesting error to cannot-nest message', () => {
    const rawError = 'sub-agent nesting limit exceeded';
    const result = mapAssociationError(rawError, 'NestAgent');
    expect(result).toContain('NestAgent');
    expect(result).toContain('sub-agent chain is too deep');
  });

  it('maps uses-other-agents backend error to cannot-nest message', () => {
    const rawError = 'agent uses other agents and cannot be nested here';
    const result = mapAssociationError(rawError, 'ContainerAgent');
    expect(result).toContain('ContainerAgent');
    expect(result).toContain('sub-agent chain is too deep');
  });

  it('adds the make-default-leaf-version tip on the ADD path only', () => {
    const rawError = 'agent uses other agents and cannot be added as a sub-agent';
    const addResult = mapAssociationError(rawError, 'ContainerAgent', { action: 'add' });
    expect(addResult).toContain('make a shallower version');
    expect(addResult).toContain('default');
    // The tip is default-version advice; it is WRONG for switch (binds the picked version) and for
    // status (already-attached). Those must NOT carry it.
    const switchResult = mapAssociationError(rawError, 'ContainerAgent', {
      action: 'switch',
      versionLabel: 'v2',
    });
    expect(switchResult).not.toContain('make a version');
    const statusResult = mapAssociationError(rawError, 'ContainerAgent', { action: 'status' });
    expect(statusResult).not.toContain('make a version');
  });

  it('maps bind-itself error to self-reference message', () => {
    const rawError = 'Cannot bind agent to itself.';
    const result = mapAssociationError(rawError, 'SelfAgent');
    expect(result).toContain('SelfAgent');
    expect(result).toContain('itself');
  });

  it('passes through unknown errors unchanged', () => {
    const rawError = 'Version not found';
    const result = mapAssociationError(rawError, 'AnyAgent');
    expect(result).toBe('Version not found');
  });

  it('handles non-string error objects via buildErrorMessage fallback', () => {
    // Object errors should be processed through buildErrorMessage
    const rawError = { message: 'Version not found' };
    const result = mapAssociationError(rawError, 'AnyAgent');
    // Should not throw, and should return something non-circular
    expect(typeof result).toBe('string');
    expect(result).not.toContain('circular agent reference');
  });

  // --- switch action (version-switch flow, issue #5717) ---------------------
  it('maps circular error to a switch-phrased message with the version label', () => {
    const rawError =
      'Adding this agent would create a circular reference: application 801 version 1424 is already reachable from application 804.';
    const result = mapAssociationError(rawError, 'PipelineA', {
      action: 'switch',
      versionLabel: 'base – 06.07.2026',
      entityLabel: 'pipeline',
    });
    expect(result).toContain('switch "PipelineA"');
    expect(result).toContain('to version base – 06.07.2026');
    expect(result).toContain('circular reference');
    expect(result).not.toContain('801');
    expect(result).not.toContain('804');
    expect(result).not.toContain('1424');
  });

  it('maps leaf-only / uses-other-agents error on a SWITCH to a friendly message (not raw)', () => {
    const rawError =
      "'base' uses other agents and cannot be added as a sub-agent. Run it directly as a chat participant, or add only leaf agents.";
    const result = mapAssociationError(rawError, 'AgentA', {
      action: 'switch',
      versionLabel: 'base – 06.07.2026',
      entityLabel: 'agent',
    });
    expect(result).toContain('switch "AgentA"');
    expect(result).toContain('sub-agent chain is too deep');
    expect(result).toContain('shallower chain');
    // Must NOT be the raw backend string
    expect(result).not.toBe(rawError);
  });

  it('omits the version phrase when no versionLabel is given on a switch', () => {
    const result = mapAssociationError('circular reference', 'AgentA', { action: 'switch' });
    expect(result).toContain('switch "AgentA"');
    expect(result).not.toContain('to version');
  });

  it('add action is unchanged by the new opts (default behavior)', () => {
    const result = mapAssociationError('circular', 'AgentA');
    expect(result).toContain('Cannot add "AgentA"');
    expect(result).toContain('circular agent reference');
  });

  // --- status action (inline tool-card message, issue #5717) ----------------
  it('maps circular error to a status-phrased card message without raw IDs', () => {
    const rawError =
      'Adding this agent would create a circular reference: application 801 is already reachable from application 804.';
    const result = mapAssociationError(rawError, 'AgentA', { action: 'status', entityLabel: 'agent' });
    expect(result).toContain('use "AgentA"');
    expect(result).toContain('circular reference');
    expect(result).not.toContain('801');
    expect(result).not.toContain('804');
    expect(result).not.toBe(rawError);
  });

  it('maps leaf-only / uses-other-agents error to a friendly status card message (not raw)', () => {
    const rawError =
      "'base' uses other agents and cannot be added as a sub-agent. Run it directly as a chat participant, or add only leaf agents.";
    const result = mapAssociationError(rawError, 'AgentA', { action: 'status', entityLabel: 'pipeline' });
    expect(result).toContain('use "AgentA"');
    expect(result).toContain('nests agents too deeply');
    expect(result).toContain('shallower chain');
    expect(result).not.toBe(rawError);
  });

  it('status action passes unknown errors through unchanged (card keeps generic fallback)', () => {
    // The consumer relies on the mapper returning the RAW string for unrecognized errors so it can
    // detect "not recognized" and fall back to its generic sentence.
    const rawError = 'some unrelated backend failure';
    const result = mapAssociationError(rawError, 'AgentA', { action: 'status' });
    expect(result).toBe(rawError);
  });
});

describe('wouldExceedAgentNestingDepth', () => {
  it('accepts A -> B -> C and rejects a fourth agent tier', () => {
    expect(wouldExceedAgentNestingDepth(2, 3)).toBe(false);
    expect(wouldExceedAgentNestingDepth(3, 3)).toBe(true);
  });

  it('defers to the backend when depth metadata is absent', () => {
    expect(wouldExceedAgentNestingDepth(undefined, 3)).toBe(false);
    expect(wouldExceedAgentNestingDepth(3, undefined)).toBe(false);
  });
});
