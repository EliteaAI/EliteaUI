import { describe, expect, it } from 'vitest';

import PipelineValidateSchema from '../pipelineValidationSchema.validation';

const schema = PipelineValidateSchema();

describe('PipelineValidateSchema', () => {
  it('accepts a pipeline without a description', async () => {
    await expect(schema.isValid({ name: 'Pipeline 1', description: '' })).resolves.toBe(true);
    await expect(schema.isValid({ name: 'Pipeline 1' })).resolves.toBe(true);
  });

  it('rejects an empty or whitespace-only name', async () => {
    await expect(schema.validateAt('name', { name: '' })).rejects.toThrow('Name is required');
    await expect(schema.validateAt('name', { name: '   ' })).rejects.toThrow('Name is required');
  });

  it('rejects a name longer than 32 characters', async () => {
    await expect(schema.isValid({ name: 'x'.repeat(33) })).resolves.toBe(false);
    await expect(schema.isValid({ name: 'x'.repeat(32) })).resolves.toBe(true);
  });
});
