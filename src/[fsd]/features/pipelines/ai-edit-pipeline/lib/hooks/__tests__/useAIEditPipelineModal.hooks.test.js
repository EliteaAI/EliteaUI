// @vitest-environment jsdom
import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildApplicationAttachment,
  buildToolkitAttachment,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers';
import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import {
  useLazyApplicationDetailsQuery,
  useLazyGetApplicationVersionDetailQuery,
  useLazyToolkitsDetailsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { act, renderHook } from '@testing-library/react';

import { useAIEditPipelineModal } from '../useAIEditPipelineModal.hooks';

vi.mock('formik', () => ({ useFormikContext: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: vi.fn() }));
vi.mock('js-yaml', () => ({ default: { load: vi.fn(() => ({})) } }));

vi.mock('@/[fsd]/features/pipelines/api/generatePipelineApi', () => ({
  useGeneratePipelineDraftMutation: vi.fn(() => [vi.fn(), { error: null, reset: vi.fn() }]),
}));

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/helpers', () => ({
  FlowEditorHelpers: { convertNode: vi.fn(n => n) },
  LayoutHelpers: { doLayout: vi.fn(() => ({ nodes: [], edges: [] })) },
  ParsePipelineHelpers: { parseYaml: vi.fn(() => ({ nodes: [], edges: [] })) },
}));

vi.mock('@/[fsd]/features/pipelines/lib/helpers', () => ({
  toggleSet: vi.fn(
    setter => id =>
      setter(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
  ),
}));

vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers', () => ({
  buildToolkitAttachment: vi.fn((t, opts) => ({
    type: opts?.mcp ? 'mcp' : 'toolkit',
    id: t.id,
    name: t.name,
  })),
  buildApplicationAttachment: vi.fn((app, vd) => ({
    type: 'application',
    settings: { application_id: app.id, application_version_id: vd?.id },
  })),
}));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useLazySkillDetailsQuery: vi.fn(() => [vi.fn()]),
  useUpdateSkillRelationMutation: vi.fn(() => [vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) }))]),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: vi.fn(() => 1),
  useToast: vi.fn(() => ({ toastError: vi.fn(), toastSuccess: vi.fn(), toastWarning: vi.fn() })),
}));

vi.mock('@/api', () => ({
  useLazyApplicationDetailsQuery: vi.fn(() => [vi.fn()]),
  useLazyGetApplicationVersionDetailQuery: vi.fn(() => [vi.fn()]),
  useLazyToolkitsDetailsQuery: vi.fn(() => [vi.fn()]),
  useToolkitAssociateMutation: vi.fn(() => [vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) }))]),
  useUpdateApplicationRelationMutation: vi.fn(() => [
    vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) })),
  ]),
}));

vi.mock('@/common/utils', () => ({ buildErrorMessage: vi.fn(() => 'error') }));

vi.mock('@/hooks/application/useAgentPipelineAssociation', () => ({
  mapAssociationError: vi.fn(msg => msg),
}));

vi.mock('@/hooks/application/useSaveNewVersion', () => ({
  default: vi.fn(() => ({ onCreateNewVersion: vi.fn() })),
}));

vi.mock('@/slices/pipeline', () => ({
  actions: {
    initThePipeline: vi.fn(p => ({ type: 'pipeline/init', payload: p })),
    applyPipelineDraft: vi.fn(p => ({ type: 'pipeline/applyDraft', payload: p })),
  },
}));

vi.mock('@/slices/pipelineEditor', () => ({
  actions: { resetPipelineEditor: vi.fn(() => ({ type: 'pipelineEditor/reset' })) },
}));

const mockSetFieldValue = vi.fn().mockResolvedValue(undefined);
const mockDispatch = vi.fn();
const mockOnClose = vi.fn();

const baseVersionDetails = {
  id: 10,
  instructions: 'old_yaml: true',
  tools: [],
  llm_settings: {},
  pipeline_settings: { orientation: 'horizontal', nodes: [], layout_version: 2 },
};

const makeFormikValues = (overrides = {}) => ({
  id: 1,
  name: 'Test Pipeline',
  description: 'Test description',
  version_details: baseVersionDetails,
  webhook_secret: null,
  ...overrides,
});

// Helpers to get the inner mock fns from the hook-level mocks
const getAssociateToolkitFn = () => vi.mocked(useToolkitAssociateMutation).mock.results[0]?.value[0];
const getUpdateApplicationRelationFn = () =>
  vi.mocked(useUpdateApplicationRelationMutation).mock.results[0]?.value[0];
const getUpdateSkillRelationFn = () => vi.mocked(useUpdateSkillRelationMutation).mock.results[0]?.value[0];
const getFetchApplicationDetailsFn = () =>
  vi.mocked(useLazyApplicationDetailsQuery).mock.results[0]?.value[0];
const getFetchSkillDetailsFn = () => vi.mocked(useLazySkillDetailsQuery).mock.results[0]?.value[0];
const getFetchToolkitDetailsFn = () => vi.mocked(useLazyToolkitsDetailsQuery).mock.results[0]?.value[0];

beforeEach(() => {
  vi.clearAllMocks();

  const unwrapOk = vi.fn().mockResolvedValue({});
  vi.mocked(useToolkitAssociateMutation).mockReturnValue([vi.fn(() => ({ unwrap: unwrapOk }))]);
  vi.mocked(useUpdateApplicationRelationMutation).mockReturnValue([vi.fn(() => ({ unwrap: unwrapOk }))]);
  vi.mocked(useUpdateSkillRelationMutation).mockReturnValue([vi.fn(() => ({ unwrap: unwrapOk }))]);
  vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([vi.fn()]);
  vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([vi.fn()]);
  vi.mocked(useLazyGetApplicationVersionDetailQuery).mockReturnValue([
    vi.fn().mockResolvedValue({ data: null }),
  ]);
  vi.mocked(useLazySkillDetailsQuery).mockReturnValue([vi.fn()]);

  useFormikContext.mockReturnValue({
    values: makeFormikValues(),
    setFieldValue: mockSetFieldValue,
  });
  useDispatch.mockReturnValue(mockDispatch);
});

describe('useAIEditPipelineModal', () => {
  describe('toggle handlers', () => {
    it('handleToggleAddToolkit adds then removes on second call', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddToolkit(5));
      expect(result.current.addToolkitIds.has(5)).toBe(true);

      act(() => result.current.handleToggleAddToolkit(5));
      expect(result.current.addToolkitIds.has(5)).toBe(false);
    });

    it('handleToggleAddMcp toggles mcp ids', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleToggleAddMcp(7));
      expect(result.current.addMcpIds.has(7)).toBe(true);
    });

    it('handleToggleAddAgent toggles agent ids', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleToggleAddAgent(3));
      expect(result.current.addAgentIds.has(3)).toBe(true);
    });

    it('handleToggleAddPipeline toggles pipeline ids', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleToggleAddPipeline(4));
      expect(result.current.addPipelineIds.has(4)).toBe(true);
    });

    it('handleToggleAddSkill toggles skill ids', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleToggleAddSkill(9));
      expect(result.current.addSkillIds.has(9)).toBe(true);
    });

    it('handleToggleRemoveTool toggles removeToolRecordIds', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleToggleRemoveTool(11));
      expect(result.current.removeToolRecordIds.has(11)).toBe(true);
    });

    it('all sets start empty', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      expect(result.current.addToolkitIds.size).toBe(0);
      expect(result.current.addMcpIds.size).toBe(0);
      expect(result.current.addAgentIds.size).toBe(0);
      expect(result.current.addPipelineIds.size).toBe(0);
      expect(result.current.addSkillIds.size).toBe(0);
      expect(result.current.removeToolRecordIds.size).toBe(0);
    });
  });

  describe('currentTools', () => {
    it('reflects version_details.tools from formik', () => {
      const tools = [{ type: 'jira', id: 1 }];
      useFormikContext.mockReturnValue({
        values: makeFormikValues({ version_details: { ...baseVersionDetails, tools } }),
        setFieldValue: mockSetFieldValue,
      });
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      expect(result.current.currentTools).toEqual(tools);
    });

    it('returns empty array when tools are absent', () => {
      useFormikContext.mockReturnValue({
        values: { ...makeFormikValues(), version_details: { id: 10 } },
        setFieldValue: mockSetFieldValue,
      });
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      expect(result.current.currentTools).toEqual([]);
    });
  });

  describe('handleDraftGenerated', () => {
    it('populates selection sets from suggestions', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      const draftData = {
        suggested_toolkits: [{ id: 10 }, { id: 11 }],
        suggested_mcp: [{ id: 20 }],
        suggested_agents: [{ id: 30 }],
        suggested_pipelines: [{ id: 40 }],
        suggested_skills: [{ id: 50 }],
      };

      act(() => result.current.handleDraftGenerated(draftData));

      expect(result.current.addToolkitIds.has(10)).toBe(true);
      expect(result.current.addToolkitIds.has(11)).toBe(true);
      expect(result.current.addMcpIds.has(20)).toBe(true);
      expect(result.current.addAgentIds.has(30)).toBe(true);
      expect(result.current.addPipelineIds.has(40)).toBe(true);
      expect(result.current.addSkillIds.has(50)).toBe(true);
    });

    it('does not pre-select suggestions already in current tools', () => {
      useFormikContext.mockReturnValue({
        values: makeFormikValues({
          version_details: {
            ...baseVersionDetails,
            tools: [{ type: 'jira', id: 10 }],
          },
        }),
        setFieldValue: mockSetFieldValue,
      });
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() =>
        result.current.handleDraftGenerated({
          suggested_toolkits: [{ id: 10 }, { id: 11 }],
        }),
      );

      expect(result.current.addToolkitIds.has(10)).toBe(false);
      expect(result.current.addToolkitIds.has(11)).toBe(true);
    });

    it('returns draftData unchanged', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      const draftData = { pipeline_yaml: 'yaml: true' };
      let returned;
      act(() => {
        returned = result.current.handleDraftGenerated(draftData);
      });
      expect(returned).toBe(draftData);
    });

    it('resets removeToolRecordIds to empty', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleRemoveTool(99));
      expect(result.current.removeToolRecordIds.has(99)).toBe(true);

      act(() => result.current.handleDraftGenerated({ suggested_toolkits: [] }));
      expect(result.current.removeToolRecordIds.size).toBe(0);
    });
  });

  describe('handleSave — create mode', () => {
    it('sets version_details.instructions from pipeline_yaml', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: 'new_yaml: true',
          suggested_toolkits: [],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [],
        });
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('version_details.instructions', 'new_yaml: true');
    });

    it('fetches full toolkit details and builds attachment', async () => {
      const fullToolkit = {
        id: 10,
        name: 'Jira',
        type: 'jira',
        settings: { sharepoint_configuration: { site: 'x' } },
      };
      vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: fullToolkit }),
      ]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddToolkit(10));

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [{ id: 10, name: 'Jira', project_id: 1 }],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [],
        });
      });

      const fetchFn = getFetchToolkitDetailsFn();
      expect(fetchFn).toHaveBeenCalledWith({ projectId: 1, toolkitId: 10 });
      // Full details object passed, not the sparse suggestion
      expect(buildToolkitAttachment).toHaveBeenCalledWith(fullToolkit, { mcp: false });

      const toolsCall = mockSetFieldValue.mock.calls.find(c => c[0] === 'version_details.tools');
      expect(toolsCall[1]).toHaveLength(1);
    });

    it('fetches full mcp details and builds attachment with mcp:true', async () => {
      const fullMcp = { id: 20, name: 'MyMcp', type: 'mcp', settings: { url: 'https://mcp.example.com' } };
      vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([vi.fn().mockResolvedValue({ data: fullMcp })]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddMcp(20));

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [],
          suggested_mcp: [{ id: 20, name: 'MyMcp', project_id: 1 }],
          suggested_agents: [],
          suggested_pipelines: [],
        });
      });

      expect(buildToolkitAttachment).toHaveBeenCalledWith(fullMcp, { mcp: true });
    });

    it('fetches app details and builds agent attachment', async () => {
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { version_details: { id: 99 } } }),
      ]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddAgent(30));

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [],
          suggested_mcp: [],
          suggested_agents: [{ id: 30, name: 'My Agent', project_id: 1 }],
          suggested_pipelines: [],
        });
      });

      const fetchFn = getFetchApplicationDetailsFn();
      expect(fetchFn).toHaveBeenCalledWith({ projectId: 1, applicationId: 30 });
      expect(buildApplicationAttachment).toHaveBeenCalledWith(
        { id: 30, name: 'My Agent', project_id: 1 },
        { id: 99 },
      );
    });

    it('does not include unselected suggestions in tools', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [{ id: 10 }, { id: 11 }],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [],
        });
      });

      const toolsCall = mockSetFieldValue.mock.calls.find(c => c[0] === 'version_details.tools');
      expect(toolsCall).toBeDefined();
      expect(toolsCall[1]).toHaveLength(0);
    });

    it('uses project_id fallback when suggestion has no project_id', async () => {
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { version_details: { id: 42 } } }),
      ]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddPipeline(40));

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [{ id: 40, name: 'My Pipeline' }], // no project_id
        });
      });

      // Falls back to projectId=1 from useSelectedProjectId mock
      const fetchFn = getFetchApplicationDetailsFn();
      expect(fetchFn).toHaveBeenCalledWith({ projectId: 1, applicationId: 40 });
    });
  });

  describe('handleSaveAsVersion', () => {
    it('opens version modal', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleSaveAsVersion({ pipeline_yaml: 'yaml' }));
      expect(result.current.showVersionModal).toBe(true);
    });

    it('resets version name to empty string', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.setVersionName('old name'));
      act(() => result.current.handleSaveAsVersion({ pipeline_yaml: 'yaml' }));
      expect(result.current.versionName).toBe('');
    });
  });

  describe('version modal state', () => {
    it('showVersionModal starts as false', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      expect(result.current.showVersionModal).toBe(false);
    });

    it('setShowVersionModal closes the modal', () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleSaveAsVersion({ pipeline_yaml: '' }));
      expect(result.current.showVersionModal).toBe(true);
      act(() => result.current.setShowVersionModal(false));
      expect(result.current.showVersionModal).toBe(false);
    });
  });

  describe('handleSave — create mode with all tool types together', () => {
    it('builds all selected tool types and writes them into formik at once', async () => {
      vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { id: 10, name: 'Jira', type: 'jira', settings: {} } }),
      ]);
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { version_details: { id: 99 } } }),
      ]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => {
        result.current.handleToggleAddToolkit(10);
        result.current.handleToggleAddMcp(20);
        result.current.handleToggleAddAgent(30);
        result.current.handleToggleAddPipeline(40);
        // skills are skipped in create mode — no handleToggleAddSkill needed
      });

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: 'combined: true',
          suggested_toolkits: [{ id: 10, name: 'Jira' }],
          suggested_mcp: [{ id: 20, name: 'MyMcp' }],
          suggested_agents: [{ id: 30, name: 'My Agent', project_id: 1 }],
          suggested_pipelines: [{ id: 40, name: 'My Pipeline', project_id: 1 }],
          suggested_skills: [{ id: 50, name: 'My Skill' }],
        });
      });

      const toolsCall = mockSetFieldValue.mock.calls.find(c => c[0] === 'version_details.tools');
      expect(toolsCall).toBeDefined();
      // toolkit + mcp + 1 agent + 1 pipeline = 4 entries; skill omitted (no version_id yet)
      expect(toolsCall[1]).toHaveLength(4);

      const tkFetchFn = getFetchToolkitDetailsFn();
      expect(tkFetchFn).toHaveBeenCalledTimes(2); // toolkit + mcp
      const appFetchFn = getFetchApplicationDetailsFn();
      expect(appFetchFn).toHaveBeenCalledTimes(2); // agent + pipeline
      expect(buildApplicationAttachment).toHaveBeenCalledTimes(2);
    });

    it('keeps selected skills pending until the pipeline exists', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddSkill(50));

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [],
          suggested_skills: [
            { id: 50, name: 'S' },
            { id: 51, name: 'not ticked' },
          ],
        });
      });

      const toolsCall = mockSetFieldValue.mock.calls.find(c => c[0] === 'version_details.tools');
      expect(toolsCall[1]).toHaveLength(0);
      expect(mockSetFieldValue).toHaveBeenCalledWith('pending_skills', [{ id: 50, name: 'S' }]);
      expect(getUpdateSkillRelationFn()).not.toHaveBeenCalled();
    });

    it('merges new suggestions into tools already in the create form', async () => {
      const existing = [
        { id: 7, type: 'github', name: 'GH already attached' },
        { id: 8, type: 'jira', name: 'Jira to remove' },
      ];
      vi.mocked(useFormikContext).mockReturnValue({
        values: makeFormikValues({
          id: undefined,
          version_details: { ...baseVersionDetails, tools: existing },
        }),
        setFieldValue: mockSetFieldValue,
      });
      vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([
        vi.fn(({ toolkitId }) =>
          Promise.resolve({ data: { id: toolkitId, type: 'sharepoint', name: `tk${toolkitId}` } }),
        ),
      ]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: true, onClose: mockOnClose }),
      );

      act(() => {
        result.current.handleToggleAddToolkit(7);
        result.current.handleToggleAddToolkit(12);
        result.current.handleToggleRemoveTool(8);
      });

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: '',
          suggested_toolkits: [
            { id: 7, name: 'GH' },
            { id: 12, name: 'SP' },
          ],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [],
        });
      });

      const toolsCall = mockSetFieldValue.mock.calls.find(c => c[0] === 'version_details.tools');
      expect(toolsCall[1].map(t => t.id)).toEqual([7, 12]);
      expect(toolsCall[1][0].name).toBe('GH already attached');
    });
  });

  describe('handleSave — edit mode', () => {
    const editFormikValues = makeFormikValues({
      id: 1,
      version_details: {
        ...baseVersionDetails,
        id: 10,
        tools: [
          { type: 'jira', id: 101, name: 'Jira' },
          { type: 'mcp', id: 102, name: 'MCP Tool' },
          {
            type: 'application',
            agent_type: 'classic',
            settings: { application_id: 200, application_version_id: 201 },
            id: 103,
          },
        ],
      },
    });

    const draftWithSuggestions = {
      pipeline_yaml: 'updated: true',
      suggested_toolkits: [{ id: 300, name: 'GitHub' }],
      suggested_mcp: [{ id: 301, name: 'New MCP' }],
      suggested_agents: [{ id: 400, name: 'New Agent' }],
      suggested_pipelines: [],
      suggested_skills: [],
    };

    beforeEach(() => {
      useFormikContext.mockReturnValue({ values: editFormikValues, setFieldValue: mockSetFieldValue });
      // Default: fresh tools returned after association call
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({
          data: {
            version_details: {
              id: 10,
              tools: [
                { type: 'jira', id: 101 },
                { type: 'github', id: 300 },
              ],
            },
          },
        }),
      ]);
    });

    it('loads the draft as an unsaved edit, keeping the saved version as the discard baseline', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      await act(async () => {
        await result.current.handleSave(draftWithSuggestions);
      });

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'pipelineEditor/reset' }));
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pipeline/applyDraft',
          payload: expect.objectContaining({ yamlCode: 'updated: true' }),
        }),
      );
      expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pipeline/init' }));
    });

    it('associates selected toolkit with the existing version', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddToolkit(300));

      await act(async () => {
        await result.current.handleSave(draftWithSuggestions);
      });

      const associateFn = getAssociateToolkitFn();
      expect(associateFn).toHaveBeenCalledWith(
        expect.objectContaining({ toolkitId: 300, entity_version_id: 10, has_relation: true }),
      );
    });

    it('associates selected mcp with the existing version', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddMcp(301));

      await act(async () => {
        await result.current.handleSave(draftWithSuggestions);
      });

      const associateFn = getAssociateToolkitFn();
      expect(associateFn).toHaveBeenCalledWith(
        expect.objectContaining({ toolkitId: 301, entity_version_id: 10, has_relation: true }),
      );
    });

    it('fetches agent details and calls updateApplicationRelation', async () => {
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi
          .fn()
          .mockResolvedValueOnce({ data: { version_details: { id: 401 } } }) // associate agent
          .mockResolvedValueOnce({ data: { version_details: { id: 10, tools: [] } } }), // fresh tools
      ]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddAgent(400));

      await act(async () => {
        await result.current.handleSave(draftWithSuggestions);
      });

      const updateAppRelFn = getUpdateApplicationRelationFn();
      expect(updateAppRelFn).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedApplicationId: 400,
          selectedVersionId: 401,
          application_id: 1,
          version_id: 10,
          has_relation: true,
        }),
      );
    });

    it('disassociates a toolkit marked for removal', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      // id 101 is the jira toolkit in editFormikValues.tools
      act(() => result.current.handleToggleRemoveTool(101));

      await act(async () => {
        await result.current.handleSave({ ...draftWithSuggestions, suggested_toolkits: [] });
      });

      const associateFn = getAssociateToolkitFn();
      expect(associateFn).toHaveBeenCalledWith(
        expect.objectContaining({ toolkitId: 101, entity_version_id: 10, has_relation: false }),
      );
    });

    it('disassociates an mcp tool marked for removal', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      // id 102 is the mcp tool in editFormikValues.tools
      act(() => result.current.handleToggleRemoveTool(102));

      await act(async () => {
        await result.current.handleSave({ ...draftWithSuggestions, suggested_toolkits: [] });
      });

      const associateFn = getAssociateToolkitFn();
      expect(associateFn).toHaveBeenCalledWith(
        expect.objectContaining({ toolkitId: 102, entity_version_id: 10, has_relation: false }),
      );
    });

    it('disassociates an application tool marked for removal', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      // id 103 is the application tool in editFormikValues.tools
      act(() => result.current.handleToggleRemoveTool(103));

      await act(async () => {
        await result.current.handleSave({ ...draftWithSuggestions, suggested_toolkits: [] });
      });

      const updateAppRelFn = getUpdateApplicationRelationFn();
      expect(updateAppRelFn).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedApplicationId: 200,
          selectedVersionId: 201,
          application_id: 1,
          version_id: 10,
          has_relation: false,
        }),
      );
    });

    it('associates selected skill in edit mode', async () => {
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { version_details: { id: 10, tools: [] } } }),
      ]);
      vi.mocked(useLazySkillDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { version_details: { id: 501 } } }),
      ]);

      const draftWithSkill = {
        ...draftWithSuggestions,
        suggested_toolkits: [],
        suggested_mcp: [],
        suggested_agents: [],
        suggested_skills: [{ id: 50, name: 'My Skill', project_id: 1 }],
      };

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleToggleAddSkill(50));

      await act(async () => {
        await result.current.handleSave(draftWithSkill);
      });

      const fetchSkillFn = getFetchSkillDetailsFn();
      expect(fetchSkillFn).toHaveBeenCalledWith({ projectId: 1, skillId: 50 });

      const updateSkillFn = getUpdateSkillRelationFn();
      expect(updateSkillFn).toHaveBeenCalledWith(
        expect.objectContaining({
          skillId: 50,
          entity_version_id: 10,
          skill_version_id: 501,
          has_relation: true,
        }),
      );
    });

    it('re-reads tools from the version endpoint and keeps the AI edits as unsaved form changes', async () => {
      const freshTools = [{ id: 99, type: 'github', name: 'GH' }];
      const fetchVersion = vi.fn().mockResolvedValue({ data: { tools: freshTools } });
      vi.mocked(useLazyGetApplicationVersionDetailQuery).mockReturnValue([fetchVersion]);

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      await act(async () => {
        await result.current.handleSave({
          ...draftWithSuggestions,
          name: 'renamed',
          description: 'new desc',
        });
      });

      expect(fetchVersion).toHaveBeenCalledWith({ projectId: 1, applicationId: 1, versionId: 10 });
      expect(mockSetFieldValue).toHaveBeenCalledWith('version_details.tools', freshTools);
      expect(mockSetFieldValue).toHaveBeenCalledWith('name', 'renamed');
      expect(mockSetFieldValue).toHaveBeenCalledWith('description', 'new desc');
      expect(mockSetFieldValue).toHaveBeenCalledWith('version_details.instructions', 'updated: true');
      // the edit page's form is never reinitialized from the application details query
      expect(getFetchApplicationDetailsFn().mock.calls.some(([arg]) => arg?.applicationId === 1)).toBe(false);
    });

    it('does not call associateToolkit or updateApplicationRelation when nothing is selected or removed', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      await act(async () => {
        await result.current.handleSave({
          pipeline_yaml: 'no_tools: true',
          suggested_toolkits: [],
          suggested_mcp: [],
          suggested_agents: [],
          suggested_pipelines: [],
          suggested_skills: [],
        });
      });

      const associateFn = getAssociateToolkitFn();
      const updateAppRelFn = getUpdateApplicationRelationFn();
      const addCalls = associateFn.mock.calls.filter(c => c[0]?.has_relation === true);
      const removeCalls = associateFn.mock.calls.filter(c => c[0]?.has_relation === false);
      expect(addCalls).toHaveLength(0);
      expect(removeCalls).toHaveLength(0);
      expect(updateAppRelFn).not.toHaveBeenCalled();
    });
  });

  describe('handleConfirmSaveAsVersion', () => {
    const emptyDraft = {
      pipeline_yaml: 'save_version: true',
      suggested_toolkits: [],
      suggested_mcp: [],
      suggested_agents: [],
      suggested_pipelines: [],
      suggested_skills: [],
    };

    beforeEach(() => {
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn().mockResolvedValue({ data: { version_details: { id: 10, tools: [] } } }),
      ]);
    });

    it('calls handleSave then onCreateNewVersion then closes modal and calls onClose', async () => {
      const mockOnCreateNewVersion = vi.fn().mockResolvedValue(undefined);
      const useSaveNewVersion = await import('@/hooks/application/useSaveNewVersion');
      vi.mocked(useSaveNewVersion.default).mockReturnValue({ onCreateNewVersion: mockOnCreateNewVersion });

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleSaveAsVersion(emptyDraft));
      act(() => result.current.setVersionName('v2'));

      await act(async () => {
        await result.current.handleConfirmSaveAsVersion();
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('version_details.instructions', 'save_version: true');
      expect(mockOnCreateNewVersion).toHaveBeenCalledWith('v2');
      expect(result.current.showVersionModal).toBe(false);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does nothing when no pending draft', async () => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      await act(async () => {
        await result.current.handleConfirmSaveAsVersion();
      });

      expect(mockSetFieldValue).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('isSavingAsVersion is false after completion', async () => {
      const mockOnCreateNewVersion = vi.fn().mockResolvedValue(undefined);
      const useSaveNewVersion = await import('@/hooks/application/useSaveNewVersion');
      vi.mocked(useSaveNewVersion.default).mockReturnValue({ onCreateNewVersion: mockOnCreateNewVersion });

      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );

      act(() => result.current.handleSaveAsVersion(emptyDraft));

      await act(async () => {
        await result.current.handleConfirmSaveAsVersion();
      });

      expect(result.current.isSavingAsVersion).toBe(false);
    });
  });
});
