import {
  DIMENSION_ENGINE_TOOLTIP,
  EVAL_BINDING_KIND,
  EVAL_ENGINE,
  EVAL_SCALE_TYPE,
  IMPORTANCE,
  IMPORTANCE_WEIGHT_MAP,
} from '../constants';

/**
 * Derives a binding's kind from which reference column is populated. Exactly one
 * of dimension_id / platform_key is set (§13.1).
 */
export const getBindingKind = binding => {
  if (!binding) return null;
  if (binding.dimension_id != null) return EVAL_BINDING_KIND.dimension;
  if (binding.platform_key != null) return EVAL_BINDING_KIND.platform;
  return null;
};

const WEIGHT_LABEL = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

export const getWeightLabel = weight => {
  if (weight == null) return null;
  return WEIGHT_LABEL[weight] || `w${weight}`;
};

/** Splits a weight into the importance select value and, for off-map weights, the custom value. */
export const weightToImportanceForm = weight => {
  if (weight == null) return { importance: IMPORTANCE.medium, customImportanceValue: '' };
  const importance = Object.entries(IMPORTANCE_WEIGHT_MAP).find(([, w]) => w === weight)?.[0];
  if (importance) return { importance, customImportanceValue: '' };
  return { importance: IMPORTANCE.custom, customImportanceValue: String(weight) };
};

/** Inverse of weightToImportanceForm; null when a custom value is empty, non-numeric or negative. */
export const importanceFormToWeight = (importance, customImportanceValue) => {
  if (importance !== IMPORTANCE.custom) return IMPORTANCE_WEIGHT_MAP[importance] ?? null;
  if (customImportanceValue === '' || customImportanceValue == null) return null;
  const weight = Number(customImportanceValue);
  return Number.isFinite(weight) && weight >= 0 ? weight : null;
};

export const getTargetLabel = (target, targetOperator, scaleType) => {
  if (target == null || !targetOperator) return null;
  const isBinary = scaleType === EVAL_SCALE_TYPE.binary;
  if (isBinary && targetOperator === '==' && target === 1) return '= pass';
  if (isBinary && targetOperator === '==' && target === 0) return '= fail';
  const op = targetOperator === '>=' ? '≥' : targetOperator;
  return `${op}${target}`;
};

/** Human-readable engine label for a binding badge. */
export const getEngineLabel = engine => {
  if (engine === EVAL_ENGINE.ai) return 'AI';
  if (engine === EVAL_ENGINE.human) return 'Human';
  if (engine === EVAL_ENGINE.code) return 'Code';
  return engine || '';
};

/**
 * Engine label as it applies to a binding. Dimension bindings carry the engine the
 * dimension was scored on (AI / Human / Code); platform validations always run on
 * the code engine regardless of the stored `engine` column.
 */
export const getBindingEngineLabel = binding => {
  if (getBindingKind(binding) === EVAL_BINDING_KIND.dimension) {
    return getEngineLabel(binding.engine);
  }
  return 'Code';
};

export const getEngineTooltip = engine => DIMENSION_ENGINE_TOOLTIP[engine] || '';

/** Evaluator badge tooltip; mirrors getBindingEngineLabel's engine resolution. */
export const getBindingEngineTooltip = binding =>
  getEngineTooltip(
    getBindingKind(binding) === EVAL_BINDING_KIND.dimension ? binding.engine : EVAL_ENGINE.code,
  );
