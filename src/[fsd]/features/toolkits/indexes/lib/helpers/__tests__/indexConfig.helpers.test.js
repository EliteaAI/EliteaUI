import { describe, expect, it } from 'vitest';

import {
  isIndexConfigDirty,
  normalizeIndexConfig,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexConfig.helpers';

const SCHEMA = {
  properties: {
    index_name: { type: 'string' },
    chunk_size: { type: 'integer', default: 1000 },
    cleanup: { type: 'boolean', default: false },
    include: { type: 'array' },
  },
};

describe('normalizeIndexConfig', () => {
  it('fills in schema defaults for absent keys', () => {
    expect(normalizeIndexConfig(SCHEMA, { index_name: 'docs' })).toEqual({
      index_name: 'docs',
      chunk_size: 1000,
      cleanup: false,
    });
  });

  it('leaves present keys alone, including falsy ones', () => {
    expect(normalizeIndexConfig(SCHEMA, { chunk_size: 0, cleanup: true })).toEqual({
      chunk_size: 0,
      cleanup: true,
    });
  });

  it('does not mutate the input', () => {
    const values = { index_name: 'docs' };
    normalizeIndexConfig(SCHEMA, values);
    expect(values).toEqual({ index_name: 'docs' });
  });

  it('tolerates a missing schema and missing values', () => {
    expect(normalizeIndexConfig(undefined, undefined)).toEqual({});
    expect(normalizeIndexConfig(SCHEMA, null)).toEqual({ chunk_size: 1000, cleanup: false });
  });
});

describe('isIndexConfigDirty', () => {
  it('reports clean when a defaulted field is reverted to its default', () => {
    // The saved config never carried chunk_size; touching the field and typing the default
    // back in adds the key. Without normalization this reads dirty forever.
    const baseline = { index_name: 'docs' };
    const values = { index_name: 'docs', chunk_size: 1000 };
    expect(isIndexConfigDirty(SCHEMA, values, baseline)).toBe(false);
  });

  it('reports dirty when a defaulted field is changed away from its default', () => {
    expect(isIndexConfigDirty(SCHEMA, { index_name: 'docs', chunk_size: 500 }, { index_name: 'docs' })).toBe(
      true,
    );
  });

  it('reports clean for identical configs', () => {
    const config = { index_name: 'docs', chunk_size: 500 };
    expect(isIndexConfigDirty(SCHEMA, config, { ...config })).toBe(false);
  });

  it('ignores key order', () => {
    expect(
      isIndexConfigDirty(
        SCHEMA,
        { chunk_size: 500, index_name: 'docs' },
        { index_name: 'docs', chunk_size: 500 },
      ),
    ).toBe(false);
  });

  it('reports dirty when a key is added', () => {
    expect(isIndexConfigDirty(SCHEMA, { index_name: 'docs', extra: 1 }, { index_name: 'docs' })).toBe(true);
  });

  it('reports dirty when a key is removed', () => {
    expect(isIndexConfigDirty(SCHEMA, {}, { index_name: 'docs' })).toBe(true);
  });

  it('compares array values by content, not identity', () => {
    expect(isIndexConfigDirty(SCHEMA, { include: ['a', 'b'] }, { include: ['a', 'b'] })).toBe(false);
    expect(isIndexConfigDirty(SCHEMA, { include: ['a'] }, { include: ['a', 'b'] })).toBe(true);
  });

  it('compares nested objects by content', () => {
    expect(isIndexConfigDirty(SCHEMA, { opts: { a: 1 } }, { opts: { a: 1 } })).toBe(false);
    expect(isIndexConfigDirty(SCHEMA, { opts: { a: 1 } }, { opts: { a: 2 } })).toBe(true);
  });

  it('distinguishes a false value from a missing key with no default', () => {
    expect(isIndexConfigDirty(SCHEMA, { include: false }, {})).toBe(true);
  });
});
