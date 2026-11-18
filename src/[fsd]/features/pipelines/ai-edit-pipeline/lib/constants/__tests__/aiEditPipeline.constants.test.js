import { describe, expect, it } from 'vitest';

import { AI_EDIT_PIPELINE_STEPS } from '../aiEditPipeline.constants';

describe('AI_EDIT_PIPELINE_STEPS', () => {
  it('contains exactly four steps', () => {
    expect(AI_EDIT_PIPELINE_STEPS).toHaveLength(4);
  });

  it('has the correct keys in order', () => {
    expect(AI_EDIT_PIPELINE_STEPS.map(s => s.key)).toEqual([
      'yaml',
      'run-settings',
      'tools-skills',
      'summary',
    ]);
  });

  it('every step has a non-empty label', () => {
    AI_EDIT_PIPELINE_STEPS.forEach(step => {
      expect(typeof step.label).toBe('string');
      expect(step.label.length).toBeGreaterThan(0);
    });
  });
});
