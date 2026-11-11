// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { isAtRunCap, lastDeliveryText, toDeliveryOutcomeLabel } from '../webhookRow.helpers';

// #7456: the outcome the delivery door stores for the last authentic request
describe('toDeliveryOutcomeLabel', () => {
  it.each([
    ['accepted', 'Accepted'],
    ['duplicate', 'Duplicate'],
    ['ping', 'Ping received'],
    ['disabled', 'Disabled'],
    ['refused', 'Refused'],
    ['start_failed', 'Start failed'],
  ])('%s -> %s', (outcome, label) => {
    expect(toDeliveryOutcomeLabel(outcome)).toBe(label);
  });

  it('shows an unknown outcome as stored and nothing for none', () => {
    expect(toDeliveryOutcomeLabel('later_kind')).toBe('later_kind');
    expect(toDeliveryOutcomeLabel(null)).toBe('');
  });
});

describe('lastDeliveryText', () => {
  it('says so when nothing was delivered', () => {
    expect(lastDeliveryText({})).toBe('No delivery yet');
  });

  it('starts with the outcome label', () => {
    expect(
      lastDeliveryText({ last_delivery_at: '2026-11-09T10:00:00Z', last_delivery_outcome: 'ping' }),
    ).toMatch(/^Ping received - /);
  });
});

describe('isAtRunCap (#7400)', () => {
  it('is true only at or over the cap, and never on rows without one', () => {
    expect(isAtRunCap({ running_runs: 3, run_cap: 3 })).toBe(true);
    expect(isAtRunCap({ running_runs: 2, run_cap: 3 })).toBe(false);
    expect(isAtRunCap({ running_runs: 0, run_cap: null })).toBe(false); // a cron row
    expect(isAtRunCap({})).toBe(false);
  });
});
