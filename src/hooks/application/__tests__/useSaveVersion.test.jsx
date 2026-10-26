// @vitest-environment jsdom
import { Formik } from 'formik';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import useSaveVersion from '../useSaveVersion';

const mocks = vi.hoisted(() => ({
  saveFn: vi.fn(),
  dispatch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  handleChangeName: vi.fn(),
  updateQueryData: vi.fn((endpoint, args) => ({ type: 'updateQueryData', endpoint, args })),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: selector => selector({ pipelineEditor: { nodes: [] }, user: { id: 1 } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async () => ({
  // The real guard is the behaviour under test; the rest of the barrel pulls in API modules
  useStaleSaveGuard: (await import('@/[fsd]/shared/lib/hooks/useStaleSaveGuard.hooks')).useStaleSaveGuard,
  useChangeNameInUrlSearchParams: () => mocks.handleChangeName,
  useIsFrom: () => false,
  useSelectedProjectId: () => 406,
  useToast: () => ({ toastError: mocks.toastError, toastSuccess: mocks.toastSuccess }),
}));
vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({
  useSyncChatConfigParticipant: () => ({ syncParticipant: vi.fn() }),
}));
vi.mock('@/api/applications', () => ({
  useApplicationEditMutation: () => [mocks.saveFn, { isLoading: false, reset: vi.fn() }],
}));
vi.mock('@/api/configurations', () => ({ useListModelsQuery: () => ({ data: { items: [] } }) }));
vi.mock('@/api/eliteaApi', () => ({ eliteaApi: { util: { updateQueryData: mocks.updateQueryData } } }));
vi.mock('@/pages/Pipelines/useSavePipeline', () => ({
  default: () => ({ isFromPipeline: true, yamlCode: 'nodes: []\n' }),
  calculateNodesAndEdges: () => ({ nodes: [], edges: [] }),
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: error => String(error) }));
vi.mock('@/common/applicationUtils', () => ({ default: tools => tools, filterEmptyStrings: list => list }));
vi.mock('@/slices/applications', () => ({
  actions: { setIsSaving: value => ({ type: 'setIsSaving', value }) },
}));
vi.mock('@/[fsd]/shared/lib/utils', () => ({ cleanLLMSettings: settings => settings }));
vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/constants', () => ({
  FlowEditorConstants: { LAYOUT_VERSION: '1.0', ORIENTATION: { vertical: 'vertical' } },
}));
vi.mock('../useSaveChangedTools', () => ({
  default: () => ({ onSaveTools: async () => true, isSavingToolkit: false }),
}));

const pipeline = (id, name, versionId) => ({
  id,
  name,
  description: '',
  version_details: { id: versionId, tools: [], meta: {}, instructions: '' },
});

const PIPELINE_A = pipeline(545, 'CodeExecutor', 1092);
const PIPELINE_B = pipeline(997, 'issue1445_pipeline_B', 1723);

const renderSave = () => {
  const harness = { navigate: null, resetFormSpy: vi.fn(), formValues: { current: PIPELINE_A } };
  const NavigateCapture = () => {
    harness.navigate = useNavigate();
    return null;
  };
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={['/pipelines/all/545']}>
      <NavigateCapture />
      <Routes>
        <Route
          path="/pipelines/:tab/:agentId"
          element={
            <Formik
              enableReinitialize
              initialValues={harness.formValues.current}
              onSubmit={vi.fn()}
            >
              {children}
            </Formik>
          }
        />
      </Routes>
    </MemoryRouter>
  );
  const utils = renderHook(() => useSaveVersion(), { wrapper });
  return { ...utils, harness };
};

const savedResponse = values => ({
  data: { id: values.id, name: values.name, version_details: values.version_details },
});

describe('useSaveVersion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates the form and the URL name after a save of the pipeline still on screen', async () => {
    mocks.saveFn.mockResolvedValue(savedResponse(PIPELINE_A));
    const { result } = renderSave();

    let saved;
    await act(async () => {
      saved = await result.current.onSave();
    });

    expect(saved).toBeTruthy();
    expect(mocks.handleChangeName).toHaveBeenCalledWith('CodeExecutor');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('The pipeline has been updated');
  });

  it('leaves the next pipeline untouched when the save resolves after the user moved to it', async () => {
    let resolveSave;
    mocks.saveFn.mockReturnValue(new Promise(resolve => (resolveSave = resolve)));
    const { result, harness, rerender } = renderSave();

    let savePromise;
    act(() => {
      savePromise = result.current.onSave();
    });
    // The user leaves A for B while the request is in flight; the page keeps the same instance
    harness.formValues.current = PIPELINE_B;
    act(() => harness.navigate('/pipelines/all/997'));
    rerender();

    let saved;
    await act(async () => {
      resolveSave(savedResponse(PIPELINE_A));
      saved = await savePromise;
    });

    expect(saved).toBe(false);
    expect(mocks.handleChangeName).not.toHaveBeenCalled();
    // A's caches are still updated, keyed by A's id
    expect(mocks.updateQueryData).toHaveBeenCalledWith(
      'applicationDetails',
      { applicationId: 545, projectId: 406 },
      expect.any(Function),
    );
  });

  it('refuses to save when the form holds another pipeline than the URL', async () => {
    const { result, harness, rerender } = renderSave();
    act(() => harness.navigate('/pipelines/all/997'));
    rerender();

    let saved;
    await act(async () => {
      saved = await result.current.onSave();
    });

    expect(saved).toBe(false);
    expect(mocks.saveFn).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalled();
  });
});
