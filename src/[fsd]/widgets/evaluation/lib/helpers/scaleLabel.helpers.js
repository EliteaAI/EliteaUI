import { EVAL_SCALE_TYPE, SCALE_TYPE_PRESET, SCALE_TYPE_PRESET_OPTIONS } from '../constants';

// The Dimension modal is the only place that names a scale for the author, so Results borrows its
// wording from the same option list instead of surfacing the stored `continuous` / `ordinal` /
// `binary` values.
const SCALE_PRESET_LABELS = SCALE_TYPE_PRESET_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {},
);

// A run snapshot that carried the scale type but not its bounds still deserves the preset name the
// author picked; the type alone identifies it everywhere but a deliberately custom range.
const DEFAULT_PRESET_BY_SCALE_TYPE = {
  [EVAL_SCALE_TYPE.binary]: SCALE_TYPE_PRESET.passFail,
  [EVAL_SCALE_TYPE.ordinal]: SCALE_TYPE_PRESET.rating,
  [EVAL_SCALE_TYPE.continuous]: SCALE_TYPE_PRESET.score,
};

const toScaleBound = value => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * Classifies a stored scale into the preset the Dimension modal offers for it. `scaleType` is
 * authoritative — the bounds only choose between presets that share a type. `preset` is null when
 * there is nothing dependable to classify from, which callers read as "scale unknown".
 */
export const resolveScalePreset = ({ scaleType, scaleMin, scaleMax } = {}) => {
  const min = toScaleBound(scaleMin);
  const max = toScaleBound(scaleMax);

  // The Pass/Fail preset supplies its own bounds, so it is the one type that needs nothing else.
  if (scaleType === EVAL_SCALE_TYPE.binary) return { preset: SCALE_TYPE_PRESET.passFail, min, max };

  if (min == null || max == null) return { preset: null, min, max };

  if (scaleType === EVAL_SCALE_TYPE.ordinal) {
    const preset = min === 1 && max === 5 ? SCALE_TYPE_PRESET.rating : SCALE_TYPE_PRESET.custom;
    return { preset, min, max };
  }
  if ((min === 0 || min === 1) && max === 100) return { preset: SCALE_TYPE_PRESET.score, min, max };
  return { preset: SCALE_TYPE_PRESET.custom, min, max };
};

/**
 * The user-facing name of a binding's scale, e.g. "Rating (1-5)". Display only — the stored scale
 * type keeps driving scoring, targets and aggregation. Returns null for a binding whose scale never
 * reached the client, so each surface can apply its own placeholder.
 *
 * @param {object} binding — carries `scaleType`, `scaleMin`, `scaleMax`
 * @param {{ withBounds?: boolean }} [options] — append the range to a Custom scale, e.g. "Custom (0-50)"
 */
export const getScaleTypeLabel = (binding, options = {}) => {
  const { withBounds = false } = options;
  const scaleType = binding?.scaleType ?? null;
  if (!scaleType) return null;

  const { preset, min, max } = resolveScalePreset({
    scaleType,
    scaleMin: binding?.scaleMin,
    scaleMax: binding?.scaleMax,
  });
  // A scale type this UI does not know is still a real configured scale, so it reads as Custom
  // rather than disappearing behind a placeholder.
  const resolved = preset ?? DEFAULT_PRESET_BY_SCALE_TYPE[scaleType] ?? SCALE_TYPE_PRESET.custom;
  const label = SCALE_PRESET_LABELS[resolved];

  if (withBounds && resolved === SCALE_TYPE_PRESET.custom && min != null && max != null) {
    return `${label} (${min}–${max})`;
  }
  return label;
};
