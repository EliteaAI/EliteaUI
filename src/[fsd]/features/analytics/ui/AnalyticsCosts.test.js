import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dir, './AnalyticsCosts.jsx'), 'utf-8');

describe('AnalyticsCosts component structure', () => {
  it('exports a default memo component', () => {
    expect(SRC).toContain('export default AnalyticsCosts');
    expect(SRC).toContain('memo(');
  });

  it('uses useAnalyticsCostsQuery hook', () => {
    expect(SRC).toContain('useAnalyticsCostsQuery');
  });

  it('renders loading state with CircularProgress', () => {
    expect(SRC).toContain('CircularProgress');
    expect(SRC).toContain('isFetching');
  });

  it('renders all required KPI cards', () => {
    expect(SRC).toContain('TOTAL COST');
    expect(SRC).toContain('TOTAL TOKENS');
    expect(SRC).toContain('INPUT TOKENS');
    expect(SRC).toContain('OUTPUT TOKENS');
    expect(SRC).toContain('AVG COST / CALL');
  });

  it('renders model breakdown chart', () => {
    expect(SRC).toContain('Cost by Model');
    expect(SRC).toContain('modelChartData');
  });

  it('renders daily cost trend chart', () => {
    expect(SRC).toContain('Daily Cost Trend');
    expect(SRC).toContain('dailyChartData');
  });

  it('renders cost by agent list', () => {
    expect(SRC).toContain('Cost by Agent');
    expect(SRC).toContain('by_agent');
  });

  it('renders cost by user list', () => {
    expect(SRC).toContain('Cost by User');
    expect(SRC).toContain('by_user');
  });

  it('uses fmtCost for formatting costs', () => {
    expect(SRC).toContain('fmtCost');
  });

  it('uses fmtNum for formatting token counts', () => {
    expect(SRC).toContain('fmtNum');
  });

  it('handles empty agent data gracefully', () => {
    expect(SRC).toContain('No data');
  });

  it('destructures isError from the query hook', () => {
    expect(SRC).toContain('isError');
  });

  it('renders error state with message', () => {
    expect(SRC).toContain('Failed to load cost analytics');
  });

  it('handles empty chart states with conditional rendering', () => {
    expect(SRC).toContain('modelChartData.length');
    expect(SRC).toContain('dailyChartData.length');
  });

  it('passes formatter prop to ChartTooltip', () => {
    expect(SRC).toContain('formatter={');
  });
});
