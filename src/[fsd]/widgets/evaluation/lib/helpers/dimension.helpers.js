import {
  EVAL_ENGINE,
  EVAL_POLARITY,
  EVAL_TIER,
  IMPORTANCE,
  IMPORTANCE_WEIGHT_MAP,
  NEW_ITEM_EVIDENCE_SCOPE,
  SCALE_TYPE_PRESET,
  SCALE_TYPE_PRESET_CONFIG,
} from '../constants';

export const getDefaultDimensionFormState = () => ({
  name: '',
  isShared: false,
  evaluator: EVAL_ENGINE.ai,
  evaluationInstructions: '',
  evaluationGuidance: '',
  validationCode: '',
  evaluationTarget: { ...NEW_ITEM_EVIDENCE_SCOPE },
  scaleTypePreset: SCALE_TYPE_PRESET.score,
  customMin: '',
  customMax: '',
  polarity: EVAL_POLARITY.higher_better,
  successCriteria: '>=',
  targetValue: '',
  importance: IMPORTANCE.medium,
  customImportanceValue: '',
});

export const mapDimensionToFormState = dimension => {
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

  if (dimension.scale_type === 'binary') {
    form.scaleTypePreset = SCALE_TYPE_PRESET.passFail;
  } else if (dimension.scale_min === 1 && dimension.scale_max === 5) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.rating;
  } else if (dimension.scale_min === 1 && dimension.scale_max === 100) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.score;
  } else if (dimension.scale_min === 0 && dimension.scale_max === 100) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.score;
  } else if (dimension.scale_min != null && dimension.scale_max != null) {
    form.scaleTypePreset = SCALE_TYPE_PRESET.custom;
    form.customMin = String(dimension.scale_min);
    form.customMax = String(dimension.scale_max);
  }

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

  form.evaluationTarget = { ...NEW_ITEM_EVIDENCE_SCOPE };

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

  return {
    name: form.name.trim(),
    description: isAI ? form.evaluationInstructions.trim() : form.evaluationGuidance?.trim() || null,
    tier: form.isShared ? EVAL_TIER.project : EVAL_TIER.agent_adhoc,
    agent_id: form.isShared ? null : applicationId,
    allowed_engines: [form.evaluator],
    scale_type: presetConfig.scaleType,
    scale_min: scaleMin,
    scale_max: scaleMax,
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
