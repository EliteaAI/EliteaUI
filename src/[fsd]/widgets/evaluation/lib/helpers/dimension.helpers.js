import {
  EVAL_ENGINE,
  EVAL_POLARITY,
  EVAL_SCALE_TYPE,
  EVAL_TIER,
  IMPORTANCE,
  IMPORTANCE_WEIGHT_MAP,
  NEW_ITEM_EVIDENCE_SCOPE,
  SCALE_TYPE_PRESET,
  SCALE_TYPE_PRESET_CONFIG,
} from '../constants';

export const buildDimensionLookupMap = (dimensions = []) => {
  const map = new Map();
  dimensions.forEach(d => {
    map.set(d.id, d);
    // Alias by local_dimension_id so platform-materialised dimensions are
    // found by either their catalog id or their project-local id.
    // Only set if the local id isn't already claimed by a canonical entry.
    if (d.local_dimension_id != null && !map.has(d.local_dimension_id)) {
      map.set(d.local_dimension_id, d);
    }
  });
  return map;
};

export const findDimensionByBindingId = (dimensions, dimensionId) => {
  if (dimensionId == null) return null;
  // Priority 1: exact id match for non-platform dimensions (project/agent_adhoc)
  const nonPlatformMatch = dimensions.find(d => d.id === dimensionId && d.tier !== EVAL_TIER.platform);
  if (nonPlatformMatch) return nonPlatformMatch;
  // Priority 2: local_dimension_id match for platform dimensions (materialized)
  const platformByLocalId = dimensions.find(d => d.local_dimension_id === dimensionId);
  if (platformByLocalId) return platformByLocalId;
  // Priority 3: fallback to any id match
  return dimensions.find(d => d.id === dimensionId) || null;
};

export const getDefaultDimensionFormState = () => ({
  name: '',
  isShared: false,
  evaluator: EVAL_ENGINE.ai,
  evaluationInstructions: '',
  evaluationGuidance: '',
  validationCode: '',
  evaluationTarget: { ...NEW_ITEM_EVIDENCE_SCOPE },
  scaleTypePreset: SCALE_TYPE_PRESET.score,
  // Set when the loaded record carried a scale the presets cannot express, so saving preserves it
  // instead of flattening an ordinal scale into a continuous one.
  customScaleType: null,
  // A record that carried no scale at all must not be saved back with the default preset's scale.
  hasKnownScale: true,
  customMin: '',
  customMax: '',
  polarity: EVAL_POLARITY.higher_better,
  successCriteria: '>=',
  targetValue: '',
  importance: IMPORTANCE.medium,
  customImportanceValue: '',
});

const toScaleBound = value => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * Picks the scale preset for a stored dimension. `scale_type` is authoritative — the bounds only
 * choose between presets that share a type — because classifying on the bounds alone sent every
 * scale it did not recognise (an ordinal that is not exactly 1..5, or a record whose bounds were
 * not loaded) to the default Score preset, which then overwrote the real scale on save.
 */
const resolveScalePresetFields = dimension => {
  const scaleType = dimension.scale_type ?? null;
  const min = toScaleBound(dimension.scale_min);
  const max = toScaleBound(dimension.scale_max);

  // The Pass/Fail preset supplies its own bounds, so it is the one type that needs nothing else.
  if (scaleType === EVAL_SCALE_TYPE.binary) {
    return { scaleTypePreset: SCALE_TYPE_PRESET.passFail };
  }

  // Nothing dependable to classify from. Flagging the scale unknown keeps the save from writing the
  // default preset over the stored one, and a Custom preset with empty bounds would fail validation
  // and leave the dimension un-saveable.
  if (min == null || max == null) return { hasKnownScale: false };

  const asCustom = () => ({
    scaleTypePreset: SCALE_TYPE_PRESET.custom,
    customScaleType: scaleType,
    customMin: String(min),
    customMax: String(max),
  });

  if (scaleType === EVAL_SCALE_TYPE.ordinal) {
    return min === 1 && max === 5 ? { scaleTypePreset: SCALE_TYPE_PRESET.rating } : asCustom();
  }
  if ((min === 0 || min === 1) && max === 100) return { scaleTypePreset: SCALE_TYPE_PRESET.score };
  return asCustom();
};

// The evaluation target lives on the binding, not the dimension, so editing an attached dimension
// has to be handed the binding to show the scope the suite actually runs with.
export const mapDimensionToFormState = (dimension, binding = null) => {
  if (!dimension) return getDefaultDimensionFormState();

  const form = getDefaultDimensionFormState();
  form.name = dimension.name || '';
  form.isShared = dimension.tier != null && dimension.tier !== EVAL_TIER.agent_adhoc;

  if (dimension.allowed_engines?.length > 0) {
    form.evaluator = dimension.allowed_engines[0];
  }

  if (form.evaluator === EVAL_ENGINE.ai || form.evaluator === EVAL_ENGINE.human) {
    form.evaluationInstructions = dimension.description || '';
    form.evaluationGuidance = dimension.description || '';
  }

  if (form.evaluator === EVAL_ENGINE.code) {
    form.validationCode = dimension.code || '';
  }

  Object.assign(form, resolveScalePresetFields(dimension));

  if (dimension.polarity) {
    form.polarity = dimension.polarity;
  }

  if (dimension.default_target != null) {
    form.targetValue = String(dimension.default_target);
  }
  if (dimension.default_target_operator) {
    form.successCriteria = dimension.default_target_operator;
  }

  if (dimension.default_weight != null) {
    const weightValue = dimension.default_weight;
    const matchedImportance = Object.entries(IMPORTANCE_WEIGHT_MAP).find(([, w]) => w === weightValue)?.[0];
    if (matchedImportance) {
      form.importance = matchedImportance;
    } else {
      form.importance = IMPORTANCE.custom;
      form.customImportanceValue = String(weightValue);
    }
  }

  form.evaluationTarget = binding?.evidence_scope
    ? { ...NEW_ITEM_EVIDENCE_SCOPE, ...binding.evidence_scope }
    : { ...NEW_ITEM_EVIDENCE_SCOPE };

  return form;
};

export const buildDimensionApiBody = (form, applicationId) => {
  const isAI = form.evaluator === EVAL_ENGINE.ai;
  const isCode = form.evaluator === EVAL_ENGINE.code;
  const isPassFail = form.scaleTypePreset === SCALE_TYPE_PRESET.passFail;
  const isCustomScale = form.scaleTypePreset === SCALE_TYPE_PRESET.custom;
  const isCustomImportance = form.importance === IMPORTANCE.custom;

  const presetConfig = SCALE_TYPE_PRESET_CONFIG[form.scaleTypePreset];
  const scaleMin = isCustomScale ? Number(form.customMin) : presetConfig.min;
  const scaleMax = isCustomScale ? Number(form.customMax) : presetConfig.max;
  const weight = isCustomImportance
    ? Number(form.customImportanceValue)
    : IMPORTANCE_WEIGHT_MAP[form.importance];

  const hasTarget = !isPassFail && form.targetValue !== '';

  // A custom scale keeps the type it was stored with — the preset only models its bounds, so
  // reusing the preset's type would turn an ordinal scale into a continuous one.
  const scaleType = isCustomScale ? (form.customScaleType ?? presetConfig.scaleType) : presetConfig.scaleType;

  return {
    name: form.name.trim(),
    description: isAI ? form.evaluationInstructions.trim() : form.evaluationGuidance?.trim() || null,
    tier: form.isShared ? EVAL_TIER.project : EVAL_TIER.agent_adhoc,
    agent_id: form.isShared ? null : applicationId,
    allowed_engines: [form.evaluator],
    ...(form.hasKnownScale === false
      ? {}
      : { scale_type: scaleType, scale_min: scaleMin, scale_max: scaleMax }),
    polarity: isPassFail ? EVAL_POLARITY.higher_better : form.polarity,
    default_weight: weight,
    default_target: hasTarget ? Number(form.targetValue) : null,
    default_target_operator: hasTarget ? form.successCriteria : null,
    code: isCode ? form.validationCode : null,
    return_contract: isCode ? (isPassFail ? 'bool' : 'number') : null,
  };
};

export const getDimensionFormValidationError = form => {
  const isAI = form.evaluator === EVAL_ENGINE.ai;
  const isCode = form.evaluator === EVAL_ENGINE.code;
  const isPassFail = form.scaleTypePreset === SCALE_TYPE_PRESET.passFail;
  const isCustomScale = form.scaleTypePreset === SCALE_TYPE_PRESET.custom;
  const isCustomImportance = form.importance === IMPORTANCE.custom;

  if (!form.name.trim()) return 'Name is required.';
  if (isAI && !form.evaluationInstructions.trim())
    return 'Evaluation instructions are required for AI evaluator.';
  if (isCode && !form.validationCode.trim()) return 'Validation code is required for Code evaluator.';
  if (!Object.values(form.evaluationTarget).some(Boolean)) {
    return 'At least one evaluation target must be selected.';
  }
  if (isCustomScale) {
    const min = Number(form.customMin);
    const max = Number(form.customMax);
    if (form.customMin === '' || Number.isNaN(min)) return 'Custom scale minimum is required.';
    if (form.customMax === '' || Number.isNaN(max)) return 'Custom scale maximum is required.';
    if (min >= max) return 'Scale minimum must be less than maximum.';
  }
  if (!isPassFail) {
    if (form.targetValue === '' || Number.isNaN(Number(form.targetValue))) {
      return 'Target value is required.';
    }
  }
  if (isCustomImportance) {
    if (form.customImportanceValue === '' || Number.isNaN(Number(form.customImportanceValue))) {
      return 'Custom importance value is required.';
    }
  }
  return '';
};

export const mapGeneratedDimensionToForm = generated => {
  const form = getDefaultDimensionFormState();
  if (!generated) return form;

  form.name = generated.name || '';
  form.evaluationInstructions = generated.description || '';

  if (generated.allowed_engines?.length > 0) {
    const engine = generated.allowed_engines[0];
    form.evaluator = engine;
    if (engine === EVAL_ENGINE.code) {
      form.validationCode = generated.code || '';
    }
  }

  if (generated.scale_type === 'binary') {
    form.scaleTypePreset = SCALE_TYPE_PRESET.passFail;
  } else if (generated.scale_min === 1 && generated.scale_max === 5) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.rating;
  } else if (generated.scale_min === 1 && generated.scale_max === 100) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.score;
  } else if (generated.scale_min != null && generated.scale_max != null) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.custom;
    form.customMin = String(generated.scale_min);
    form.customMax = String(generated.scale_max);
  }

  if (generated.polarity) {
    form.polarity = generated.polarity;
  }

  if (generated.default_target != null) {
    form.targetValue = String(generated.default_target);
  }
  if (generated.default_target_operator) {
    form.successCriteria = generated.default_target_operator;
  }

  if (generated.default_weight != null) {
    const weightValue = generated.default_weight;
    const matchedImportance = Object.entries(IMPORTANCE_WEIGHT_MAP).find(([, w]) => w === weightValue)?.[0];
    if (matchedImportance) {
      form.importance = matchedImportance;
    } else {
      form.importance = IMPORTANCE.custom;
      form.customImportanceValue = String(weightValue);
    }
  }

  form.evaluationTarget = { ...NEW_ITEM_EVIDENCE_SCOPE };

  return form;
};
