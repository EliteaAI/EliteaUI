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

import { mapAssociationError } from './useAgentPipelineAssociation';

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
    expect(result).toContain('uses other agents');
  });

  it('maps uses-other-agents backend error to cannot-nest message', () => {
    const rawError = 'agent uses other agents and cannot be nested here';
    const result = mapAssociationError(rawError, 'ContainerAgent');
    expect(result).toContain('ContainerAgent');
    expect(result).toContain('uses other agents');
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
});
