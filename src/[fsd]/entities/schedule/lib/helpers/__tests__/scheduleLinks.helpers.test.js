import { describe, expect, it } from 'vitest';

import {
  buildEntityEditorLink,
  buildScheduleFormLink,
  buildSchedulesListLink,
} from '../scheduleLinks.helpers';

// EL-7011 US-35: links of the editor Schedules section; the form opens nested in the editor
// (owner CR 2026-10-21 replaces R3.1, R3.2 and R5.5 of the pack)

describe('scheduleLinks.helpers EL-7011 US-35', () => {
  it('TC-US35-08 R3.1 "+ Schedule" opens the create form nested in the agent', () => {
    expect(buildScheduleFormLink({ entityType: 'agent', entityId: 12, tab: 'my' })).toBe(
      '/agents/my/12/schedules/create',
    );
  });

  it('TC-US35-10 R3.2 R5.5 Edit and Open run history open the edit form nested in the agent', () => {
    expect(buildScheduleFormLink({ entityType: 'agent', entityId: 12, tab: 'all', scheduleId: 4 })).toBe(
      '/agents/all/12/schedules/4',
    );
  });

  it('R3.1 uses the all tab when the editor URL has none', () => {
    expect(buildScheduleFormLink({ entityType: 'agent', entityId: 12 })).toBe(
      '/agents/all/12/schedules/create',
    );
  });

  it('R3.5 the return target is the editor of the entity', () => {
    expect(buildEntityEditorLink({ entityType: 'agent', entityId: 12, tab: 'my' })).toBe('/agents/my/12');
  });

  it('TC-US36-06 TC-US36-07 US-36 R3.1 R3.2 the form opens nested in the pipeline and returns to it', () => {
    const link = scheduleId => buildScheduleFormLink({ entityType: 'pipeline', entityId: 9, scheduleId });

    expect([link(), link(4)]).toEqual(['/pipelines/all/9/schedules/create', '/pipelines/all/9/schedules/4']);
    expect(buildEntityEditorLink({ entityType: 'pipeline', entityId: 9 })).toBe('/pipelines/all/9');
  });

  it('TC-US36-16 US-36 R1.5 "Open all in Schedules" filters the Schedules page by the pipeline', () => {
    expect(buildSchedulesListLink({ entityType: 'pipeline', entityId: 9 })).toBe(
      '/settings/schedules?entityType=pipeline&entityId=9',
    );
  });

  it('TC-US35-18 R3.6 "Open all in Schedules" filters the Schedules page by the entity', () => {
    expect(buildSchedulesListLink({ entityType: 'agent', entityId: 12 })).toBe(
      '/settings/schedules?entityType=agent&entityId=12',
    );
  });
});
