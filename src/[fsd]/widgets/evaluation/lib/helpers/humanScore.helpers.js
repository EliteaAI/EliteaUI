import { EVAL_SCALE_TYPE } from '../constants';
import { formatScore } from './scorecard.helpers';

export const HUMAN_SCALE_KIND = {
  passFail: 'passFail',
  rating: 'rating',
  score: 'score',
};

// Past this many steps, one mark per ordinal point collides; fall back to the ruler below.
const ORDINAL_MARK_LIMIT = 10;
const RULER_DIVISIONS = 4;
const NICE_FACTORS = [1, 2, 2.5, 5, 10];

const toNumber = value => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// Interior marks land on round numbers rather than exact quartiles, so a 1..100 scale rules
// 1 / 25 / 50 / 75 / 100 instead of 1 / 26 / 51 / 75 / 100.
const buildRulerMarks = (min, max) => {
  const target = (max - min) / RULER_DIVISIONS;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step =
    NICE_FACTORS.map(factor => factor * magnitude)
      .filter(candidate => Number.isInteger(candidate) && candidate > 0)
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? 1;

  const values = [min];
  for (let value = Math.ceil((min + 1) / step) * step; value < max; value += step) values.push(value);
  values.push(max);
  return [...new Set(values)].map(value => ({ value, label: String(value) }));
};

const buildMarks = (min, max, kind) => {
  if (kind === HUMAN_SCALE_KIND.rating && max - min <= ORDINAL_MARK_LIMIT) {
    const marks = [];
    for (let value = min; value <= max; value += 1) marks.push({ value, label: String(value) });
    return marks;
  }
  return buildRulerMarks(min, max);
};

// The largest span still read as a rating rather than a score when the scale type is missing.
const INFERRED_RATING_MAX_SPAN = 10;

// A binding whose scale type did not survive into the run snapshot still carries its bounds, and
// 0..1 or a short whole range says far more about the control than the continuous default does.
const inferScaleType = (min, max) => {
  if (min == null || max == null) return EVAL_SCALE_TYPE.continuous;
  if (min === 0 && max === 1) return EVAL_SCALE_TYPE.binary;
  if (Number.isInteger(min) && Number.isInteger(max) && max - min <= INFERRED_RATING_MAX_SPAN) {
    return EVAL_SCALE_TYPE.ordinal;
  }
  return EVAL_SCALE_TYPE.continuous;
};

// Falls back to the same bounds `normalizeScore` assumes, so a dimension that left its scale unset
// never offers the reviewer a value the server would reject.
export const resolveHumanScale = binding => {
  const scaleType =
    binding?.scaleType ?? inferScaleType(toNumber(binding?.scaleMin), toNumber(binding?.scaleMax));

  if (scaleType === EVAL_SCALE_TYPE.binary) {
    const min = toNumber(binding?.scaleMin) ?? 0;
    const max = toNumber(binding?.scaleMax) ?? 1;
    return { kind: HUMAN_SCALE_KIND.passFail, label: 'Outcome', min, max, step: 1, marks: [] };
  }

  const isOrdinal = scaleType === EVAL_SCALE_TYPE.ordinal;
  const kind = isOrdinal ? HUMAN_SCALE_KIND.rating : HUMAN_SCALE_KIND.score;
  const min = toNumber(binding?.scaleMin) ?? (isOrdinal ? 1 : 0);
  const fallbackMax = isOrdinal ? 5 : 100;
  const rawMax = toNumber(binding?.scaleMax);
  const max = rawMax != null && rawMax > min ? rawMax : Math.max(fallbackMax, min + 1);

  return {
    kind,
    label: isOrdinal ? 'Rating' : 'Score',
    min,
    max,
    step: 1,
    marks: buildMarks(min, max, kind),
  };
};

export const getPassFailOptions = scale => [
  { value: scale.max, label: 'Pass' },
  { value: scale.min, label: 'Fail' },
];

export const clampHumanScore = (value, scale) => {
  const num = toNumber(value);
  if (num == null || !scale) return null;
  return Math.min(scale.max, Math.max(scale.min, num));
};

export const isValidHumanScore = (value, scale) => {
  const num = toNumber(value);
  if (num == null || !scale) return false;
  if (scale.kind === HUMAN_SCALE_KIND.passFail) return num === scale.min || num === scale.max;
  if (num < scale.min || num > scale.max) return false;
  if (scale.kind === HUMAN_SCALE_KIND.rating) return Number.isInteger(num);
  return true;
};

export const formatHumanOutcome = (value, scale) => {
  const num = toNumber(value);
  if (num == null) return '—';
  if (scale?.kind === HUMAN_SCALE_KIND.passFail) return num >= scale.max ? 'Pass' : 'Fail';
  return formatScore(num);
};
