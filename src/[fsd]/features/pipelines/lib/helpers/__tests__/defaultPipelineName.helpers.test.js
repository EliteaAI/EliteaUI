import { describe, expect, it } from 'vitest';

import { getDefaultPipelineName } from '../defaultPipelineName.helpers';

describe('getDefaultPipelineName', () => {
  it('returns "Pipeline 1" when the project has no pipelines', () => {
    expect(getDefaultPipelineName(0)).toBe('Pipeline 1');
    expect(getDefaultPipelineName()).toBe('Pipeline 1');
  });

  it('returns total + 1', () => {
    expect(getDefaultPipelineName(4)).toBe('Pipeline 5');
  });

  it('falls back to "Pipeline 1" for invalid totals', () => {
    expect(getDefaultPipelineName(null)).toBe('Pipeline 1');
    expect(getDefaultPipelineName(-3)).toBe('Pipeline 1');
    expect(getDefaultPipelineName('7')).toBe('Pipeline 1');
  });
});
