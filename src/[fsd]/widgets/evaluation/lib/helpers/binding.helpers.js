import { EVAL_BINDING_KIND, EVAL_ENGINE } from '../constants';

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

/** Platform bindings are catalog-defined: engine is locked to code, no delete/edit of source. */
export const isPlatformBinding = binding => getBindingKind(binding) === EVAL_BINDING_KIND.platform;

/**
 * Resolves a display label for a binding by looking up its referenced dimension.
 * Falls back to the stored platform_key or a generic label.
 */
export const getBindingLabel = (binding, { dimensions = [] } = {}) => {
  const kind = getBindingKind(binding);
  if (kind === EVAL_BINDING_KIND.dimension) {
    const found = dimensions.find(d => d.id === binding.dimension_id);
    return found?.name || `Dimension #${binding.dimension_id}`;
  }
  if (kind === EVAL_BINDING_KIND.platform) {
    return binding.platform_key || 'Platform validation';
  }
  return 'Validation';
};

/** Splits an ordered binding list into the two grouped sections shown in §13.1. */
export const groupBindings = (bindings = []) => {
  const groups = {
    [EVAL_BINDING_KIND.dimension]: [],
    [EVAL_BINDING_KIND.platform]: [],
  };
  for (const binding of bindings) {
    const kind = getBindingKind(binding);
    if (kind) groups[kind].push(binding);
  }
  return groups;
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

export const getTargetLabel = (target, targetOperator) => {
  if (target == null || !targetOperator) return null;
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
