import { describe, expect, it } from 'vitest';

import { ENHANCE_STEP_KEYS, EVAL_FIX_KIND } from '../../constants/evaluation.constants';
import {
  applyInstructionPatches,
  buildCoverageStats,
  computeEnhanceSteps,
  isAutoApplicableEvalFix,
  splitEvalFixes,
  toInstructionPatch,
} from '../enhanceFix.helpers';

describe('applyInstructionPatches', () => {
  it('replaces an exact single occurrence', () => {
    const result = applyInstructionPatches('Answer the question.', [
      { old_text: 'the question', replacement: 'the question and cite sources' },
    ]);

    expect(result).toEqual({ text: 'Answer the question and cite sources.', conflictIndex: -1 });
  });

  it('chains patches in order, each against the previous result', () => {
    const result = applyInstructionPatches('one two three', [
      { old_text: 'one', replacement: 'ONE' },
      { old_text: 'three', replacement: 'THREE' },
    ]);

    expect(result.text).toBe('ONE two THREE');
    expect(result.conflictIndex).toBe(-1);
  });

  it('replaces the whole text when replace_all is set', () => {
    const result = applyInstructionPatches('old instructions', [
      { replace_all: true, replacement: 'brand new instructions' },
    ]);

    expect(result).toEqual({ text: 'brand new instructions', conflictIndex: -1 });
  });

  it('reports a conflict when the anchor matches more than once', () => {
    const result = applyInstructionPatches('repeat repeat', [{ old_text: 'repeat', replacement: 'once' }]);

    expect(result.conflictIndex).toBe(0);
    expect(result.text).toBe('repeat repeat');
  });

  it('reports a conflict when the anchor is missing', () => {
    const result = applyInstructionPatches('some text', [{ old_text: 'absent', replacement: 'x' }]);

    expect(result.conflictIndex).toBe(0);
  });

  it('names the index of the patch whose anchor an earlier patch consumed', () => {
    const result = applyInstructionPatches('alpha beta', [
      { old_text: 'alpha', replacement: 'gamma' },
      { old_text: 'alpha', replacement: 'delta' },
    ]);

    expect(result.conflictIndex).toBe(1);
  });

  it('treats missing instructions as empty text', () => {
    const result = applyInstructionPatches(null, [{ replace_all: true, replacement: 'fresh' }]);

    expect(result.text).toBe('fresh');
  });
});

describe('splitEvalFixes', () => {
  const fixes = [
    { kind: EVAL_FIX_KIND.dimensionRubric },
    { kind: EVAL_FIX_KIND.datasetCaseExpected },
    { kind: EVAL_FIX_KIND.dimensionTarget },
    { kind: EVAL_FIX_KIND.datasetCoverageGap },
  ];

  it('groups fixes by step and keeps their index in the proposal', () => {
    const { dimensionFixes, datasetFixes } = splitEvalFixes(fixes);

    expect(dimensionFixes.map(entry => entry.index)).toEqual([0, 2]);
    expect(datasetFixes.map(entry => entry.index)).toEqual([1, 3]);
  });

  it('handles a missing list', () => {
    expect(splitEvalFixes()).toEqual({ dimensionFixes: [], datasetFixes: [] });
  });
});

describe('isAutoApplicableEvalFix', () => {
  it('accepts the kinds that patch something that already exists', () => {
    expect(isAutoApplicableEvalFix({ kind: EVAL_FIX_KIND.dimensionRubric })).toBe(true);
    expect(isAutoApplicableEvalFix({ kind: EVAL_FIX_KIND.dimensionTarget })).toBe(true);
    expect(isAutoApplicableEvalFix({ kind: EVAL_FIX_KIND.datasetCaseExpected })).toBe(true);
  });

  it('rejects a coverage gap, which has no target to patch', () => {
    expect(isAutoApplicableEvalFix({ kind: EVAL_FIX_KIND.datasetCoverageGap })).toBe(false);
  });
});

describe('computeEnhanceSteps', () => {
  it('always starts with analysis and adds only the steps that have content', () => {
    const steps = computeEnhanceSteps({
      agent_fixes: [{ old_text: 'a', replacement: 'b' }],
      eval_fixes: [{ kind: EVAL_FIX_KIND.dimensionRubric }],
    });

    expect(steps.map(step => step.key)).toEqual([
      ENHANCE_STEP_KEYS.analysis,
      ENHANCE_STEP_KEYS.instructions,
      ENHANCE_STEP_KEYS.dimensions,
    ]);
  });

  it('leaves only analysis for an empty proposal', () => {
    expect(computeEnhanceSteps({ agent_fixes: [], eval_fixes: [] }).map(step => step.key)).toEqual([
      ENHANCE_STEP_KEYS.analysis,
    ]);
  });
});

describe('toInstructionPatch', () => {
  it('keeps only the fields the fork endpoint accepts', () => {
    expect(
      toInstructionPatch({
        old_text: 'a',
        replacement: 'b',
        rationale: 'because',
        cited_case_ids: [111],
      }),
    ).toEqual({ old_text: 'a', replacement: 'b', replace_all: false });
  });
});

describe('buildCoverageStats', () => {
  it('drops counters the response did not report', () => {
    const stats = buildCoverageStats({ total_cases: 2, missed_bindings: 1, total_bindings: 1 });

    expect(stats.map(stat => stat.label)).toEqual(['CASES EVALUATED', 'TARGETS MISSED']);
    expect(stats.map(stat => stat.value)).toEqual([2, 1]);
  });

  it('adds an "of N" suffix to missed targets only when the total is known', () => {
    const [, withTotal] = buildCoverageStats({ total_cases: 2, missed_bindings: 1, total_bindings: 4 });
    const [, withoutTotal] = buildCoverageStats({ total_cases: 2, missed_bindings: 1 });

    expect(withTotal.valueSuffix).toBe('of 4');
    expect(withoutTotal.valueSuffix).toBeUndefined();
  });

  it('survives a missing coverage block', () => {
    expect(buildCoverageStats(undefined)).toEqual([]);
    expect(buildCoverageStats(null)).toEqual([]);
  });
});
