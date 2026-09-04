import { describe, expect, it } from 'vitest';

import { isPropertyVisible, validateRequiredFields } from '../toolBase.helpers';

const visible = overrides =>
  isPropertyVisible({
    propertyKey: 'project',
    property: { type: 'string' },
    settings: {},
    ...overrides,
  });

describe('isPropertyVisible', () => {
  it('shows a plain property', () => {
    expect(visible()).toBe(true);
  });

  it('hides a property the schema marks hidden', () => {
    expect(visible({ property: { hidden: true } })).toBe(false);
  });

  it('hides a property whose schema is missing', () => {
    expect(visible({ property: undefined })).toBe(false);
  });

  it('honours visible_when against the current settings', () => {
    const property = { visible_when: { field: 'auth_type', value: 'custom' } };

    expect(visible({ property, settings: { auth_type: 'custom' } })).toBe(true);
    expect(visible({ property, settings: { auth_type: 'bearer' } })).toBe(false);
    expect(visible({ property, settings: {} })).toBe(false);
  });

  it('compares visible_when strings case-insensitively', () => {
    const property = { visible_when: { field: 'hosting', value: 'Cloud' } };

    expect(visible({ property, settings: { hosting: 'cloud' } })).toBe(true);
  });

  it('compares non-string visible_when values strictly', () => {
    const property = { visible_when: { field: 'cloud', value: true } };

    expect(visible({ property, settings: { cloud: true } })).toBe(true);
    expect(visible({ property, settings: { cloud: false } })).toBe(false);
  });

  it('hides an empty field in disabled-config mode but keeps elitea_title', () => {
    expect(visible({ disableConfigFields: true, settings: {} })).toBe(false);
    expect(visible({ disableConfigFields: true, settings: { project: 'ELI' } })).toBe(true);
    expect(visible({ propertyKey: 'elitea_title', disableConfigFields: true, settings: {} })).toBe(true);
  });

  it('keeps only configuration fields in configuration-only mode', () => {
    expect(visible({ showOnlyConfigurationFields: true })).toBe(false);
    expect(visible({ showOnlyConfigurationFields: true, property: { configuration: true } })).toBe(true);
  });

  it('keeps only required fields in required-only mode', () => {
    expect(visible({ showOnlyRequiredFields: true })).toBe(false);
    expect(visible({ showOnlyRequiredFields: true, required: true })).toBe(true);
  });
});

describe('validateRequiredFields secret headers', () => {
  const optionalHeadersSchema = {
    properties: {
      headers: { type: 'object', ui_component: 'secret_headers' },
    },
  };

  it.each([{}, { headers: {} }])('allows omitted or empty optional headers', settings => {
    expect(validateRequiredFields(optionalHeadersSchema, settings)).toEqual({ headers: false });
  });

  it('allows valid populated optional headers', () => {
    expect(
      validateRequiredFields(optionalHeadersSchema, { headers: { 'X-Api-Key': '{{secret.api_key}}' } }),
    ).toEqual({ headers: false });
  });

  it.each([
    [{ 'bad header': '{{secret.api_key}}' }],
    [{ 'line1\r\nInjected-Header': '{{secret.api_key}}' }],
    [{ 'X-Api-Key': '' }],
    [{ 'X-Api-Key': 'secret\r\nInjected-Header: value' }],
  ])('rejects an invalid row in an optional headers collection', headers => {
    expect(validateRequiredFields(optionalHeadersSchema, { headers })).toEqual({ headers: true });
  });

  it('still requires a headers collection when the schema marks it required', () => {
    const requiredHeadersSchema = { ...optionalHeadersSchema, required: ['headers'] };

    expect(validateRequiredFields(requiredHeadersSchema, { headers: {} })).toEqual({ headers: true });
  });
});
