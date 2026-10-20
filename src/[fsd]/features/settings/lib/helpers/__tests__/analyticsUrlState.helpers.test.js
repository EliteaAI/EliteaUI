import { describe, expect, it } from 'vitest';

import {
  clearAnalyticsEntity,
  readAnalyticsView,
  updateAnalyticsSearchParams,
  writeAnalyticsView,
} from '../analyticsUrlState.helpers';

const OPTIONS = { presetValues: [0, 7, 30, 90], customPreset: 'custom', defaultTab: 'overview' };

const FROM = new Date('2026-10-01T08:00:00.000Z');
const TO = new Date('2026-10-05T18:30:00.000Z');

describe('readAnalyticsView', () => {
  it('opens the Overview for today when the URL carries no state', () => {
    const view = readAnalyticsView(new URLSearchParams(), OPTIONS);

    expect(view.tab).toBe('overview');
    expect(view.preset).toBe(0);
  });

  it('restores the tab and recomputes a preset range from now', () => {
    const view = readAnalyticsView(new URLSearchParams('tab=agents&range=30'), OPTIONS);

    expect(view.tab).toBe('agents');
    expect(view.preset).toBe(30);
    expect(view.to.getTime() - view.from.getTime()).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
  });

  it('restores a custom range exactly', () => {
    const view = readAnalyticsView(
      new URLSearchParams(`range=custom&from=${FROM.toISOString()}&to=${TO.toISOString()}`),
      OPTIONS,
    );

    expect(view.preset).toBe('custom');
    expect(view.from).toEqual(FROM);
    expect(view.to).toEqual(TO);
  });

  it('falls back to today for an unknown preset', () => {
    expect(readAnalyticsView(new URLSearchParams('range=12'), OPTIONS).preset).toBe(0);
  });
});

describe('writeAnalyticsView', () => {
  it('writes the tab and preset without dates for a preset range', () => {
    const next = writeAnalyticsView(new URLSearchParams('from=x&to=y'), {
      tab: 'agents',
      preset: 7,
      from: FROM,
      to: TO,
      customPreset: 'custom',
    });

    expect(next.toString()).toBe('tab=agents&range=7');
  });

  it('writes the dates of a custom range', () => {
    const next = writeAnalyticsView(new URLSearchParams(), {
      tab: 'agents',
      preset: 'custom',
      from: FROM,
      to: TO,
      customPreset: 'custom',
    });

    expect(next.get('from')).toBe(FROM.toISOString());
    expect(next.get('to')).toBe(TO.toISOString());
  });

  it('keeps the selected agent while the tab stays the same', () => {
    const next = writeAnalyticsView(new URLSearchParams('tab=agents&range=7&agent_id=42'), {
      tab: 'agents',
      preset: 30,
      customPreset: 'custom',
    });

    expect(next.get('agent_id')).toBe('42');
  });

  it('keeps the selected agent and skill when the tab changes', () => {
    const next = writeAnalyticsView(new URLSearchParams('tab=skills&range=7&skill_id=5&skill_project_id=2'), {
      tab: 'overview',
      preset: 7,
      customPreset: 'custom',
    });

    expect(next.toString()).toBe('tab=overview&range=7&skill_id=5&skill_project_id=2');
  });
});

describe('clearAnalyticsEntity', () => {
  it('drops the selected agent and skill and nothing else', () => {
    const next = clearAnalyticsEntity(
      new URLSearchParams('tab=agents&range=7&agent_id=42&skill_id=5&skill_project_id=2'),
    );

    expect(next.toString()).toBe('tab=agents&range=7');
  });
});

describe('updateAnalyticsSearchParams', () => {
  it('sets values and deletes empty ones without touching the rest', () => {
    const next = updateAnalyticsSearchParams(new URLSearchParams('tab=skills&skill_id=5'), {
      agent_id: 42,
      skill_id: null,
    });

    expect(next.toString()).toBe('tab=skills&agent_id=42');
  });
});
