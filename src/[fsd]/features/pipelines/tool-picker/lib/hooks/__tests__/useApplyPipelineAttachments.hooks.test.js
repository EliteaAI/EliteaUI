// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useApplyPipelineAttachments } from '../useApplyPipelineAttachments.hooks';

const mocks = vi.hoisted(() => ({
  associateToolkit: vi.fn(),
  updateRelation: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useToast: () => ({ toastError: mocks.toastError }),
}));
vi.mock('@/api/toolkits', () => ({
  useToolkitAssociateMutation: () => [mocks.associateToolkit, { isLoading: false }],
}));
vi.mock('@/api/applications', () => ({
  useUpdateApplicationRelationMutation: () => [mocks.updateRelation, { isLoading: false }],
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: error => error?.data?.error || 'error' }));
vi.mock('@/hooks/application/useAgentPipelineAssociation', () => ({
  mapAssociationError: (message, name) => `${name}: ${message}`,
}));

const resolved = value => ({ unwrap: () => Promise.resolve(value) });
const rejected = error => ({ unwrap: () => Promise.reject({ data: { error } }) });

const jira = { id: 1, type: 'jira', toolkit_name: 'jira', settings: { selected_tools: ['search'] } };
const slack = { id: 3, type: 'slack', toolkit_name: 'slack', settings: { selected_tools: [] } };
const reviewer = {
  type: 'application',
  name: 'Reviewer',
  settings: { application_id: 7, application_version_id: 70 },
};

const apply = async args => {
  const { result } = renderHook(() => useApplyPipelineAttachments());
  let applied;
  await act(async () => {
    applied = await result.current.applyAttachments({ applicationId: 5, versionId: 50, ...args });
  });
  return applied;
};

describe('useApplyPipelineAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.associateToolkit.mockReturnValue(resolved({ ok: true }));
    mocks.updateRelation.mockReturnValue(resolved({ tool_id: 99 }));
  });

  it('sends nothing when the attachments did not change', async () => {
    const applied = await apply({ initialTools: [jira], tools: [jira] });
    expect(applied).toEqual({ tools: [jira] });
    expect(mocks.associateToolkit).not.toHaveBeenCalled();
    expect(mocks.updateRelation).not.toHaveBeenCalled();
  });

  it('attaches new items, detaches removed ones and fills in new agent tool ids', async () => {
    const applied = await apply({ initialTools: [slack], tools: [jira, reviewer] });

    expect(mocks.associateToolkit).toHaveBeenCalledWith(
      expect.objectContaining({
        toolkitId: 1,
        has_relation: true,
        selected_tools: ['search'],
        entity_version_id: 50,
      }),
    );
    expect(mocks.updateRelation).toHaveBeenCalledWith(
      expect.objectContaining({ selectedApplicationId: 7, selectedVersionId: 70, has_relation: true }),
    );
    expect(mocks.associateToolkit).toHaveBeenCalledWith(
      expect.objectContaining({ toolkitId: 3, has_relation: false }),
    );
    expect(applied.tools[1]).toEqual({ ...reviewer, id: 99 });
  });

  it('switches an agent version with a single relation call', async () => {
    const switched = { ...reviewer, id: 9, settings: { ...reviewer.settings, application_version_id: 71 } };
    await apply({ initialTools: [{ ...reviewer, id: 9 }], tools: [switched] });
    expect(mocks.updateRelation).toHaveBeenCalledTimes(1);
    expect(mocks.updateRelation).toHaveBeenCalledWith(
      expect.objectContaining({ selectedVersionId: 71, has_relation: true }),
    );
  });

  it('treats relations already in the requested state as applied', async () => {
    mocks.associateToolkit.mockReturnValueOnce(rejected('Already exists relation with toolkit id 1'));
    mocks.associateToolkit.mockReturnValueOnce(rejected('Already removed relation with toolkit id 3'));
    const applied = await apply({ initialTools: [slack], tools: [jira] });
    expect(applied).toEqual({ tools: [jira] });
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('stops on the first real failure and reports it', async () => {
    mocks.associateToolkit.mockReturnValueOnce(rejected('Version id 50 is published and can not be updated'));
    const applied = await apply({ initialTools: [slack], tools: [jira] });
    expect(applied).toBe(false);
    expect(mocks.associateToolkit).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('published'));
  });
});
