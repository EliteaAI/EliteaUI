import { describe, expect, it } from 'vitest';

import { BREADCRUMB_REGISTRY } from '@/[fsd]/shared/lib/constants/breadcrumb.constants';
import { ExploreSections } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import { PERMISSIONS } from '@/common/constants';
import RouteDefinitions from '@/routes';

describe('Schedules out of the main navigation', () => {
  it('has no Schedules section in Explore', () => {
    expect(ExploreSections.map(section => section.value)).not.toContain('schedules');
    expect(ExploreSections.map(section => section.url)).not.toContain(RouteDefinitions.Schedules);
  });

  it('declares the Settings routes, their breadcrumb and every schedule permission', () => {
    expect(RouteDefinitions.Schedules).toBe('/settings/schedules');
    expect(RouteDefinitions.CreateSchedule).toBe('/settings/schedules/create');
    expect(BREADCRUMB_REGISTRY[RouteDefinitions.Schedules].label).toBe('Schedules');
    expect(Object.values(PERMISSIONS.schedules).sort((a, b) => a.localeCompare(b))).toEqual(
      ['admin', 'create', 'delete', 'details', 'export', 'import', 'list', 'run', 'update']
        .map(action => `models.applications.schedules.${action}`)
        .sort((a, b) => a.localeCompare(b)),
    );
  });
});
