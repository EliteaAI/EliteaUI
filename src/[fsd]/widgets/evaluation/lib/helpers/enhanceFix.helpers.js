import {
  AUTO_APPLICABLE_EVAL_FIX_KINDS,
  ENHANCE_STEP_KEYS,
  EVAL_FIX_KIND,
} from '../constants/evaluation.constants';

const DIMENSION_FIX_KINDS = [EVAL_FIX_KIND.dimensionRubric, EVAL_FIX_KIND.dimensionTarget];

const DATASET_FIX_KINDS = [EVAL_FIX_KIND.datasetCaseExpected, EVAL_FIX_KIND.datasetCoverageGap];

export const isAutoApplicableEvalFix = fix => AUTO_APPLICABLE_EVAL_FIX_KINDS.includes(fix?.kind);

/**
 * Split eval_fixes into the two review steps, keeping each fix's index in the original
 * proposal array — the accept/decline flags are stored by that index, so a filtered list
 * that renumbered its items would toggle the wrong fix.
 */
export const splitEvalFixes = (evalFixes = []) => {
  const indexed = evalFixes.map((fix, index) => ({ fix, index }));
  return {
    dimensionFixes: indexed.filter(({ fix }) => DIMENSION_FIX_KINDS.includes(fix.kind)),
    datasetFixes: indexed.filter(({ fix }) => DATASET_FIX_KINDS.includes(fix.kind)),
  };
};

/**
 * Apply accepted instruction patches in order, mirroring apply_instructions_patch_batch in
 * elitea_core: an exact replacement must match exactly once, and replace_all swaps the whole
 * text. Returns the index of the first patch that could not be applied so the UI can say which
 * suggestion no longer fits instead of silently previewing something the server would reject.
 */
export const applyInstructionPatches = (instructions, patches = []) => {
  let text = instructions ?? '';

  for (let index = 0; index < patches.length; index += 1) {
    const patch = patches[index];

    if (patch.replace_all) {
      text = patch.replacement ?? '';
      continue;
    }

    const oldText = patch.old_text ?? '';
    if (!oldText) return { text, conflictIndex: index };

    const firstMatch = text.indexOf(oldText);
    const isUnique = firstMatch !== -1 && text.indexOf(oldText, firstMatch + oldText.length) === -1;
    if (!isUnique) return { text, conflictIndex: index };

    text = text.slice(0, firstMatch) + (patch.replacement ?? '') + text.slice(firstMatch + oldText.length);
  }

  return { text, conflictIndex: -1 };
};

/** Strip an accepted agent fix down to the fields the fork endpoint accepts. */
export const toInstructionPatch = fix => ({
  old_text: fix.old_text,
  replacement: fix.replacement,
  replace_all: fix.replace_all || false,
});

/** Only the steps a given proposal has something to show for. Analysis is always present. */
export const computeEnhanceSteps = proposal => {
  const { dimensionFixes, datasetFixes } = splitEvalFixes(proposal?.eval_fixes);
  const steps = [{ key: ENHANCE_STEP_KEYS.analysis, label: 'Analysis' }];

  if ((proposal?.agent_fixes?.length ?? 0) > 0)
    steps.push({ key: ENHANCE_STEP_KEYS.instructions, label: 'Agent Instructions' });

  if (dimensionFixes.length > 0) steps.push({ key: ENHANCE_STEP_KEYS.dimensions, label: 'Dimensions' });

  if (datasetFixes.length > 0) steps.push({ key: ENHANCE_STEP_KEYS.datasetCases, label: 'Dataset Cases' });

  return steps;
};

/**
 * The handful of coverage counters worth showing — the rest are analysis-tuning knobs.
 * Shaped for a KPI card: a headline number, an optional "of N" suffix and a caption.
 */
export const buildCoverageStats = (coverage = {}) => {
  if (!coverage) return [];

  const stats = [
    {
      label: 'CASES EVALUATED',
      value: coverage.total_cases,
      subtitle: 'cases scored in this run',
    },
    {
      label: 'TARGETS MISSED',
      value: coverage.missed_bindings,
      valueSuffix: Number.isFinite(coverage.total_bindings) ? `of ${coverage.total_bindings}` : undefined,
      subtitle: 'success criteria not met',
    },
    {
      label: 'DIMENSIONS WITH GAPS',
      value: coverage.gap_dimensions_total,
      subtitle: 'dimensions scoring low',
    },
    {
      label: 'CASES BELOW TARGET',
      value: coverage.missed_cases_total,
      subtitle: 'cases needing attention',
    },
  ];

  return stats.filter(stat => Number.isFinite(stat.value));
};
