import { describe, expect, it } from 'vitest';

import { omitSchemaProperties, sanitizeToolParams } from '../toolkitChat.helpers';

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

// Regression coverage for issue #6263: optional MCP tool params (e.g. list_branches_in_repo's
// per_page/page) left empty by the user must be omitted from the call, not sent as null/'' —
// otherwise the remote tool rejects the call as if the optional param were required.
describe('sanitizeToolParams', () => {
  const listBranchesSchema = {
    type: 'object',
    required: ['repo', 'owner'],
    properties: {
      repo: { type: 'string' },
      owner: { type: 'string' },
      per_page: { type: 'integer' },
      page: { type: 'integer' },
    },
  };

  it('drops unset optional params (null/empty string) but keeps required ones', () => {
    const result = sanitizeToolParams(listBranchesSchema, {
      repo: 'testRepo',
      owner: 'SamvelSimonyan',
      per_page: null,
      page: '',
    });

    expect(result).toEqual({ repo: 'testRepo', owner: 'SamvelSimonyan' });
  });

  it('keeps optional params the user actually filled in', () => {
    const result = sanitizeToolParams(listBranchesSchema, {
      repo: 'testRepo',
      owner: 'SamvelSimonyan',
      per_page: 20,
      page: 2,
    });

    expect(result).toEqual({ repo: 'testRepo', owner: 'SamvelSimonyan', per_page: 20, page: 2 });
  });

  it('keeps required params even if empty (so existing required-field validation still applies)', () => {
    const result = sanitizeToolParams(listBranchesSchema, { repo: '', owner: 'SamvelSimonyan' });

    expect(result).toEqual({ repo: '', owner: 'SamvelSimonyan' });
  });

  it('handles a missing schema/variables gracefully', () => {
    expect(sanitizeToolParams(null, { a: 1 })).toEqual({ a: 1 });
    expect(sanitizeToolParams(listBranchesSchema, null)).toEqual({});
  });
});
