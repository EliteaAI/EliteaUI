// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useCanRunSkill } from '../useCanRunSkill.hooks';

const granted = vi.hoisted(() => ({ permissions: [] }));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermissions: required => required.every(p => granted.permissions.includes(p)) }),
}));

const PREDICT = 'models.applications.predict.post';
const SKILL_DETAILS = 'models.applications.skills.details';
const CATALOG_DETAILS = 'models.applications.public_application.details';

const canRun = (permissions, options) => {
  granted.permissions = permissions;
  return renderHook(() => useCanRunSkill(options)).result.current;
};

describe('useCanRunSkill', () => {
  it('needs predict and skill details to run an own skill', () => {
    expect(canRun([PREDICT, SKILL_DETAILS])).toBe(true);
    expect(canRun([SKILL_DETAILS])).toBe(false);
    expect(canRun([PREDICT, CATALOG_DETAILS])).toBe(false);
  });

  it('needs predict and Catalog details to run a Catalog skill', () => {
    expect(canRun([PREDICT, CATALOG_DETAILS], { isCatalogSkill: true })).toBe(true);
    expect(canRun([PREDICT, SKILL_DETAILS], { isCatalogSkill: true })).toBe(false);
  });
});
