// @vitest-environment jsdom
import { useFormikContext } from 'formik';
import { useDispatch, useStore } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildApplicationAttachment,
  buildToolkitAttachment,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers';
import { useGetApplicationSkillsQuery } from '@/[fsd]/features/skill';
import { useLazyApplicationDetailsQuery, useLazyToolkitsDetailsQuery } from '@/api';
import { calculateNodesAndEdges } from '@/pages/Pipelines/useSavePipeline';
import { act, renderHook } from '@testing-library/react';

import { useAIEditPipelineModal } from '../useAIEditPipelineModal.hooks';
import { useAttachSkills } from '../useAttachSkills.hooks';

vi.mock('formik', () => ({ useFormikContext: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: vi.fn(), useStore: vi.fn() }));
vi.mock('js-yaml', () => ({ default: { load: vi.fn(() => ({})) } }));

vi.mock('@/[fsd]/features/pipelines/api/generatePipelineApi', () => ({
  useGeneratePipelineDraftMutation: vi.fn(() => [vi.fn(), { error: null, reset: vi.fn() }]),
}));

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/helpers', () => ({
  DumpYamlHelpers: { dumpYaml: vi.fn(obj => `editor:${JSON.stringify(obj)}`) },
  FlowEditorHelpers: { convertNode: vi.fn(n => n) },
}));

vi.mock('@/pages/Pipelines/useSavePipeline', () => ({
  calculateNodesAndEdges: vi.fn(() => ({ nodes: [], edges: [] })),
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

vi.mock('../useAttachSkills.hooks', () => ({ useAttachSkills: vi.fn() }));
vi.mock('@/[fsd]/features/skill', () => ({ useGetApplicationSkillsQuery: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: vi.fn(() => 1),
  useToast: vi.fn(() => ({ toastError: vi.fn(), toastSuccess: vi.fn(), toastWarning: vi.fn() })),
}));

vi.mock('@/api', () => ({
  useLazyApplicationDetailsQuery: vi.fn(() => [vi.fn()]),
  useLazyToolkitsDetailsQuery: vi.fn(() => [vi.fn()]),
}));

vi.mock('@/hooks/application/useSaveNewVersion', () => ({
  default: vi.fn(() => ({ onCreateNewVersion: vi.fn() })),
}));

vi.mock('@/slices/pipeline', () => ({
  actions: {
    initThePipeline: vi.fn(p => ({ type: 'pipeline/init', payload: p })),
    applyPipelineDraft: vi.fn(p => ({ type: 'pipeline/applyDraft', payload: p })),
    markPipelineSaved: vi.fn(p => ({ type: 'pipeline/markSaved', payload: p })),
  },
}));

vi.mock('@/slices/pipelineEditor', () => ({
  actions: { resetPipelineEditor: vi.fn(() => ({ type: 'pipelineEditor/reset' })) },
}));

const mockSetFieldValue = vi.fn().mockResolvedValue(undefined);
const mockResetForm = vi.fn();
const mockAttachSkills = vi.fn().mockResolvedValue(undefined);
let canvasState = { resetFlag: false, yamlCode: 'canvas_yaml: true' };
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

const emptySuggestions = {
  suggested_toolkits: [],
  suggested_mcp: [],
  suggested_agents: [],
  suggested_pipelines: [],
  suggested_skills: [],
};

const toolsWritten = () => mockSetFieldValue.mock.calls.find(c => c[0] === 'version_details.tools')?.[1];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([vi.fn()]);
  vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([vi.fn()]);
  vi.mocked(useAttachSkills).mockReturnValue(mockAttachSkills);
  vi.mocked(useGetApplicationSkillsQuery).mockReturnValue({ data: undefined });
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

    it('rewrites the draft YAML in the editor format and keeps the rest of the draft', async () => {
      const YAML = (await import('js-yaml')).default;
      vi.mocked(YAML.load).mockReturnValueOnce({ nodes: [{ id: 'a' }] });
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      const draftData = { name: 'n', pipeline_yaml: 'nodes:\n- id: a\n' };
      let returned;
      act(() => {
        returned = result.current.handleDraftGenerated(draftData);
      });
      expect(returned).toEqual({
        name: 'n',
        pipeline_yaml: 'editor:{"nodes":[{"id":"a"}]}',
        suggested_skills: [],
      });
    });

    it('keeps the draft YAML as it is when it does not parse to an object', async () => {
      const YAML = (await import('js-yaml')).default;
      vi.mocked(YAML.load).mockImplementationOnce(() => {
        throw new Error('bad yaml');
      });
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      let returned;
      act(() => {
        returned = result.current.handleDraftGenerated({ pipeline_yaml: ': not yaml' });
      });
      expect(returned.pipeline_yaml).toBe(': not yaml');
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

  describe('handleSave', () => {
    const render = isCreateMode =>
      renderHook(() => useAIEditPipelineModal({ isCreateMode, onClose: mockOnClose }));

    it('writes the draft YAML, name and description into the form', async () => {
      const { result } = render(false);
      await act(async () => {
        await result.current.handleSave({
          ...emptySuggestions,
          pipeline_yaml: 'new: true',
          name: 'n',
          description: 'd',
        });
      });
      expect(mockSetFieldValue).toHaveBeenCalledWith('version_details.instructions', 'new: true');
      expect(mockSetFieldValue).toHaveBeenCalledWith('name', 'n');
      expect(mockSetFieldValue).toHaveBeenCalledWith('description', 'd');
    });

    it('lays the draft out with the saved canvas positions', async () => {
      const { result } = render(false);
      await act(async () => {
        await result.current.handleSave({ ...emptySuggestions, pipeline_yaml: 'new: true' });
      });
      expect(calculateNodesAndEdges).toHaveBeenCalledWith('new: true', 'horizontal', []);
    });

    it('loads an existing pipeline draft as an unsaved edit, a new one as the starting point', async () => {
      const edit = render(false);
      await act(async () => {
        await edit.result.current.handleSave({ ...emptySuggestions, pipeline_yaml: 'a: 1' });
      });
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'pipeline/applyDraft' }));

      mockDispatch.mockClear();
      const create = render(true);
      await act(async () => {
        await create.result.current.handleSave({ ...emptySuggestions, pipeline_yaml: 'a: 1' });
      });
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'pipeline/init' }));
    });

    it('builds ticked toolkits, MCPs, agents and pipelines from their full details', async () => {
      vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([
        vi.fn(({ toolkitId }) => Promise.resolve({ data: { id: toolkitId, name: `tk${toolkitId}` } })),
      ]);
      vi.mocked(useLazyApplicationDetailsQuery).mockReturnValue([
        vi.fn(() => Promise.resolve({ data: { version_details: { id: 900 } } })),
      ]);
      const { result } = render(false);
      act(() => {
        result.current.handleToggleAddToolkit(10);
        result.current.handleToggleAddMcp(20);
        result.current.handleToggleAddAgent(30);
      });
      await act(async () => {
        await result.current.handleSave({
          ...emptySuggestions,
          pipeline_yaml: '',
          suggested_toolkits: [{ id: 10 }, { id: 11 }],
          suggested_mcp: [{ id: 20 }],
          suggested_agents: [{ id: 30, project_id: 5 }],
        });
      });
      expect(buildToolkitAttachment).toHaveBeenCalledWith({ id: 10, name: 'tk10' }, { mcp: false });
      expect(buildToolkitAttachment).toHaveBeenCalledWith({ id: 20, name: 'tk20' }, { mcp: true });
      expect(buildApplicationAttachment).toHaveBeenCalledWith({ id: 30, project_id: 5 }, { id: 900 });
      expect(toolsWritten()).toHaveLength(3);
    });

    it('only changes the form: keeps current tools, drops ones ticked for removal, skips duplicates', async () => {
      useFormikContext.mockReturnValue({
        values: makeFormikValues({
          version_details: {
            ...baseVersionDetails,
            tools: [
              { id: 7, type: 'github', name: 'kept' },
              { id: 8, type: 'jira', name: 'removed' },
            ],
          },
        }),
        setFieldValue: mockSetFieldValue,
      });
      vi.mocked(useLazyToolkitsDetailsQuery).mockReturnValue([
        vi.fn(({ toolkitId }) => Promise.resolve({ data: { id: toolkitId, name: `tk${toolkitId}` } })),
      ]);
      const { result } = render(false);
      act(() => {
        result.current.handleToggleAddToolkit(7);
        result.current.handleToggleAddToolkit(12);
        result.current.handleToggleRemoveTool(8);
      });
      await act(async () => {
        await result.current.handleSave({
          ...emptySuggestions,
          pipeline_yaml: '',
          suggested_toolkits: [{ id: 7 }, { id: 12 }],
        });
      });
      expect(toolsWritten().map(t => t.id)).toEqual([7, 12]);
      expect(toolsWritten()[0].name).toBe('kept');
    });

    it('drops skills the version already has from an edit draft, keeping a same-id catalog skill', () => {
      vi.mocked(useGetApplicationSkillsQuery).mockReturnValue({ data: { skills: [{ skill_id: 50 }] } });
      const { result } = render(false);
      let shown;
      act(() => {
        shown = result.current.handleDraftGenerated({
          ...emptySuggestions,
          suggested_skills: [{ id: 50 }, { id: 51 }, { id: 50, project_id: 1 }],
        });
      });
      expect(shown.suggested_skills).toEqual([{ id: 51 }, { id: 50, project_id: 1 }]);
      expect(useGetApplicationSkillsQuery).toHaveBeenCalledWith(
        { projectId: 1, appVersionId: 10 },
        { skip: false },
      );
    });

    it('does not load version skills in create mode', () => {
      render(true);
      expect(useGetApplicationSkillsQuery).toHaveBeenCalledWith(expect.anything(), { skip: true });
    });

    it('attaches ticked skills to the current version in edit mode', async () => {
      const { result } = render(false);
      act(() => result.current.handleToggleAddSkill(50));
      await act(async () => {
        await result.current.handleSave({
          ...emptySuggestions,
          pipeline_yaml: '',
          suggested_skills: [{ id: 50 }, { id: 51 }],
        });
      });
      expect(mockAttachSkills).toHaveBeenCalledWith([{ id: 50 }], 10);
    });

    it('keeps ticked skills pending in create mode, until the pipeline exists', async () => {
      const { result } = render(true);
      act(() => result.current.handleToggleAddSkill(50));
      await act(async () => {
        await result.current.handleSave({
          ...emptySuggestions,
          pipeline_yaml: '',
          suggested_skills: [{ id: 50 }],
        });
      });
      expect(mockSetFieldValue).toHaveBeenCalledWith('pending_skills', [{ id: 50 }]);
      expect(mockAttachSkills).not.toHaveBeenCalled();
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

  describe('handleConfirmSaveAsVersion', () => {
    const draft = {
      name: 'ai suggested name',
      description: 'ai suggested description',
      pipeline_yaml: 'save_version: true',
      suggested_toolkits: [],
      suggested_mcp: [],
      suggested_agents: [],
      suggested_pipelines: [],
      suggested_skills: [],
    };

    const mockCreate = async (resolved = { data: { id: 77 } }) => {
      const create = vi.fn().mockResolvedValue(resolved);
      const useSaveNewVersion = await import('@/hooks/application/useSaveNewVersion');
      vi.mocked(useSaveNewVersion.default).mockReturnValue({ onCreateNewVersion: create });
      return create;
    };

    const confirm = async (versionName = 'v2') => {
      const { result } = renderHook(() =>
        useAIEditPipelineModal({ isCreateMode: false, onClose: mockOnClose }),
      );
      act(() => result.current.handleSaveAsVersion(draft));
      act(() => result.current.setVersionName(versionName));
      await act(async () => {
        await result.current.handleConfirmSaveAsVersion();
      });
      return result;
    };

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 50 });
      canvasState = { resetFlag: false, yamlCode: 'canvas_yaml: true' };
      vi.mocked(useStore).mockReturnValue({
        getState: () => ({
          pipeline: { byKey: { __default__: canvasState } },
          pipelineEditor: { nodes: [{ id: 'n' }] },
        }),
      });
      vi.mocked(useFormikContext).mockReturnValue({
        values: makeFormikValues({ versions: [{ id: 10, name: 'base' }] }),
        setFieldValue: mockSetFieldValue,
        resetForm: mockResetForm,
      });
    });

    afterEach(() => vi.useRealTimers());

    it('creates the version from the YAML the canvas settled on', async () => {
      const create = await mockCreate();
      await confirm('v2');
      expect(create).toHaveBeenCalledWith('v2', { yamlCode: 'canvas_yaml: true' });
    });

    it('does not apply the suggested name or description', async () => {
      await mockCreate();
      await confirm();
      expect(mockSetFieldValue).not.toHaveBeenCalledWith('name', expect.anything());
      expect(mockSetFieldValue).not.toHaveBeenCalledWith('description', expect.anything());
    });

    it('leaves the form clean and marks the canvas saved, then closes', async () => {
      await mockCreate();
      const result = await confirm();
      expect(mockResetForm).toHaveBeenCalledWith({
        values: expect.objectContaining({
          name: 'Test Pipeline',
          version_details: expect.objectContaining({ instructions: 'canvas_yaml: true' }),
        }),
      });
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'pipeline/markSaved' }));
      expect(result.current.showVersionModal).toBe(false);
      expect(result.current.isSavingAsVersion).toBe(false);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('keeps the form as it is when the version was not created', async () => {
      await mockCreate({ error: 'boom' });
      await confirm();
      expect(mockResetForm).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
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
  });
});
