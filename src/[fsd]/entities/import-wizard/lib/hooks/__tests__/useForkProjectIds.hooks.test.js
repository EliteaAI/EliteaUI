// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import importWizardReducer, { actions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { cleanup, renderHook } from '@testing-library/react';

import { useForkProjectIds } from '../useForkProjectIds.hooks';

const currentProjectId = 2;
const otherProjectId = 7;

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => currentProjectId }));

afterEach(cleanup);

const excludedFor = (isForking, sourceProjectId) =>
  renderHook(() => useForkProjectIds(isForking, sourceProjectId)).result.current.excludedProjectIds;

describe('fork destination exclusions', () => {
  it('keeps the current project as a destination when forking from the public catalog', () => {
    expect(excludedFor(true, PUBLIC_PROJECT_ID)).not.toContain(currentProjectId);
  });

  it('excludes the project the entity is forked from', () => {
    expect(excludedFor(true, currentProjectId)).toEqual([PUBLIC_PROJECT_ID, currentProjectId]);
    expect(excludedFor(true, otherProjectId)).toEqual([PUBLIC_PROJECT_ID, otherProjectId]);
  });

  it('falls back to excluding the current project when the fork source is unknown', () => {
    expect(excludedFor(true, undefined)).toEqual([PUBLIC_PROJECT_ID, currentProjectId]);
  });

  it('excludes nothing when importing', () => {
    expect(excludedFor(false, currentProjectId)).toEqual([]);
  });
});

describe('import wizard source project', () => {
  it('is remembered while the wizard is open and cleared on close', () => {
    const opened = importWizardReducer(
      undefined,
      actions.openImportWizard({ isForking: true, data: {}, sourceProjectId: PUBLIC_PROJECT_ID }),
    );
    expect(opened.sourceProjectId).toBe(PUBLIC_PROJECT_ID);

    const closed = importWizardReducer(opened, actions.closeImportWizard());
    expect(closed.sourceProjectId).toBeUndefined();
  });
});
