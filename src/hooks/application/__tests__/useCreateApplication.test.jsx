// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import useCreateApplication from '../useCreateApplication';

const mocks = vi.hoisted(() => ({
  createResult: { data: undefined, error: undefined, isLoading: false, isError: false },
  refetchLimit: vi.fn(),
}));

vi.mock('@/[fsd]/features/agent/lib/hooks/useConversationStartersLimit.hooks', () => ({
  useRefetchConversationStartersLimit: () => mocks.refetchLimit,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: selector => selector({ pipelineEditor: { nodes: [] } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/api/applications', () => ({
  useApplicationCreateMutation: () => [vi.fn(), mocks.createResult],
}));
vi.mock('@/pages/Pipelines/useSavePipeline', () => ({
  default: () => ({ isFromPipeline: false, yamlCode: '', orientation: 'vertical' }),
  calculateNodesAndEdges: () => ({ nodes: [], edges: [] }),
}));
vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/constants', () => ({
  FlowEditorConstants: { LAYOUT_VERSION: '1.0', ORIENTATION: { vertical: 'vertical' } },
}));

const formik = { values: { name: 'Agent', version_details: {} }, setFieldError: vi.fn(), resetForm: vi.fn() };

const tooManyStarters = {
  status: 400,
  data: [
    {
      type: 'value_error',
      loc: ['conversation_starters'],
      msg: 'conversation_starters cannot exceed 4 items, got 5',
    },
  ],
};

describe('useCreateApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('refetches the starters limit when the create is rejected for too many starters', () => {
    mocks.createResult = { error: tooManyStarters, isError: true, isLoading: false };
    renderHook(() => useCreateApplication(formik, null, { skipNavigation: true }));

    expect(mocks.refetchLimit).toHaveBeenCalledTimes(1);
  });

  it('does not refetch the starters limit on other create errors', () => {
    mocks.createResult = {
      error: { status: 400, data: [{ loc: ['name'], msg: 'bad' }] },
      isError: true,
      isLoading: false,
    };
    renderHook(() => useCreateApplication(formik, null, { skipNavigation: true }));

    expect(mocks.refetchLimit).not.toHaveBeenCalled();
    expect(formik.setFieldError).toHaveBeenCalledWith('name', 'bad');
  });
});
