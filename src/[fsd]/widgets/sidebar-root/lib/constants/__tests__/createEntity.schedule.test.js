import { describe, expect, it } from 'vitest';

import {
  CommandPathMap,
  CreationPermissions,
  DropdownItems,
  PathToOptionMap,
  RouteToLabelMap,
} from '../createEntity.constants';

// EL-7011 CR-03: a schedule is created from the + button of Settings > Schedules, not from the sidebar
describe('EL-7011 R1.5 no Schedule option in the sidebar Create button', () => {
  it('lists no Schedule option and no Schedules label', () => {
    expect(DropdownItems.some(item => item.label === 'Schedule')).toBe(false);
    expect(RouteToLabelMap.some(({ label }) => label === 'Schedule')).toBe(false);
    expect(PathToOptionMap.some(({ option }) => option === 'Schedule')).toBe(false);
  });

  it('keeps no Schedule command or permission', () => {
    expect(CommandPathMap.Schedule).toBeUndefined();
    expect(CreationPermissions.Schedule).toBeUndefined();
  });
});
