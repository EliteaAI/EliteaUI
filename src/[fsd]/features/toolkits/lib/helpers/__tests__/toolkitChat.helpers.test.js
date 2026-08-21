import { describe, expect, it } from 'vitest';

import { omitSchemaProperties } from '../toolkitChat.helpers';

const searchSchema = {
  type: 'object',
  required: ['query', 'index_name'],
  properties: {
    query: { type: 'string' },
    index_name: { type: 'string', default: '' },
    cut_off: { type: 'number', default: 0.5 },
  },
};

describe('omitSchemaProperties', () => {
  it('drops the property and its required entry', () => {
    const result = omitSchemaProperties(searchSchema, ['index_name']);

    expect(Object.keys(result.properties)).toEqual(['query', 'cut_off']);
    expect(result.required).toEqual(['query']);
  });

  it('leaves the source schema untouched', () => {
    omitSchemaProperties(searchSchema, ['index_name']);

    expect(searchSchema.properties.index_name).toBeDefined();
    expect(searchSchema.required).toContain('index_name');
  });

  it('passes through a schema with no properties', () => {
    expect(omitSchemaProperties(null, ['index_name'])).toBeNull();
  });
});
