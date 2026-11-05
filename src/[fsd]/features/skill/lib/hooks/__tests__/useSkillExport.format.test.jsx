// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSkillExport } from '../useSkillExport.hooks';

const spies = vi.hoisted(() => ({
  exportSkill: vi.fn(),
  trackEvent: vi.fn(),
  downloadBlobFile: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/GA', () => ({ useTrackEvent: () => spies.trackEvent }));
vi.mock('@/[fsd]/features/skill/api', () => ({
  useLazySkillExportMdQuery: () => [spies.exportSkill, { isFetching: false }],
}));
vi.mock('@/[fsd]/shared/lib/constants', () => ({
  AnalyticConstants: {
    GA_EVENT_NAMES: { ENTITY_EXPORTED: 'entity_exported' },
    GA_EVENT_PARAMS: {
      ENTITY_ID: 'entity_id',
      ENTITY_NAME: 'entity_name',
      ENTITY_TYPE: 'entity_type',
      EXPORT_FORMAT: 'export_format',
      TIMESTAMP: 'timestamp',
    },
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: spies.toastError }),
}));
vi.mock('@/common/utils', () => ({
  buildErrorMessage: error => error?.message,
  downloadBlobFile: spies.downloadBlobFile,
}));

const exportAs = async filename => {
  const blob = new Blob(['x']);
  spies.exportSkill.mockReturnValue({ unwrap: () => Promise.resolve({ blob, filename }) });
  const hook = renderHook(() => useSkillExport());
  await act(async () => {
    await hook.result.current.doExport({ skillId: 7, versionId: 70, skillName: 'pdf' });
  });
  return blob;
};

const trackedFormat = () => spies.trackEvent.mock.calls.at(-1)[1].export_format;

describe('useSkillExport download format', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('saves a ZIP export under the name the server gave and records the zip format', async () => {
    const blob = await exportAs('pdf.zip');

    expect(spies.downloadBlobFile).toHaveBeenCalledWith(blob, 'pdf.zip');
    expect(trackedFormat()).toBe('zip');
  });

  it('records the md format for a Markdown export', async () => {
    await exportAs('pdf.md');

    expect(trackedFormat()).toBe('md');
  });

  it('falls back to the skill name as a .md file when the server names nothing', async () => {
    const blob = await exportAs(undefined);

    expect(spies.downloadBlobFile).toHaveBeenCalledWith(blob, 'pdf.md');
    expect(trackedFormat()).toBe('md');
  });
});
