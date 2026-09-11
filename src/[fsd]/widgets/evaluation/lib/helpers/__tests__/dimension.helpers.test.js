import { describe, expect, it } from 'vitest';

import {
  buildDimensionApiBody,
  getDefaultDimensionFormState,
  getDimensionFormValidationError,
  getScaleBounds,
  getTargetValueError,
  mapDimensionToFormState,
} from '../dimension.helpers';

const roundTrip = dimension => buildDimensionApiBody(mapDimensionToFormState(dimension), 7);

const base = {
  name: 'Dim',
  allowed_engines: ['human'],
  polarity: 'higher_better',
  default_weight: 2,
  default_target: 80,
  default_target_operator: '>=',
};

// Editing a dimension must never silently rewrite the scale it was configured with: the score
// control in the human evaluation modal is shaped from it.
describe('dimension scale round-trip', () => {
  it('keeps a pass/fail dimension binary', () => {
    const body = roundTrip({ ...base, scale_type: 'binary', scale_min: 0, scale_max: 1 });
    expect(body).toMatchObject({ scale_type: 'binary', scale_min: 0, scale_max: 1 });
  });

  it('keeps a 1..5 rating ordinal', () => {
    const body = roundTrip({ ...base, scale_type: 'ordinal', scale_min: 1, scale_max: 5 });
    expect(body).toMatchObject({ scale_type: 'ordinal', scale_min: 1, scale_max: 5 });
  });

  // The bounds-only classifier sent this to the Score preset, saving it as continuous 1..100.
  it('keeps an ordinal scale that is not exactly 1..5 ordinal', () => {
    const body = roundTrip({ ...base, scale_type: 'ordinal', scale_min: 1, scale_max: 7 });
    expect(body).toMatchObject({ scale_type: 'ordinal', scale_min: 1, scale_max: 7 });
  });

  it('keeps a 1..100 score continuous', () => {
    const body = roundTrip({ ...base, scale_type: 'continuous', scale_min: 1, scale_max: 100 });
    expect(body).toMatchObject({ scale_type: 'continuous', scale_min: 1, scale_max: 100 });
  });

  it('keeps a custom continuous range', () => {
    const body = roundTrip({ ...base, scale_type: 'continuous', scale_min: 10, scale_max: 40 });
    expect(body).toMatchObject({ scale_type: 'continuous', scale_min: 10, scale_max: 40 });
  });

  it('reads bounds that arrive as strings', () => {
    const body = roundTrip({ ...base, scale_type: 'ordinal', scale_min: '1', scale_max: '5' });
    expect(body).toMatchObject({ scale_type: 'ordinal', scale_min: 1, scale_max: 5 });
  });

  // Without this the save wrote the default Score preset over whatever was stored.
  it('omits the scale entirely when the record carried none', () => {
    const body = roundTrip({ ...base });
    expect(body).not.toHaveProperty('scale_type');
    expect(body).not.toHaveProperty('scale_min');
    expect(body).not.toHaveProperty('scale_max');
    expect(body.name).toBe('Dim');
  });

  it('still sends a scale for a dimension created from scratch', () => {
    const body = buildDimensionApiBody(mapDimensionToFormState(null), 7);
    expect(body).toMatchObject({ scale_type: 'continuous', scale_min: 1, scale_max: 100 });
  });

  // A known type with unloaded bounds must not become a Custom preset with empty min/max, which
  // validation rejects and which would leave the dimension un-saveable.
  it('treats a type without bounds as unknown rather than an empty custom scale', () => {
    const form = mapDimensionToFormState({ ...base, scale_type: 'ordinal' });
    expect(form.scaleTypePreset).toBe('score');
    expect(form.hasKnownScale).toBe(false);
    expect(getDimensionFormValidationError(form)).toBe('');
  });

  it('sends the scale again once the reviewer picks one on an unknown-scale record', () => {
    const form = mapDimensionToFormState({ ...base });
    expect(form.hasKnownScale).toBe(false);
    // What DimensionForm's scale-type select does.
    const picked = { ...form, scaleTypePreset: 'pass_fail', hasKnownScale: true };
    expect(buildDimensionApiBody(picked, 7)).toMatchObject({
      scale_type: 'binary',
      scale_min: 0,
      scale_max: 1,
    });
  });
});

// A pass/fail (binary) dimension previously could never carry a target: DimensionForm hid the
// target controls whenever the scale was pass/fail, and buildDimensionApiBody discarded whatever
// was in the form. Code validations are forced onto this scale, so this silently blocked "this
// check must always pass" targets even though the backend and scoring logic already support them.
describe('pass/fail dimension targets', () => {
  const passFailForm = () => ({
    ...getDefaultDimensionFormState(),
    name: 'Safety check',
    evaluator: 'code',
    validationCode: 'return True',
    scaleTypePreset: 'pass_fail',
  });

  it('sends no target when the reviewer leaves it unset', () => {
    const body = buildDimensionApiBody(passFailForm(), 7);
    expect(body).toMatchObject({ default_target: null, default_target_operator: null });
  });

  it('sends a "must pass" target as target 1 with the equality operator', () => {
    const form = { ...passFailForm(), targetValue: '1', successCriteria: '==' };
    const body = buildDimensionApiBody(form, 7);
    expect(body).toMatchObject({ default_target: 1, default_target_operator: '==' });
  });

  it('sends a "must fail" target as target 0 with the equality operator', () => {
    const form = { ...passFailForm(), targetValue: '0', successCriteria: '==' };
    const body = buildDimensionApiBody(form, 7);
    expect(body).toMatchObject({ default_target: 0, default_target_operator: '==' });
  });

  it('still allows saving a pass/fail dimension with no target selected', () => {
    expect(getDimensionFormValidationError(passFailForm())).toBe('');
  });

  it('loads a stored pass/fail target back into the form', () => {
    const form = mapDimensionToFormState({
      ...base,
      allowed_engines: ['code'],
      scale_type: 'binary',
      scale_min: 0,
      scale_max: 1,
      default_target: 1,
      default_target_operator: '==',
    });
    expect(form.targetValue).toBe('1');
    expect(form.successCriteria).toBe('==');
  });

  // A rating/custom-scale target (e.g. `>= 80`) left behind after the reviewer switches the scale
  // to pass/fail is not a valid pass/fail target and must never reach the API as one.
  it('drops a stale non-binary target when the scale is pass/fail', () => {
    const form = { ...passFailForm(), targetValue: '80', successCriteria: '>=' };
    const body = buildDimensionApiBody(form, 7);
    expect(body).toMatchObject({ default_target: null, default_target_operator: null });
  });

  it('drops a stale target of 0/1 with a non-equality operator when the scale is pass/fail', () => {
    const form = { ...passFailForm(), targetValue: '1', successCriteria: '>=' };
    const body = buildDimensionApiBody(form, 7);
    expect(body).toMatchObject({ default_target: null, default_target_operator: null });
  });
});

// A target the scale cannot reach makes a dimension that can never pass, so the range the author
// picked has to constrain the target they type.
describe('target value range', () => {
  const formWith = overrides => ({
    ...getDefaultDimensionFormState(),
    name: 'Dim',
    evaluator: 'human',
    ...overrides,
  });

  it('accepts a target inside the Score range', () => {
    expect(getTargetValueError(formWith({ scaleTypePreset: 'score', targetValue: '80' }))).toBe('');
  });

  it('rejects a target above the Score range', () => {
    expect(getTargetValueError(formWith({ scaleTypePreset: 'score', targetValue: '120' }))).toBe(
      'Target value must be between 1 and 100.',
    );
  });

  it('rejects a Score target of 20 once the scale is a 1-5 rating', () => {
    expect(getTargetValueError(formWith({ scaleTypePreset: 'rating', targetValue: '20' }))).toBe(
      'Target value must be between 1 and 5.',
    );
  });

  it('accepts a target inside the Rating range', () => {
    expect(getTargetValueError(formWith({ scaleTypePreset: 'rating', targetValue: '4' }))).toBe('');
  });

  it('rejects a target below a custom minimum', () => {
    const form = formWith({
      scaleTypePreset: 'custom',
      customMin: '10',
      customMax: '20',
      targetValue: '2',
    });
    expect(getTargetValueError(form)).toBe('Target value must be between 10 and 20.');
  });

  it('rejects a target above a custom maximum', () => {
    const form = formWith({
      scaleTypePreset: 'custom',
      customMin: '10',
      customMax: '20',
      targetValue: '23',
    });
    expect(getTargetValueError(form)).toBe('Target value must be between 10 and 20.');
  });

  it('accepts a target on a custom bound', () => {
    const form = formWith({
      scaleTypePreset: 'custom',
      customMin: '10',
      customMax: '20',
      targetValue: '20',
    });
    expect(getTargetValueError(form)).toBe('');
  });

  it('has no target to check on a Pass/Fail scale', () => {
    expect(getTargetValueError(formWith({ scaleTypePreset: 'pass_fail', targetValue: '' }))).toBe('');
  });

  // The bounds themselves are the error to report; checking a target against an inverted or
  // half-typed range would blame the wrong field.
  it('skips the range check while the custom bounds are invalid', () => {
    const form = formWith({
      scaleTypePreset: 'custom',
      customMin: '20',
      customMax: '5',
      targetValue: '10',
    });
    expect(getScaleBounds(form)).toBeNull();
    expect(getTargetValueError(form)).toBe('');
    expect(getDimensionFormValidationError(form)).toBe('Scale minimum must be less than maximum.');
  });

  // An edited record whose stored scale could not be classified has no range to judge a target by,
  // and must stay saveable.
  it('skips the range check when the scale is unknown', () => {
    const form = mapDimensionToFormState({
      name: 'Dim',
      allowed_engines: ['human'],
      default_target: 400,
      default_target_operator: '>=',
    });
    expect(form.hasKnownScale).toBe(false);
    expect(getScaleBounds(form)).toBeNull();
    expect(getTargetValueError(form)).toBe('');
  });

  it('blocks the save on an out-of-range target', () => {
    const form = formWith({ scaleTypePreset: 'rating', targetValue: '20' });
    expect(getDimensionFormValidationError(form)).toBe('Target value must be between 1 and 5.');
  });
});
