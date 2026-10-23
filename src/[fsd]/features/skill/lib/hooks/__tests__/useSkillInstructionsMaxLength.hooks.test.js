// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useSkillInstructionsMaxLength } from '../useSkillInstructionsMaxLength.hooks';

const platform = vi.hoisted(() => ({ settings: undefined }));

vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => ({ data: platform.settings }),
}));

describe('useSkillInstructionsMaxLength', () => {
  afterEach(() => {
    cleanup();
    platform.settings = undefined;
  });

  it('uses the limit configured in Admin → Settings → Runtime', () => {
    platform.settings = { skill_instructions_max_length: 1200 };

    expect(renderHook(() => useSkillInstructionsMaxLength()).result.current).toBe(1200);
  });

  it('falls back to the 50000 default while platform settings are loading', () => {
    expect(renderHook(() => useSkillInstructionsMaxLength()).result.current).toBe(50000);
  });
});
