import { describe, expect, it } from 'vitest';

import { RUN_STATUS_META, toRunStatusLabel, toRunStatusMeta } from '../scheduleRuns.helpers';

describe('run status map', () => {
  it('gives every known status a label and a palette colour', () => {
    Object.entries(RUN_STATUS_META).forEach(([status, meta]) => {
      expect(meta.label, status).toBeTruthy();
      expect(meta.color, status).toMatch(/^[a-z]+\.[a-zA-Z]+$/);
    });
  });

  it('gives every status except running an icon, and running a spinner', () => {
    Object.entries(RUN_STATUS_META).forEach(([status, meta]) => {
      if (status === 'running') {
        expect(meta.isSpinner).toBe(true);
        expect(meta.Icon).toBeNull();
      } else {
        expect(meta.Icon, status).toBeTruthy();
      }
    });
  });

  it('uses the mockup colours for the four statuses of the schedule card', () => {
    expect(
      ['success', 'failed', 'running', 'waiting_for_approval'].map(s => toRunStatusMeta(s).color),
    ).toEqual(['success.main', 'error.main', 'info.main', 'warning.main']);
  });

  it('builds a neutral label and no icon for an unknown status', () => {
    expect(toRunStatusMeta('some_new_state')).toMatchObject({ label: 'Some new state', Icon: null });
    expect(toRunStatusLabel('some_new_state')).toBe('Some new state');
  });
});
