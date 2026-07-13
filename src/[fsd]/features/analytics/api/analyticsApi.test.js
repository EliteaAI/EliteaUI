import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dir, './analyticsApi.js'), 'utf-8');

describe('useAnalyticsCostsQuery RTK Query hook', () => {
  it('defines analyticsCosts endpoint', () => {
    expect(SRC).toContain('analyticsCosts: build.query');
  });

  it('exports useAnalyticsCostsQuery hook', () => {
    expect(SRC).toContain('useAnalyticsCostsQuery');
  });

  it('constructs correct URL with project ID', () => {
    expect(SRC).toContain('analytics_costs/prompt_lib/${projectId}');
  });

  it('passes date_from param', () => {
    expect(SRC).toContain("params.set('date_from', dateFrom)");
  });

  it('passes date_to param', () => {
    expect(SRC).toContain("params.set('date_to', dateTo)");
  });

  it('uses GET method', () => {
    // Verify the endpoint uses GET
    const endpointBlock = SRC.slice(SRC.indexOf('analyticsCosts: build.query'));
    expect(endpointBlock).toContain("method: 'GET'");
  });

  it('provides analytics cache tag', () => {
    const endpointBlock = SRC.slice(SRC.indexOf('analyticsCosts: build.query'));
    expect(endpointBlock).toContain('providesTags');
  });

  it('has keepUnusedDataFor cache lifetime', () => {
    const endpointBlock = SRC.slice(SRC.indexOf('analyticsCosts: build.query'));
    expect(endpointBlock).toContain('keepUnusedDataFor');
  });
});
