import { describe, expect, it } from 'vitest';

import {
  buildDimensionApiBody,
  getDimensionFormValidationError,
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
