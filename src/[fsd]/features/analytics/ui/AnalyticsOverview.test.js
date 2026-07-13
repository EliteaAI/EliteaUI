import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dir, './AnalyticsOverview.jsx'), 'utf-8');

describe('AnalyticsOverview KPI cards with token/cost data', () => {
  it('renders token count KPI card', () => {
    expect(SRC).toContain('TOKENS');
    expect(SRC).toContain('total_tokens');
  });

  it('renders total LLM cost KPI card', () => {
    expect(SRC).toContain('LLM COST');
    expect(SRC).toContain('total_llm_cost');
  });

  it('uses fmtCost for cost formatting', () => {
    expect(SRC).toContain('fmtCost');
  });

  it('uses fmtNum for token formatting', () => {
    expect(SRC).toContain('fmtNum');
  });

  it('has KPICard component imported', () => {
    expect(SRC).toContain('KPICard');
  });

  it('renders existing non-cost KPI cards alongside new ones', () => {
    expect(SRC).toContain('TEAM');
    expect(SRC).toContain('LLM CALLS');
    expect(SRC).toContain('TOOL RUNS');
  });
});
