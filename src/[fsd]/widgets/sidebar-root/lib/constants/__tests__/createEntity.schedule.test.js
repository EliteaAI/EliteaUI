import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '@/common/constants';
import RouteDefinitions from '@/routes';

import {
  BreadCrumbMap,
  CommandPathMap,
  CreationPermissions,
  DropdownItems,
  PrevUrlPathMap,
  RouteToLabelMap,
} from '../createEntity.constants';

// EL-7011 US-31: the sidebar Create button reads "+ Schedule" on the Schedules page, as for Agents and Pipelines
describe('EL-7011 R1.1 Create button for schedules', () => {
  it('labels the button Schedule on the Schedules page', () => {
    const match = RouteToLabelMap.find(({ route }) => RouteDefinitions.Schedules.includes(route));
    expect(match.label).toBe('Schedule');
  });

  it('opens the New schedule page and returns to the list', () => {
    expect(DropdownItems.find(item => item.label === 'Schedule').option).toBe('Schedule');
    expect(CommandPathMap.Schedule).toBe(RouteDefinitions.CreateSchedule);
    expect(PrevUrlPathMap[RouteDefinitions.CreateSchedule]).toBe(RouteDefinitions.Schedules);
    expect(BreadCrumbMap[RouteDefinitions.CreateSchedule]).toBe('Schedules');
  });

  it('asks for the schedules create permission', () => {
    expect(CreationPermissions.Schedule).toEqual([PERMISSIONS.schedules.create]);
  });
});
