import { describe, expect, it } from 'vitest';

import {
  buildDimensionApiBody,
  getDefaultDimensionFormState,
  getDimensionFormFieldErrors,
  getDimensionFormValidationError,
  getScaleBounds,
  getTargetValueError,
  mapDimensionToFormState,
  mapGeneratedDimensionToForm,
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

// A target the scale cannot reach makes a dimension that can never pass, so the range the author
// picked has to constrain the target they type.
describe('target value range', () => {
  const formWith = overrides => ({
    ...getDefaultDimensionFormState(),
    name: 'Dim',
    evaluator: 'human',
    ...overrides,
  });
  const passFailForm = () => formWith({ scaleTypePreset: 'pass_fail' });

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

// "Build with AI" drafts now arrive with a target on the dimension's own scale, so the review step
// must open with a form that saves as-is — no field left for the user to fill in.
describe('AI-generated draft with a proposed target', () => {
  const draft = {
    name: 'Answer accuracy',
    description: 'Checks that the answer is factually correct.',
    allowed_engines: ['ai'],
    scale_type: 'continuous',
    scale_min: 0,
    scale_max: 100,
    polarity: 'higher_better',
    default_weight: 1,
    default_target: 80,
    default_target_operator: '>=',
  };

  const reviewed = generated => {
    const form = mapGeneratedDimensionToForm(generated);
    return { form, error: getDimensionFormValidationError(form), body: buildDimensionApiBody(form, 7) };
  };

  it('saves a continuous 0-100 draft unchanged', () => {
    const { form, error, body } = reviewed(draft);
    expect(form.targetValue).toBe('80');
    expect(error).toBe('');
    expect(body).toMatchObject({
      scale_min: 0,
      scale_max: 100,
      default_target: 80,
      default_target_operator: '>=',
    });
  });

  it('saves a lower-is-better draft with its ceiling', () => {
    const { error, body } = reviewed({
      ...draft,
      polarity: 'lower_better',
      default_target: 20,
      default_target_operator: '<=',
    });
    expect(error).toBe('');
    expect(body).toMatchObject({
      polarity: 'lower_better',
      default_target: 20,
      default_target_operator: '<=',
    });
  });

  it('saves a 1-5 rating draft', () => {
    const { form, error, body } = reviewed({
      ...draft,
      scale_type: 'ordinal',
      scale_min: 1,
      scale_max: 5,
      default_target: 4,
    });
    expect(form.scaleTypePreset).toBe('rating');
    expect(error).toBe('');
    expect(body).toMatchObject({ scale_type: 'ordinal', default_target: 4, default_target_operator: '>=' });
  });

  it('saves a pass/fail draft as "must pass"', () => {
    const { form, error, body } = reviewed({
      ...draft,
      scale_type: 'binary',
      scale_min: 0,
      scale_max: 1,
      default_target: 1,
      default_target_operator: '==',
    });
    expect(form.scaleTypePreset).toBe('pass_fail');
    expect(error).toBe('');
    expect(body).toMatchObject({
      scale_type: 'binary',
      polarity: 'higher_better',
      default_target: 1,
      default_target_operator: '==',
    });
  });

  it("keeps the draft's evaluation target", () => {
    const { form } = reviewed({
      ...draft,
      evidence_scope: { structure: false, input: true, output: true, expected: true },
    });
    expect(form.evaluationTarget).toEqual({ structure: false, input: true, output: true, expected: true });
  });

  it('falls back to output-only when the draft has no evaluation target', () => {
    const { form } = reviewed(draft);
    expect(form.evaluationTarget).toEqual({ structure: false, input: false, output: true });
  });

  // The backend drops a target it cannot use rather than failing the draft; the form then asks
  // the user for one instead of saving a dimension with no pass criterion.
  it('asks for a target when the draft came without one', () => {
    const { error } = reviewed({ ...draft, default_target: null, default_target_operator: null });
    expect(error).toBe('Target value is required.');
  });

  it('keeps an ordinal draft on a non-preset range ordinal', () => {
    const { form, error, body } = reviewed({
      ...draft,
      scale_type: 'ordinal',
      scale_min: 1,
      scale_max: 10,
      default_target: 8,
    });
    expect(form.scaleTypePreset).toBe('custom');
    expect(error).toBe('');
    expect(body).toMatchObject({ scale_type: 'ordinal', scale_min: 1, scale_max: 10, default_target: 8 });
  });

  // The success-criteria select only offers >=, <= and ==; anything else would render blank.
  it.each(['>', '<'])('asks for a target instead of keeping an unsupported %s operator', operator => {
    const { form, error, body } = reviewed({ ...draft, default_target_operator: operator });
    expect(form.targetValue).toBe('');
    expect(form.successCriteria).toBe('>=');
    expect(error).toBe('Target value is required.');
    expect(body).toMatchObject({ default_target: null, default_target_operator: null });
  });

  it('falls back to output-only when every evaluation target flag is off', () => {
    const { form, error } = reviewed({
      ...draft,
      evidence_scope: { structure: false, input: false, output: false, expected: false },
    });
    expect(form.evaluationTarget).toEqual({ structure: false, input: false, output: true });
    expect(error).toBe('');
  });
});

describe('getDimensionFormFieldErrors', () => {
  const validForm = () => ({
    ...getDefaultDimensionFormState(),
    name: 'Dim',
    evaluationInstructions: 'Judge it',
    targetValue: '80',
  });

  it('reports nothing for a complete form', () => {
    expect(getDimensionFormFieldErrors(validForm())).toEqual({});
  });

  it('marks every missing required field at once', () => {
    const form = { ...validForm(), name: ' ', evaluationInstructions: '', targetValue: '' };
    expect(getDimensionFormFieldErrors(form)).toEqual({
      name: 'Field is required.',
      evaluationInstructions: 'Field is required.',
      targetValue: 'Field is required.',
    });
  });

  it('asks for at least one evaluation target', () => {
    const form = { ...validForm(), evaluationTarget: { output: false, input: false, structure: false } };
    expect(getDimensionFormFieldErrors(form).evaluationTarget).toBe(
      'At least one evaluation target must be selected.',
    );
  });

  it('keeps the range message for an out-of-scale target', () => {
    const form = { ...validForm(), targetValue: '150' };
    expect(getDimensionFormFieldErrors(form).targetValue).toBe('Target value must be between 1 and 100.');
  });

  it('requires validation code only for the code evaluator', () => {
    const form = { ...validForm(), evaluator: 'code', scaleTypePreset: 'pass_fail', targetValue: '' };
    expect(getDimensionFormFieldErrors(form)).toEqual({ validationCode: 'Field is required.' });
  });

  it('flags custom scale bounds', () => {
    const empty = { ...validForm(), scaleTypePreset: 'custom', customMin: '', customMax: '' };
    expect(getDimensionFormFieldErrors(empty).customScale).toBe('Field is required.');

    const inverted = { ...validForm(), scaleTypePreset: 'custom', customMin: '10', customMax: '5' };
    expect(getDimensionFormFieldErrors(inverted).customScale).toBe(
      'Scale minimum must be less than maximum.',
    );
  });

  it('requires a value for a custom importance', () => {
    const form = { ...validForm(), importance: 'custom', customImportanceValue: '' };
    expect(getDimensionFormFieldErrors(form).customImportanceValue).toBe('Field is required.');
  });
});

describe('getDimensionFormValidationError', () => {
  const validForm = () => ({
    ...getDefaultDimensionFormState(),
    name: 'Dim',
    evaluationInstructions: 'Judge it',
    targetValue: '80',
  });

  it('reports the first problem in the long-standing wording', () => {
    const form = { ...validForm(), name: '', evaluationInstructions: '', targetValue: '' };
    expect(getDimensionFormValidationError(form)).toBe('Name is required.');
  });

  it('keeps the field-specific wording for each rule', () => {
    expect(getDimensionFormValidationError({ ...validForm(), evaluationInstructions: '' })).toBe(
      'Evaluation instructions are required for AI evaluator.',
    );
    expect(
      getDimensionFormValidationError({
        ...validForm(),
        evaluator: 'code',
        scaleTypePreset: 'pass_fail',
        targetValue: '',
      }),
    ).toBe('Validation code is required for Code evaluator.');
    expect(getDimensionFormValidationError({ ...validForm(), targetValue: '' })).toBe(
      'Target value is required.',
    );
    expect(
      getDimensionFormValidationError({
        ...validForm(),
        scaleTypePreset: 'custom',
        customMin: '',
        customMax: '',
      }),
    ).toBe('Custom scale minimum is required.');
    expect(
      getDimensionFormValidationError({ ...validForm(), importance: 'custom', customImportanceValue: '' }),
    ).toBe('Custom importance value is required.');
  });

  it('is empty for a valid form', () => {
    expect(getDimensionFormValidationError(validForm())).toBe('');
  });
});
