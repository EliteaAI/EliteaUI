import { describe, expect, it } from 'vitest';

import {
  buildEntityEditorLink,
  buildScheduleFormLink,
  buildScheduleHistoryLink,
  buildScheduleRunsLink,
  buildSchedulesListLink,
} from '../scheduleLinks.helpers';

// links of the editor Schedules section; the form opens nested in the editor
// ( replaces of the pack)

describe('scheduleLinks.helpers', () => {
  it('TC-US35-08 "+ Schedule" opens the create form nested in the agent', () => {
    expect(buildScheduleFormLink({ entityType: 'agent', entityId: 12, tab: 'my' })).toBe(
      '/agents/my/12/schedules/create',
    );
  });

  it('TC-US35-10 Edit and Open run history open the edit form nested in the agent', () => {
    expect(buildScheduleFormLink({ entityType: 'agent', entityId: 12, tab: 'all', scheduleId: 4 })).toBe(
      '/agents/all/12/schedules/4',
    );
  });

  it('uses the all tab when the editor URL has none', () => {
    expect(buildScheduleFormLink({ entityType: 'agent', entityId: 12 })).toBe(
      '/agents/all/12/schedules/create',
    );
  });

  it('the return target is the editor of the entity', () => {
    expect(buildEntityEditorLink({ entityType: 'agent', entityId: 12, tab: 'my' })).toBe('/agents/my/12');
  });

  it('TC-US36-06 TC-US36-07 the form opens nested in the pipeline and returns to it', () => {
    const link = scheduleId => buildScheduleFormLink({ entityType: 'pipeline', entityId: 9, scheduleId });

    expect([link(), link(4)]).toEqual(['/pipelines/all/9/schedules/create', '/pipelines/all/9/schedules/4']);
    expect(buildEntityEditorLink({ entityType: 'pipeline', entityId: 9 })).toBe('/pipelines/all/9');
  });

  it('TC-US36-16 "Open all in Schedules" filters the Schedules page by the pipeline', () => {
    expect(buildSchedulesListLink({ entityType: 'pipeline', entityId: 9 })).toBe(
      '/settings/schedules?entityType=pipeline&entityId=9',
    );
  });

  it('Open run history opens the edit form nested in the entity on its Runs section', () => {
    expect(buildScheduleRunsLink({ entityType: 'pipeline', entityId: 9, tab: 'my', scheduleId: 4 })).toEqual({
      pathname: '/pipelines/my/9/schedules/4',
      hash: '#runs',
    });
  });

  it('Open run history of the Schedules page opens the edit page on its Runs section', () => {
    expect(buildScheduleRunsLink({ scheduleId: 64 })).toEqual({
      pathname: '/settings/schedules/64',
      hash: '#runs',
    });
  });

  it('TC-US35-18 "Open all in Schedules" filters the Schedules page by the entity', () => {
    expect(buildSchedulesListLink({ entityType: 'agent', entityId: 12 })).toBe(
      '/settings/schedules?entityType=agent&entityId=12',
    );
  });
});

describe('buildScheduleHistoryLink', () => {
  it('buildScheduleHistoryLink builds the pipeline history URL with schedule_id', () => {
    expect(buildScheduleHistoryLink({ id: 4, entity_type: 'pipeline', application_id: 80 })).toBe(
      '/pipelines/all/80/history?schedule_id=4',
    );
    expect(buildScheduleHistoryLink({ id: 5, entity_type: 'agent', application_id: 7 })).toBe(
      '/agents/all/7/history?schedule_id=5',
    );
  });
});
